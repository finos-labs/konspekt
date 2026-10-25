// Fold: append a verified stored-form atom onto canonical
// (nw-fleet-remove-fold-translation; fleet-spec.md § Committer protocol, step 4).
//
// The proposer authors entity.md in konspekt's ```yaml-fenced stored form, with
// `review: proposed` and provenance already set. Fold no longer translates a
// payload into that form — it is verify-and-append: it writes entity.md onto
// canonical byte for byte and wires it in the same pass (source excerpt, the
// edge rows that reference it, and a birth row in the transition log for the
// entity and every edge), so canonical never lands partially wired
// (nw-fleet-committer-role-split). The git commit is the caller's
// (committer.mjs appends the whole verified batch in one commit); this module
// only writes files, which keeps it testable against lib/validate.mjs with no
// repository present.
//
// The committer invents no content and rewrites nothing: it copies the
// proposer's atom unchanged and records which agent authored it in the
// transition `by` column, from the authenticated branch owner carried in the
// fleet envelope.

import { join, dirname } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { canonicalizeEntity, computeFileHash, normalizeFileTarget } from "./payload.mjs";
import { appendFoldRecord } from "./proposed-ref.mjs";
import { splitEntityFile } from "../../../lib/conformance.mjs";

// Where each entity type's file lives, and the id prefix the store expects.
const ENTITY_DIR = {
  concept: { dir: "concepts", prefix: "concept-" },
  noteworthy: { dir: "noteworthy", prefix: "nw-" },
  artifact: { dir: "artifacts", prefix: "artifact-" },
  waypoint: { dir: "waypoints", prefix: "wp-" },
  // node is placed under nodes/<type>/, resolved from the entity's own `type`.
};

// Parse an edges.md table body into rows. Accepts the header/separator and skips
// them; a blank or non-table line is ignored.
export function parseEdgeRows(edgesMdText) {
  const rows = [];
  for (const line of String(edgesMdText ?? "").split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    if (cells[0] === "id" || /^-+$/.test(cells[0])) continue;
    const [id, kind, from, to, weight, review] = cells;
    rows.push({ id, kind, from, to, weight: weight ?? "", review: review || "proposed" });
  }
  return rows;
}

function appendRows(path, rows) {
  if (rows.length === 0) return;
  let existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (existing.length && !existing.endsWith("\n")) existing += "\n";
  writeFileSync(path, existing + rows.map((r) => r + "\n").join(""), "utf8");
}

const txRow = (ref, field, to, timestamp, by) => `| ${ref} | ${field} |  | ${to} | ${timestamp} |  | ${by ?? ""} |`;
const edgeRow = (r) => `| ${r.id} | ${r.kind} | ${r.from} | ${r.to} | ${r.weight ?? ""} | ${r.review || "proposed"} |`;

