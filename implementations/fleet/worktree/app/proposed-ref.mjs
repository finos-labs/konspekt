// The derived `proposed` index (fleet-spec.md § Committer protocol, step 4, and
// § Proposal state and reader filtering).
//
// Canonical is authoritative for proposal state: each atom's `review` field on
// canonical is the truth (proposed = pending, accepted = blessed, rejected =
// tombstone). The `proposed` index is a derived, rebuildable projection of that
// truth — it keeps the review queue cheap to read and survives an agent's
// worktree teardown, but it is never itself authoritative. A crash between the
// fold commit and an index update cannot make the store lie: the index is
// refreshed from canonical, and canonical is never refreshed from the index
// (nw-fleet-canonical-authoritative).
//
// The one piece of state that is NOT derivable from the stored atoms is the
// proposal_id -> atom linkage: proposal_id is fleet vocabulary and must not
// enter the stored data model (fleet-spec.md preamble). So fold writes an
// append-only fleet fold log under `.konspekt-fleet/`, OUTSIDE the validated
// instance tree, in the same commit as the atom. The index joins that log to the
// current `review` field of each atom on canonical.

import { join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { loadInstance } from "../../../../lib/conformance.mjs";
import { git } from "./git.mjs";

export const FLEET_DIR = ".konspekt-fleet";
const FOLD_LOG = "folded.md";
const INDEX_FILE = "proposed-index.json";

const STATE_FOR_REVIEW = { proposed: "pending", accepted: "accepted", rejected: "rejected" };

function fleetDirPath(canonicalRoot) {
  return join(canonicalRoot, FLEET_DIR);
}

// Append one fold record. Called by fold.mjs in the fold commit, so the linkage
// lands atomically with the atom it describes. `edges` is the atom's wiring edge
// ids, recorded so bless/reject can flip exactly the atom's own rows without
// re-reading the (possibly torn-down) outbox.
export function appendFoldRecord(canonicalRoot, { proposalId, ref, agent, edges = [] }) {
  const dir = fleetDirPath(canonicalRoot);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, FOLD_LOG);
  let existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (!existing) {
    existing =
      "# Fleet fold log\n\n" +
      "Append-only. Each row records a proposal folded onto canonical: its\n" +
      "proposal_id, the atom it became (`type:id`), the proposing agent, and the\n" +
      "wiring edge ids. This is fleet-side derived state, not part of the konspekt\n" +
      "graph; canonical is authoritative (nw-fleet-canonical-authoritative).\n\n" +
      "| proposal_id | ref | agent | edges |\n" +
      "|-------------|-----|-------|-------|\n";
  }
  if (existing.length && !existing.endsWith("\n")) existing += "\n";
  writeFileSync(path, existing + `| ${proposalId} | ${ref} | ${agent ?? ""} | ${edges.join(",")} |\n`, "utf8");
}

// Read the fold log into [{ proposalId, ref, agent, edgeIds }], in fold order.
export function readFoldLog(canonicalRoot) {
  const path = join(fleetDirPath(canonicalRoot), FOLD_LOG);
  if (!existsSync(path)) return [];
  const rows = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 2) continue;
    if (cells[0] === "proposal_id" || /^-+$/.test(cells[0])) continue;
    const edgeIds = cells[3] ? cells[3].split(",").map((s) => s.trim()).filter(Boolean) : [];
    rows.push({ proposalId: cells[0], ref: cells[1], agent: cells[2] || null, edgeIds });
  }
  return rows;
}

// Resolve the canonical commit that last touched an entity file (its fold or,
// later, its bless commit). Best-effort: null when there is no repository or the
// path is untracked, since the pointer is a convenience, not the state.
function lastCommitFor(canonicalRoot, relFile) {
  try {
    const h = git(canonicalRoot, ["log", "-1", "--format=%H", "--", relFile]);
    return h || null;
  } catch {
    return null;
  }
}

// Build the index by scanning canonical. Pure read: it joins the fold log to the
// current `review` of each atom and classifies it. This IS the rebuild — there
// is no incremental state to trust, so a fresh build after a crash is correct by
// construction. `instanceSubdir` locates the instance within the canonical
// worktree. `withCommits` resolves the per-atom canonical-commit pointer.
export function buildIndex(canonicalRoot, { instanceSubdir = "", withCommits = true } = {}) {
  const instanceDir = instanceSubdir ? join(canonicalRoot, instanceSubdir) : canonicalRoot;
  const { byId } = loadInstance(instanceDir, { personas: [], checkSources: false });

  const entries = readFoldLog(canonicalRoot).map((rec) => {
    const id = rec.ref.includes(":") ? rec.ref.slice(rec.ref.indexOf(":") + 1) : rec.ref;
    const atom = byId.get(id);
    const review = atom ? atom.review : null;
    const state = atom ? (STATE_FOR_REVIEW[review] ?? "unknown") : "missing";
    const relFile = atom && atom._file ? join(instanceSubdir, atom._file) : null;
    return {
      proposalId: rec.proposalId,
      ref: rec.ref,
      agent: rec.agent,
      review,
      state,
      file: relFile ? relFile.split("\\").join("/") : null,
      commit: withCommits && relFile ? lastCommitFor(canonicalRoot, relFile) : null,
    };
  });

  entries.sort((a, b) => (a.proposalId < b.proposalId ? -1 : a.proposalId > b.proposalId ? 1 : 0));

  const counts = { pending: 0, accepted: 0, rejected: 0, missing: 0, unknown: 0, total: entries.length };
  for (const e of entries) counts[e.state] = (counts[e.state] ?? 0) + 1;

  return { entries, counts };
}

// Write the index to its durable file. This is the cheap-to-read queue cache;
// losing it costs nothing, since buildIndex reconstructs it from canonical.
export function materializeIndex(canonicalRoot, index) {
  const dir = fleetDirPath(canonicalRoot);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, INDEX_FILE), JSON.stringify(index, null, 2) + "\n", "utf8");
  return join(dir, INDEX_FILE);
}

// Read the materialized index, or null when none has been written. The queue
// reader uses this for speed and falls back to buildIndex when it is absent or
// suspected stale.
export function readMaterializedIndex(canonicalRoot) {
  const path = join(fleetDirPath(canonicalRoot), INDEX_FILE);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

// Rebuild from canonical and overwrite the materialized index. The recovery
// entry point: run after a crash, or whenever the cache is suspect. The result
// equals a fresh buildIndex because canonical is the only input.
export function rebuildIndex(canonicalRoot, opts = {}) {
  const index = buildIndex(canonicalRoot, opts);
  materializeIndex(canonicalRoot, index);
  return index;
}
