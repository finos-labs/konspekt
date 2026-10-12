import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildIndex, rebuildIndex, materializeIndex, readMaterializedIndex, readFoldLog, FLEET_DIR,
} from "../proposed-ref.mjs";
import { commitAll } from "../git.mjs";
import { standUpAndFold, IDENTITY } from "./_fixtures.mjs";

// Stand up a fleet, seed canonical, fold one proposal, return the fleet and the
// fold result.
function foldOne(root) {
  const { fleet, res, proposals } = standUpAndFold(root);
  return { fleet, res, proposalId: proposals[0].proposalId };
}

let root;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "konspekt-index-")); });
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

test("fold writes a fold-log row linking proposal_id to the atom, in the fold commit", () => {
  const { fleet, proposalId } = foldOne(root);
  const log = readFoldLog(fleet.canonicalPath);
  assert.equal(log.length, 1);
  assert.equal(log[0].proposalId, proposalId);
  assert.equal(log[0].ref, "concept:concept-foo");
  assert.equal(log[0].agent, "agent-a");
  // The log lives outside the validated instance tree.
  assert.ok(existsSync(join(fleet.canonicalPath, FLEET_DIR, "folded.md")));
});

test("buildIndex classifies a folded proposal as pending with its canonical-commit pointer", () => {
  const { fleet, res, proposalId } = foldOne(root);
  const index = buildIndex(fleet.canonicalPath);
  assert.equal(index.counts.total, 1);
  assert.equal(index.counts.pending, 1);
  const e = index.entries[0];
  assert.equal(e.proposalId, proposalId);
  assert.equal(e.state, "pending");
  assert.equal(e.review, "proposed");
  assert.equal(e.file, "concepts/concept-foo.md");
  assert.equal(e.commit, res.commit, "pointer is the fold commit");
});

test("rebuild from canonical after a crash (index never materialized) is correct", () => {
  const { fleet } = foldOne(root);
  // Simulate a crash between the fold commit and the index update: no index file.
  assert.equal(readMaterializedIndex(fleet.canonicalPath), null);

  const rebuilt = rebuildIndex(fleet.canonicalPath);
  const fresh = buildIndex(fleet.canonicalPath);
  assert.deepEqual(rebuilt, fresh, "rebuild equals a fresh build — canonical is the only input");
  assert.equal(rebuilt.counts.pending, 1);
  // The recovery entry point also persisted the cache.
  assert.deepEqual(readMaterializedIndex(fleet.canonicalPath), rebuilt);
});

test("a stale materialized index is overwritten from canonical on rebuild", () => {
  const { fleet, proposalId } = foldOne(root);
  // Hand-write a lie: claim the pending proposal is accepted.
  materializeIndex(fleet.canonicalPath, {
    entries: [{ proposalId, ref: "concept:concept-foo", state: "accepted", review: "accepted", agent: "agent-a", file: "concepts/concept-foo.md", commit: null }],
    counts: { pending: 0, accepted: 1, rejected: 0, missing: 0, unknown: 0, total: 1 },
  });
  const rebuilt = rebuildIndex(fleet.canonicalPath);
  assert.equal(rebuilt.counts.accepted, 0);
  assert.equal(rebuilt.counts.pending, 1, "canonical says proposed, so the truth is pending");
});

test("index follows the atom's review field: accepted and rejected are derived, not stored separately", () => {
  const { fleet } = foldOne(root);
  const file = join(fleet.canonicalPath, "concepts", "concept-foo.md");

  // Simulate bless: flip review to accepted on canonical and commit.
  writeFileSync(file, readFileSync(file, "utf8").replace("review: proposed", "review: accepted"), "utf8");
  commitAll(fleet.canonicalPath, "bless concept-foo", { ...IDENTITY });
  assert.equal(buildIndex(fleet.canonicalPath).counts.accepted, 1);

  // Simulate reject: flip to rejected.
  writeFileSync(file, readFileSync(file, "utf8").replace("review: accepted", "review: rejected"), "utf8");
  commitAll(fleet.canonicalPath, "reject concept-foo", { ...IDENTITY });
  const idx = buildIndex(fleet.canonicalPath);
  assert.equal(idx.counts.rejected, 1);
  assert.equal(idx.counts.accepted, 0);
});