// Append one verified proposal onto `instanceDir`. Writes the entity file
// verbatim, the source excerpt, the wiring edge rows, and the birth transition
// rows. Returns a manifest of what it wrote. `now` supplies the transition
// timestamp when the atom carries none.
//
// Throws only on a proposal the committer cannot place (no fence/id, unknown
// entity type, an id without its type's prefix, no source hash, or an entity its
// own edges do not wire): these are set-aside conditions the caller reports,
// never a partial write — the caller appends the batch in one commit, so a throw
// here aborts before any commit.
export function foldProposal(instanceDir, { entityMd, sourceMd, edgesMd, meta = {}, files = [], proposalId = null }, { now, fleetDir, repoRoot = null, instanceSubdir = "" } = {}) {
  // Fail closed before any write: if `instanceDir` is not a konspekt instance
  // (its append-only `edges/edges.md` is absent), a wrong --instance-subdir or an
  // unset fleet.json instanceSubdir has pointed fold at the wrong directory —
  // typically the repo root. Refuse here, before the source-excerpt and entity
  // writes, so a misconfigured pass cannot scatter files outside the instance
  // and then fail on the edges append (task-fleet-adjustments).
  if (!existsSync(join(instanceDir, "edges", "edges.md"))) {
    throw new Error(
      `no konspekt instance at "${instanceDir}" (missing edges/edges.md); refusing ` +
        `to fold — check --instance-subdir or the fleet config's instanceSubdir`,
    );
  }
  const entityText = canonicalizeEntity(entityMd).toString("utf8");
  const { front } = splitEntityFile(entityText);
  const id = front.id;
  if (!id) throw new Error("entity.md has no ```yaml fence with an id");

  const entityType = String(meta.entity_type || "").toLowerCase();
  let relDir;
  let prefix;
  if (entityType === "node") {
    const nodeType = front.type;
    if (!nodeType) throw new Error(`node "${id}" has no type to place it under nodes/<type>/`);
    relDir = join("nodes", nodeType);
    prefix = "";
  } else {
    const place = ENTITY_DIR[entityType];
    if (!place) throw new Error(`unknown entity_type "${entityType}" — cannot place the entity file`);
    relDir = place.dir;
    prefix = place.prefix;
  }
  if (prefix && !id.startsWith(prefix)) {
    throw new Error(`${entityType} id "${id}" does not start with "${prefix}"`);
  }

  const edgeRows = parseEdgeRows(edgesMd);
  // The atom must land wired: at least one of its edges references the entity.
  const wiresEntity = edgeRows.some((r) => r.from.endsWith(`:${id}`) || r.to.endsWith(`:${id}`) || r.from === id || r.to === id);
  if (!wiresEntity) {
    throw new Error(`proposal for "${id}" carries no edge wiring it; a proposal must land wired`);
  }

  const prov = front.provenance || {};
  const sourceHash = prov.contentHash || prov.sourceRef;
  if (!sourceHash) throw new Error(`proposal for "${id}" has no provenance.contentHash`);
  const timestamp = prov.timestamp || front.createdAt || now || new Date().toISOString();
  const by = meta.origin && meta.origin.agent;

  // ----- idempotent fold (task-fleet-fold-idempotent-impl; contract in
  // artifact-fleet-outbox-lifecycle / docs/design/fleet-outbox-lifecycle.md) -----
  // Decide "already folded" from canonical alone: if the target entity file
  // exists and its provenance contentHash equals this proposal's source hash,
  // the atom is already on canonical. Skip it — write nothing, touch no edge or
  // transition rows, append no fold record — so a re-run over an un-consumed
  // outbox cannot clobber a blessed or rejected review back to proposed
  // (nw-fleet-refold-clobbers-blessed). A same-id entity carrying a different
  // hash is an id collision: set it aside rather than overwrite it.
  const relFile = join(relDir, `${id}.md`);
  const absFile = join(instanceDir, relFile);
  if (existsSync(absFile)) {
    const existingFront = splitEntityFile(readFileSync(absFile, "utf8")).front;
    const existingHash = (existingFront.provenance &&
      (existingFront.provenance.contentHash || existingFront.provenance.sourceRef)) || null;
    if (existingHash === sourceHash) {
      return {
        proposalId,
        entityType,
        entityId: id,
        file: relFile.split("\\").join("/"),
        edgeIds: edgeRows.map((r) => r.id),
        sourceRef: sourceHash,
        status: "already-folded",
      };
    }
    throw new Error(`id collision: "${id}" exists on canonical with a different contentHash`);
  }

  // ----- source excerpt -----
  const sourcesDir = join(instanceDir, "sources");
  mkdirSync(sourcesDir, { recursive: true });
  writeFileSync(join(sourcesDir, `${sourceHash}.md`), String(sourceMd), "utf8");

  // ----- entity file (verbatim: the bytes the proposer authored and signed) -----
  const absDir = join(instanceDir, relDir);
  mkdirSync(absDir, { recursive: true });
  writeFileSync(join(instanceDir, relFile), entityText, "utf8");

  // ----- edges -----
  appendRows(join(instanceDir, "edges", "edges.md"), edgeRows.map(edgeRow));

  // ----- transitions (birth rows; `by` is the authenticated proposer) -----
  const trRows = [txRow(`${entityType}:${id}`, "review", "proposed", timestamp, by)];
  if (entityType === "node" && front.status) {
    trRows.push(txRow(`node:${id}`, "status", front.status, timestamp, by));
  }
  for (const r of edgeRows) trRows.push(txRow(`edge:${r.id}`, "review", r.review || "proposed", timestamp, by));
  appendRows(join(instanceDir, "transitions", "transitions.md"), trRows);

  // ----- carried files (task-fleet-proposal-carries-files) -----
  // Write each carried file to its target on canonical (the repo root, NOT the
  // instance), re-vetting the target and re-checking the bytes against the
  // declared hash so a file that slipped past verify still cannot land wrong.
  // They ride in this same fold commit (commitAll stages the whole worktree);
  // binding each file's path in the changed-code log is the committer's
  // host-policy follow-up (see run-pass output), since that row points at this
  // commit and the log trails commits by one.
  const writtenFiles = [];
  const declaredFiles = Array.isArray(meta.files) ? meta.files : [];
  if (declaredFiles.length) {
    const root = repoRoot || instanceDir;
    const byPath = new Map((files ?? []).map((f) => [f.path, f]));
    for (const d of declaredFiles) {
      const vetted = normalizeFileTarget(d.path, { instanceSubdir });
      if (!vetted.ok) throw new Error(`carried file rejected: ${vetted.reason}`);
      const carried = byPath.get(d.path) ?? byPath.get(vetted.path);
      if (!carried || carried.bytes == null) throw new Error(`carried file ${vetted.path} is missing its bytes`);
      const actual = computeFileHash(carried.bytes);
      if (actual !== d.hash) throw new Error(`carried file ${vetted.path} hash mismatch at fold (${actual} != ${d.hash})`);
      const abs = join(root, ...vetted.path.split("/"));
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, carried.bytes);
      writtenFiles.push({ path: vetted.path, hash: d.hash });
    }
  }

  // ----- fleet fold log (derived-index linkage, outside the instance tree) -----
  // proposal_id is fleet vocabulary and does not enter the stored atom, so the
  // proposal -> atom linkage lands here, atomically in the same commit.
  appendFoldRecord(fleetDir || instanceDir, {
    proposalId,
    ref: `${entityType}:${id}`,
    agent: by,
    edges: edgeRows.map((r) => r.id),
  });

  return {
    proposalId,
    entityType,
    entityId: id,
    file: relFile.split("\\").join("/"),
    edgeIds: edgeRows.map((r) => r.id),
    files: writtenFiles,
    sourceRef: sourceHash,
    status: "folded",
  };
}

// Append an ordered batch of verified proposals onto `instanceDir`. Each is
// appended whole; a proposal already on canonical (same id and source hash) is
// skipped and reported in `alreadyFolded`, and a proposal the committer cannot
// place is set aside with its reason — the rest still append. Returns
// { folded, alreadyFolded, setAside }.
export function foldProposals(instanceDir, items, { now, fleetDir, repoRoot = null, instanceSubdir = "" } = {}) {
  const folded = [];
  const alreadyFolded = [];
  const setAside = [];
  for (const it of items) {
    try {
      const res = foldProposal(instanceDir, it, { now, fleetDir, repoRoot, instanceSubdir });
      if (res.status === "already-folded") alreadyFolded.push(res);
      else folded.push(res);
    } catch (e) {
      setAside.push({ proposalId: it.proposalId ?? null, reason: e.message });
    }
  }
  return { folded, alreadyFolded, setAside };
}
