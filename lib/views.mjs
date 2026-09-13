// konspekt — derived views (neutral shared query layer)
//
// Pure functions over a graph already loaded by lib/conformance.mjs. No parser,
// no wall-clock, no network. A CLI (tools/views.mjs) and any future UI both
// import these, so view semantics live once, in the standard's shape, rather
// than being reinvented per surface (nw-derive-not-copy).
//
// Two views, both derived — never stored:
//   goalState(graph, goalRef)          the decomposes sub-graph under a goal,
//                                       every node with its status. A DAG: a
//                                       node may sit under more than one parent.
//   provenanceChain(graph, entityRef)  an entity's own provenance plus its
//                                       supersession ancestry, each hop pinned
//                                       to its content-addressed source and
//                                       verifiable. Engineer layer adds executed
//                                       commands and the ASRs that drove it.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gitBlobSha } from "./conformance.mjs";

const stripType = (s) => (s && s.includes(":") ? s.slice(s.indexOf(":") + 1) : s);
const inc = (m, k) => m.set(k, (m.get(k) || 0) + 1);
const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };
const tally = (xs) => xs.reduce((a, x) => { const k = x ?? "(none)"; a[k] = (a[k] || 0) + 1; return a; }, {});

// ---------------------------------------------------------------------------
// View 1 — goal state
// ---------------------------------------------------------------------------
// The sub-graph reachable from a goal by `decomposes` edges, with each node's
// type / status / review. decomposes is node -> node, so the reachable set is
// all work nodes. Hierarchy lives in edges and a node can have several parents,
// so this is a DAG: each node appears once, at its minimum depth, listing every
// parent. Cheap per-node attachment counts (produced artifacts, attached
// findings, open assumptions) ride along because they cost one edge pass and
// feed the "under-worked goal" question later.
export function goalState(graph, goalRef) {
  const rootId = stripType(goalRef);
  const root = graph.byId.get(rootId);
  if (!root) throw new Error(`no entity with id "${rootId}"`);
  if (root.entityType !== "node") {
    throw new Error(`"${rootId}" is a ${root.entityType}, not a work node`);
  }

  const children = new Map();  // parentId -> [childId]
  const parents = new Map();   // childId  -> Set(parentId)
  for (const e of graph.edges) {
    if (e.kind !== "decomposes") continue;
    push(children, e.from.id, e.to.id);
    if (!parents.has(e.to.id)) parents.set(e.to.id, new Set());
    parents.get(e.to.id).add(e.from.id);
  }

  // DFS from the root; min-depth, first-visit order, cycle-guarded.
  const depth = new Map();
  const order = [];
  const seen = new Set();
  (function walk(id, d) {
    if (seen.has(id)) { if (d < depth.get(id)) depth.set(id, d); return; }
    seen.add(id);
    depth.set(id, d);
    order.push(id);
    for (const c of (children.get(id) || [])) walk(c, d + 1);
  })(rootId, 0);

  // Per-node attachments over the reachable set.
  const produces = new Map(), notes = new Map(), openAsm = new Map();
  for (const e of graph.edges) {
    if (!seen.has(e.from.id)) continue;
    if (e.kind === "produces") inc(produces, e.from.id);
    if (e.kind === "notes") {
      inc(notes, e.from.id);
      const nw = graph.byId.get(e.to.id);
      if (nw && nw.kind === "assumption" && (nw.status ?? "unvalidated") === "unvalidated") {
        inc(openAsm, e.from.id);
      }
    }
  }

  const rows = order.map((id) => {
    const n = graph.byId.get(id);
    const missing = !n;
    return {
      id,
      depth: depth.get(id),
      type: missing ? null : (n.type || null),
      status: missing ? null : (n.status || null),
      review: missing ? null : (n.review || null),
      title: missing ? null : (n.title || null),
      parents: [...(parents.get(id) || [])],
      produces: produces.get(id) || 0,
      notes: notes.get(id) || 0,
      openAssumptions: openAsm.get(id) || 0,
      missing,
    };
  });

  const descendants = rows.filter((r) => r.id !== rootId);
  return {
    root: rows[0],
    nodes: rows,
    rollup: {
      total: descendants.length,
      byStatus: tally(descendants.map((r) => r.status)),
      byType: tally(descendants.map((r) => r.type)),
      proposed: descendants.filter((r) => r.review === "proposed").length,
      openAssumptions: descendants.reduce((a, r) => a + r.openAssumptions, 0),
    },
  };
}

