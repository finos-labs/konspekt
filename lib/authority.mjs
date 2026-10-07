// konspekt authority — principals, grants, and the acceptors of an atom.
//
// Normative source: ../spec/architecture/AUTHORITY.md. Table formats:
// ../spec/architecture/SERIALIZATION.md § Authority.
//
// This module holds the parts of the authority model that more than one reader
// needs: the conformance checker (./conformance.mjs) evaluates recorded
// acceptances against the grants, and an accepting client evaluates a pending
// acceptance against the same grants before it writes the row. Both call
// `acceptorsAt`, so the checker and a client cannot disagree about who may
// accept an atom.
//
// Design commitments, matching ./conformance.mjs:
//   - Zero dependencies. Node only.
//   - Pure. No wall-clock, no network, no git subprocess. A caller that needs
//     "now" passes a timestamp.
//   - Never throws on malformed input. Each parser returns the rows it could
//     read; the checker reports what is wrong with them.

export const PRINCIPAL_KINDS = ["human", "agent"];
export const PRINCIPAL_ROLES = ["grantor"];
export const GRANT_ACTIONS = ["grant", "revoke"];
export const WHOLE_GRAPH = "*";

// Edge kinds that attach a non-node entity to a node, for subgraph membership.
// `notes`, `produces`, and `mentions` run node -> entity; `marks` runs
// waypoint -> node.
const ATTACH_FROM_NODE = new Set(["notes", "produces", "mentions"]);

// Rows of a Markdown table as arrays of trimmed cells, skipping the header row
// (first cell === headerCell) and the separator row.
export function tableRows(text, headerCell) {
  const rows = [];
  for (const line of String(text).split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (!cells.length || cells[0] === headerCell || /^-+$/.test(cells[0])) continue;
    rows.push(cells);
  }
  return rows;
}

// authority/principals.md: `| id | kind | roles | key |`.
export function parsePrincipals(text) {
  return tableRows(text, "id").map(([id, kind, roles, key], ix) => ({
    row: ix + 1,
    id: id || "",
    kind: kind || "",
    roles: (roles || "").split(",").map((r) => r.trim()).filter(Boolean),
    key: key || "",
  }));
}

// authority/grants.md: `| scope | acceptor | action | grantor | timestamp | source |`.
export function parseGrants(text) {
  return tableRows(text, "scope").map(([scope, acceptor, action, grantor, timestamp, source], ix) => ({
    row: ix + 1,
    scope: scope || "",
    acceptor: acceptor || "",
    action: action || "",
    grantor: grantor || "",
    timestamp: timestamp || "",
    ms: Date.parse(timestamp || ""),
    source: source || "",
  }));
}

// The entity id a scope names, or null for the whole graph or a malformed scope.
export function scopeEntityId(scope) {
  if (scope === WHOLE_GRAPH) return null;
  const ix = scope.indexOf(":");
  return ix === -1 ? null : scope.slice(ix + 1);
}

// Index the graph for subgraph membership. `entities` is an iterable of
// { id, entityType }; `edges` is an array of { id, kind, from: {type,id}, to: {type,id} }.
// Membership uses every edge regardless of its review state, so a proposed atom
// is inside the subgraph of the node it is proposed under.
export function buildScopeIndex(entities, edges) {
  const typeOf = new Map();
  for (const e of entities) typeOf.set(e.id, e.entityType);
  const up = new Map();       // entity id -> ids one step closer to the root
  const edgeFrom = new Map(); // edge id -> id of its `from` endpoint
  const link = (child, parent) => {
    if (!up.has(child)) up.set(child, new Set());
    up.get(child).add(parent);
  };
  for (const e of edges) {
    edgeFrom.set(e.id, e.from && e.from.id);
    if (!e.from || !e.to) continue;
    if (e.kind === "decomposes") link(e.to.id, e.from.id);
    else if (ATTACH_FROM_NODE.has(e.kind)) link(e.to.id, e.from.id);
    else if (e.kind === "marks") link(e.from.id, e.to.id);
  }
  // Every entity that encloses `ref`, with its distance: the atom's own entity
  // at 0, each `up` step adding 1. An edge takes the enclosure of its `from`
  // endpoint. Breadth-first, so each entity gets its minimum distance.
  const enclosing = (ref) => {
    const ix = ref.indexOf(":");
    const type = ix === -1 ? "" : ref.slice(0, ix);
    const id = ix === -1 ? ref : ref.slice(ix + 1);
    const start = type === "edge" ? edgeFrom.get(id) : id;
    const dist = new Map();
    if (!start || !typeOf.has(start)) return dist;
    dist.set(start, 0);
    let frontier = [start];
    while (frontier.length) {
      const next = [];
      for (const cur of frontier) {
        for (const p of up.get(cur) || []) {
          if (dist.has(p)) continue;
          dist.set(p, dist.get(cur) + 1);
          next.push(p);
        }
      }
      frontier = next;
    }
    return dist;
  };
  return { typeOf, enclosing };
}

// Active grants at `ms`: scope -> Set of acceptor ids. Rows apply in file order;
// a `revoke` row removes the acceptor from that scope. A row with an
// unparseable timestamp never becomes active.
export function activeGrants(grants, ms) {
  const active = new Map();
  for (const g of grants) {
    if (Number.isNaN(g.ms) || g.ms > ms) continue;
    if (!active.has(g.scope)) active.set(g.scope, new Set());
    if (g.action === "grant") active.get(g.scope).add(g.acceptor);
    else if (g.action === "revoke") active.get(g.scope).delete(g.acceptor);
  }
  for (const [scope, set] of active) if (!set.size) active.delete(scope);
  return active;
}

// Who may accept `ref` at `ms`. The grant scope nearest to the atom applies; the
// whole-graph scope applies only when no entity scope encloses the atom. Returns
//   scopes     the applicable scope strings (more than one means the atom is at
//              the same distance from two granted entities)
//   acceptors  the union of the acceptors granted on those scopes
//   ambiguous  scopes.length > 1
export function acceptorsAt(grants, index, ref, ms = Infinity) {
  const active = activeGrants(grants, ms);
  const byEntity = new Map(); // entity id -> scope string
  for (const scope of active.keys()) {
    const id = scopeEntityId(scope);
    if (id && index.typeOf.get(id) === scope.slice(0, scope.indexOf(":"))) byEntity.set(id, scope);
  }
  let best = Infinity;
  let scopes = [];
  for (const [id, d] of index.enclosing(ref)) {
    if (!byEntity.has(id) || d > best) continue;
    if (d < best) { best = d; scopes = []; }
    scopes.push(byEntity.get(id));
  }
  if (!scopes.length && active.has(WHOLE_GRAPH)) scopes = [WHOLE_GRAPH];
  const acceptors = new Set();
  for (const s of scopes) for (const a of active.get(s)) acceptors.add(a);
  return { scopes: scopes.sort(), acceptors, ambiguous: scopes.length > 1 };
}
