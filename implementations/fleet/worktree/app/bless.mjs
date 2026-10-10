// Bless and reject (fleet-spec.md § Committer protocol, steps 7-8).
//
// The atom landed WHOLE at fold (review: proposed, with its source, prose, and
// wiring edges). Disposition is therefore FIELD-ONLY: bless flips `review` from
// proposed to accepted on the entity and on the atom's own edge rows, and reject
// flips it to rejected — a tombstone retained with its reason, nothing erased
// (REVIEW.md reject-as-tombstone, the grow-only store). Neither re-copies the
// source nor re-authors prose.
//
// Each disposition appends:
//   - a core transition row per flipped ref (entity and each edge), chaining
//     proposed -> accepted|rejected and naming the acceptor in `by`;
//   - a fleet-side decision record under .konspekt-fleet/, tying proposal_id to
//     the acceptor, timestamp, and inspection-or-batch (accept) or reason
//     (reject) — proposal_id is fleet vocabulary and stays out of the stored
//     graph.
//
// The committer makes one commit per dispositioned atom (committer.blessPass),
// so a bless is one atomic field-only commit and canonical never lands a
// half-flipped atom.

import { join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { loadInstance } from "../../../../lib/conformance.mjs";
import { FLEET_DIR, readFoldLog } from "./proposed-ref.mjs";

const DECISIONS_LOG = "decisions.md";

// Replace the `review:` line inside an entity file's ```yaml fence. Only the
// fence is touched, so a `review:` mentioned in the prose body is left alone.
function setEntityReview(text, to) {
  const m = text.match(/^(```ya?ml\n)([\s\S]*?)(\n```)/);
  if (!m) throw new Error("entity file has no ```yaml fence");
  const fence = m[2];
  if (!/^review:/m.test(fence)) throw new Error("entity fence has no review field to flip");
  const newFence = fence.replace(/^review:[ \t]*.*$/m, `review: ${to}`);
  return text.slice(0, m.index) + m[1] + newFence + m[3] + text.slice(m.index + m[0].length);
}

// Flip the `review` cell of the named edge rows in edges.md, but only rows that
// currently read `from` (so a second disposition is a no-op on already-flipped
// rows). Returns the ids actually flipped.
function flipEdgeReviews(edgesText, edgeIds, from, to) {
  const want = new Set(edgeIds);
  const flipped = [];
  const lines = edgesText.split("\n").map((line) => {
    const t = line.trim();
    if (!t.startsWith("|")) return line;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 6) return line;
    if (!want.has(cells[0])) return line;
    if ((cells[5] || "") !== from) return line;
    cells[5] = to;
    flipped.push(cells[0]);
    return `| ${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]} | ${cells[4]} | ${cells[5]} |`;
  });
  return { text: lines.join("\n"), flipped };
}

function appendRows(path, rows) {
  if (rows.length === 0) return;
  let existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (existing.length && !existing.endsWith("\n")) existing += "\n";
  writeFileSync(path, existing + rows.map((r) => r + "\n").join(""), "utf8");
}

function appendDecisionRecord(fleetRoot, { proposalId, ref, decision, by, timestamp, mode, reason }) {
  const dir = join(fleetRoot, FLEET_DIR);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, DECISIONS_LOG);
  let existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (!existing) {
    existing =
      "# Fleet decisions log\n\n" +
      "Append-only accept/reject record (fleet-spec.md § Committer protocol step 8).\n" +
      "Ties each dispositioned proposal to the acceptor, the time, and the mode\n" +
      "(inspection|batch) or the reject reason. The responsibility report for an\n" +
      "accepted atom — who proposed, who accepted, when — reads from here joined to\n" +
      "the fold log. Fleet-side audit; canonical carries the review state itself.\n\n" +
      "| proposal_id | ref | decision | by | timestamp | mode | reason |\n" +
      "|-------------|-----|----------|----|-----------|------|--------|\n";
  }
  if (existing.length && !existing.endsWith("\n")) existing += "\n";
  const cell = (s) => String(s ?? "").replace(/\|/g, "/").replace(/\n/g, " ");
  writeFileSync(
    path,
    existing + `| ${cell(proposalId)} | ${cell(ref)} | ${cell(decision)} | ${cell(by)} | ${cell(timestamp)} | ${cell(mode)} | ${cell(reason)} |\n`,
    "utf8"
  );
}

const txRow = (ref, from, to, timestamp, by) => `| ${ref} | review | ${from} | ${to} | ${timestamp} |  | ${by ?? ""} |`;

// Disposition one folded proposal. `decision` is "accepted" or "rejected".
// Writes the field flips, transition rows, and decision record into the tree;
// the caller commits. Throws (writing nothing durable it cannot back out of in
// one commit) when the proposal is unknown, already dispositioned, or its atom
// is missing — the caller reports it set aside.
export function decideAtom(instanceDir, fleetRoot, { proposalId, decision, by, mode = null, reason = null, now } = {}) {
  if (decision !== "accepted" && decision !== "rejected") {
    throw new Error(`decision must be "accepted" or "rejected", got "${decision}"`);
  }
  if (decision === "accepted" && !by) throw new Error("an accept must name the acceptor (by)");

  const rec = readFoldLog(fleetRoot).find((r) => r.proposalId === proposalId);
  if (!rec) throw new Error(`no folded proposal "${proposalId}" in the fold log`);

  const id = rec.ref.includes(":") ? rec.ref.slice(rec.ref.indexOf(":") + 1) : rec.ref;
  const { byId } = loadInstance(instanceDir, { personas: [], checkSources: false });
  const atom = byId.get(id);
  if (!atom) throw new Error(`atom "${rec.ref}" is not on canonical`);
  if (atom.review !== "proposed") {
    throw new Error(`atom "${rec.ref}" is "${atom.review}", not proposed — already dispositioned`);
  }

  const to = decision;
  const timestamp = now || new Date().toISOString();

  // ----- entity review flip -----
  const entityPath = join(instanceDir, atom._file);
  writeFileSync(entityPath, setEntityReview(readFileSync(entityPath, "utf8"), to), "utf8");

  // ----- the atom's own edge rows -----
  const edgesPath = join(instanceDir, "edges", "edges.md");
  const { text, flipped } = flipEdgeReviews(readFileSync(edgesPath, "utf8"), rec.edgeIds, "proposed", to);
  writeFileSync(edgesPath, text, "utf8");

  // ----- transitions (proposed -> to), entity then each flipped edge -----
  const trRows = [txRow(rec.ref, "proposed", to, timestamp, by)];
  for (const eid of flipped) trRows.push(txRow(`edge:${eid}`, "proposed", to, timestamp, by));
  appendRows(join(instanceDir, "transitions", "transitions.md"), trRows);

  // ----- fleet decision record -----
  appendDecisionRecord(fleetRoot, { proposalId, ref: rec.ref, decision, by, timestamp, mode, reason });

  return { proposalId, ref: rec.ref, decision, edges: flipped, timestamp };
}

// Read the decisions log into [{ proposalId, ref, decision, by, timestamp, mode,
// reason }], in decision order. The accept-record side of the responsibility
// report.
export function readDecisions(fleetRoot) {
  const path = join(fleetRoot, FLEET_DIR, DECISIONS_LOG);
  if (!existsSync(path)) return [];
  const rows = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    if (cells[0] === "proposal_id" || /^-+$/.test(cells[0])) continue;
    rows.push({
      proposalId: cells[0], ref: cells[1], decision: cells[2], by: cells[3] || null,
      timestamp: cells[4] || null, mode: cells[5] || null, reason: cells[6] || null,
    });
  }
  return rows;
}