// ---------------------------------------------------------------------------
// View 2 — provenance chain
// ---------------------------------------------------------------------------
// An entity's provenance and everything it replaced. `supersedes` is
// from(new) -> to(old); walking from -> to yields older versions, newest first.
// It is a DAG (a merge can supersede several). Each hop reports its
// content-addressed source and, when a sourcesDir is given, whether re-hashing
// that source reproduces the recorded contentHash (the same probe the checker
// uses). When the engineer layer is active, executed-command provenance and the
// ASRs that drove the entity are added — the who-did-what and the forces behind
// a decision.
export function provenanceChain(graph, entityRef, opts = {}) {
  const startId = stripType(entityRef);
  if (!graph.byId.get(startId)) throw new Error(`no entity with id "${startId}"`);

  const olderOf = new Map();  // newId -> [oldId]   (supersedes from -> to)
  const newerOf = new Map();  // oldId -> [newId]   who supersedes X
  for (const e of graph.edges) {
    if (e.kind !== "supersedes") continue;
    push(olderOf, e.from.id, e.to.id);
    push(newerOf, e.to.id, e.from.id);
  }

  const supersededBy = newerOf.get(startId) || [];
  const chain = [];
  const seen = new Set();
  (function walk(id) {
    if (seen.has(id)) return;
    seen.add(id);
    chain.push(record(graph, id, opts));
    for (const older of (olderOf.get(id) || [])) walk(older);
  })(startId);

  const out = {
    entity: record(graph, startId, opts),
    current: supersededBy.length === 0,
    supersededBy,
    chain,  // newest first
  };

  const engineer = (graph.meta?.personas || []).includes("engineer") ||
    graph.edges.some((e) => e.kind === "executed" || e.kind === "drives");
  if (engineer) {
    const executed = graph.edges
      .filter((e) => e.kind === "executed" && e.from.id === startId)
      .map((e) => ({ command: e.to.id, review: e.review || null }));
    const drivenBy = graph.edges
      .filter((e) => e.kind === "drives" && e.to.id === startId)
      .map((e) => e.from.id);
    if (executed.length) out.executed = executed;
    if (drivenBy.length) out.drivenBy = drivenBy;
  }
  return out;
}

function record(graph, id, opts) {
  const e = graph.byId.get(id);
  const missing = !e;
  const p = (e && e.provenance) || {};
  return {
    id,
    entityType: missing ? null : (e.entityType || null),
    kind: missing ? null : (e.kind || e.type || null),   // noteworthy.kind / waypoint.kind / node.type
    subtype: missing ? null : (e.subtype || null),
    review: missing ? null : (e.review || null),
    timestamp: p.timestamp || null,
    sourceRef: p.sourceRef || null,
    contentHash: p.contentHash || null,
    conversationId: p.conversationId || null,
    verify: verifyProvenance(p, opts),
    missing,
  };
}

// The integrity gate: an entity verifies iff re-hashing its sourceRef reproduces
// its contentHash (spec/data-model § principle 3). Legacy entities carry only a
// conversationId and are not content-verifiable; that is reported, not failed.
function verifyProvenance(p, opts) {
  if (!p || (!p.sourceRef && !p.contentHash)) {
    return p && p.conversationId
      ? { mode: "legacy", ok: null, detail: "conversationId only; not content-verifiable" }
      : { mode: "none", ok: null, detail: "no provenance" };
  }
  if (!opts.sourcesDir) {
    return { mode: "content-addressed", ok: null, detail: "sourcesDir not supplied; not checked" };
  }
  const path = join(opts.sourcesDir, `${p.sourceRef}.md`);
  if (!existsSync(path)) {
    return { mode: "content-addressed", ok: false, detail: `sources/${p.sourceRef}.md missing` };
  }
  const actual = gitBlobSha(readFileSync(path));
  return actual === p.contentHash
    ? { mode: "content-addressed", ok: true, detail: "source hash matches contentHash" }
    : { mode: "content-addressed", ok: false, detail: `source hashes to ${actual}, contentHash says ${p.contentHash}` };
}
