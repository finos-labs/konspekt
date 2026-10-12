import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { foldProposal, foldProposals, parseEdgeRows } from "../fold.mjs";
import { assembleProposal, proposeToOutbox } from "../outbox.mjs";
import { setupFleet } from "../worktrees.mjs";
import { foldPass } from "../committer.mjs";
import { commitAll } from "../git.mjs";
import { loadInstance } from "../../../../lib/conformance.mjs";
import { writeSeed, conceptProposal, commitCount, IDENTITY } from "./_fixtures.mjs";

const errorsOf = (dir) =>
  loadInstance(dir, { personas: [] }).problems.filter((p) => p.severity === "error");

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "konspekt-fold-")); });
afterEach(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ } });

test("parseEdgeRows reads the table body and skips the header", () => {
  const rows = parseEdgeRows(conceptProposal().edgesMd);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].kind, "mentions");
  assert.equal(rows[0].review, "proposed");
});

test("a folded concept yields a tree that passes lib/validate.mjs", () => {
  writeSeed(dir);
  const p = conceptProposal();
  const r = foldProposal(dir, p, {});

  assert.equal(r.entityId, "concept-foo");
  assert.equal(r.file, "concepts/concept-foo.md");
  assert.ok(existsSync(join(dir, "concepts/concept-foo.md")));
  assert.ok(existsSync(join(dir, "sources", `${r.sourceRef}.md`)));

  const errs = errorsOf(dir);
  assert.equal(errs.length, 0, JSON.stringify(errs, null, 2));
});

test("the folded entity is the proposer's atom verbatim and addresses back to the proposal id", () => {
  writeSeed(dir);
  const p = conceptProposal();
  const r = foldProposal(dir, p, {});
  const text = readFileSync(join(dir, "concepts/concept-foo.md"), "utf8");
  // The committer copies entity.md byte for byte — no translation, one review.
  assert.equal(text, p.entityMd);
  assert.equal((text.match(/review:/g) || []).length, 1);
  assert.match(text, /review: proposed/);
  assert.match(text, new RegExp(`sourceRef: ${r.sourceRef}`));
  assert.match(text, new RegExp(`contentHash: ${r.sourceRef}`));
  assert.match(text, /confidence: 0.8/);
});

test("fold records the proposing agent in the transition `by` column", () => {
  writeSeed(dir);
  foldProposal(dir, conceptProposal({ agent: "agent-a" }), {});
  const tx = readFileSync(join(dir, "transitions/transitions.md"), "utf8");
  assert.match(tx, /\| concept:concept-foo \| review \|  \| proposed \|[^|]*\|  \| agent-a \|/);
});

test("folding two concepts in one batch keeps the tree valid", () => {
  writeSeed(dir);
  const a = conceptProposal({ id: "concept-foo", edgeId: "e-foo", created: "2026-10-10T16:00:00Z" });
  const b = conceptProposal({ id: "concept-bar", edgeId: "e-bar", created: "2026-10-10T16:05:00Z" });
  const { folded, setAside } = foldProposals(dir, [a, b], {});
  assert.equal(folded.length, 2);
  assert.equal(setAside.length, 0);
  assert.equal(errorsOf(dir).length, 0, JSON.stringify(errorsOf(dir), null, 2));
});

test("a proposal with no wiring edge is set aside, not folded", () => {
  writeSeed(dir);
  const p = assembleProposal({
    entityType: "concept",
    fence: "id: concept-lonely\nlabel: Lonely\ncreatedAt: 2026-10-10T16:00:00Z\nupdatedAt: 2026-10-10T16:00:00Z",
    prose: "# Concept: Lonely\n\nNo edge wires this.",
    confidence: 0.5, conversationId: "s", timestamp: "2026-10-10T16:00:00Z",
    origin: { agent: "agent-a", model: "m", session: "s" }, binding: "none:exploratory",
    edges: [], source: "x\n",
  });
  const { folded, setAside } = foldProposals(dir, [p], {});
  assert.equal(folded.length, 0);
  assert.equal(setAside.length, 1);
  assert.match(setAside[0].reason, /must land wired/);
});

test("foldPass folds the verified batch onto canonical in one commit", () => {
  const root = mkdtempSync(join(tmpdir(), "konspekt-foldpass-"));
  try {
    const fleet = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
    writeSeed(fleet.canonicalPath);
    commitAll(fleet.canonicalPath, "seed instance", { ...IDENTITY });

    const before = commitCount(fleet.canonicalPath);
    proposeToOutbox(fleet.proposerFor("agent-a").path, conceptProposal(), { identity: IDENTITY });

    const res = foldPass(fleet, { identity: IDENTITY });
    assert.equal(res.folded.length, 1);
    assert.ok(res.commit);
    assert.equal(commitCount(fleet.canonicalPath), before + 1, "fold is exactly one commit");
    assert.equal(errorsOf(fleet.canonicalPath).length, 0, JSON.stringify(errorsOf(fleet.canonicalPath), null, 2));
  } finally {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});
