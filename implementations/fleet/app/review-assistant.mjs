// M9 — the review-assistant seam (fleet-spec.md § Committer protocol, step 5
// "Present"; DESIGN.md § Milestones M9).
//
// This is the READ-ONLY seam an LLM review assistant fills. It reads the derived
// `proposed` index and the atoms on canonical and produces a digest for the
// human acceptor — the pending queue sorted by the REVIEW.md review-sort key
// (confidence ascending, a missing value lowest), clustered by entity type, with
// near-duplicate hints. It holds NO write authority to canonical and calls NO
// model: it ships a plain-text prompt (`renderReviewPrompt`), and an LLM
// assistant may consume `reviewDigest` to produce a richer summary. The model
// itself stays out of scope (DESIGN.md M9).

import { join } from "node:path";
import { buildIndex } from "./proposed-ref.mjs";
import { loadInstance } from "../../../lib/conformance.mjs";

const idOf = (ref) => (ref.includes(":") ? ref.slice(ref.indexOf(":") + 1) : ref);
const typeOf = (ref) => (ref.includes(":") ? ref.slice(0, ref.indexOf(":")) : "?");
// A missing confidence sorts lowest, per REVIEW.md's sort rule.
const sortKey = (c) => (typeof c === "number" ? c : -1);

// Build the read-only review digest for the pending queue. Pure read: it joins
// the derived index to the current atoms on canonical. Returns
// { pending, byType, nearDuplicates, counts }.
export function reviewDigest(canonicalRoot, { instanceSubdir = "" } = {}) {
  const index = buildIndex(canonicalRoot, { instanceSubdir, withCommits: false });
  const instanceDir = instanceSubdir ? join(canonicalRoot, instanceSubdir) : canonicalRoot;
  const { byId } = loadInstance(instanceDir, { personas: [], checkSources: false });

  const pending = index.entries
    .filter((e) => e.state === "pending")
    .map((e) => {
      const id = idOf(e.ref);
      const atom = byId.get(id) || {};
      const confidence = atom.provenance && typeof atom.provenance.confidence === "number"
        ? atom.provenance.confidence : null;
      const name = atom.name || atom.title || atom.label || id;
      return { proposalId: e.proposalId, ref: e.ref, id, agent: e.agent, type: atom.entityType || typeOf(e.ref), name, confidence };
    });

  pending.sort((a, b) =>
    sortKey(a.confidence) - sortKey(b.confidence) ||
    String(a.agent).localeCompare(String(b.agent)) ||
    a.ref.localeCompare(b.ref));

  // Cluster by entity type (a presentation aid, not a store property).
  const byType = {};
  for (const p of pending) (byType[p.type] ||= []).push(p);

  // Near-duplicate hint: the same (type, name) pending more than once — a cheap
  // flag for the human, never an automatic merge.
  const groups = new Map();
  for (const p of pending) {
    const k = `${p.type}\u0000${p.name.toLowerCase()}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  const nearDuplicates = [...groups.values()].filter((g) => g.length > 1);

  return { pending, byType, nearDuplicates, counts: index.counts };
}

// Render the default plain-text review prompt from a digest. No model: this is
// the question the assistant puts to the human, ready to read or to hand to an
// LLM for a richer summary.
export function renderReviewPrompt(digest) {
  const lines = [];
  lines.push(`Fleet review queue: ${digest.pending.length} pending (lowest-confidence first).`);
  lines.push("");
  if (digest.pending.length === 0) {
    lines.push("Nothing to review.");
    return lines.join("\n");
  }
  for (const p of digest.pending) {
    const conf = p.confidence === null ? " ?? " : p.confidence.toFixed(2);
    lines.push(`  [${conf}] ${p.type}:${p.name}  (${p.agent ?? "?"})  ${p.proposalId.slice(0, 12)}`);
  }
  if (digest.nearDuplicates.length) {
    lines.push("");
    lines.push("Possible near-duplicates (same type and name):");
    for (const g of digest.nearDuplicates) {
      lines.push(`  - ${g[0].type}:${g[0].name} — ${g.map((x) => x.proposalId.slice(0, 12)).join(", ")}`);
    }
  }
  lines.push("");
  lines.push("Which to admit? Accept or reject by proposal id (the committer applies your decision; this assistant writes nothing).");
  return lines.join("\n");
}
