import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reviewDigest, renderReviewPrompt } from "../review-assistant.mjs";
import { standUpAndFold, commitCount } from "./_fixtures.mjs";

let root;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "konspekt-review-")); });
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

test("reviewDigest sorts the pending queue by confidence, lowest first", () => {
  const { fleet } = standUpAndFold(root, [
    { id: "concept-a", edgeId: "e-a", confidence: 0.9, created: "2026-10-10T16:00:00Z" },
    { id: "concept-b", edgeId: "e-b", confidence: 0.3, created: "2026-10-10T16:01:00Z" },
    { id: "concept-c", edgeId: "e-c", confidence: 0.6, created: "2026-10-10T16:02:00Z" },
  ]);
  const digest = reviewDigest(fleet.canonicalPath);
  assert.deepEqual(digest.pending.map((p) => p.id), ["concept-b", "concept-c", "concept-a"]);
  assert.deepEqual(digest.pending.map((p) => p.confidence), [0.3, 0.6, 0.9]);
  assert.equal(digest.counts.pending, 3);
});

test("reviewDigest clusters by type and flags same-name near-duplicates", () => {
  const { fleet } = standUpAndFold(root, [
    { id: "concept-a", edgeId: "e-a", confidence: 0.5, created: "2026-10-10T16:00:00Z" },
    { id: "concept-b", edgeId: "e-b", confidence: 0.5, created: "2026-10-10T16:01:00Z" },
  ]);
  const digest = reviewDigest(fleet.canonicalPath);
  // Both fixture concepts carry label "Foo", so they cluster as one near-duplicate group.
  assert.equal(digest.byType.concept.length, 2);
  assert.equal(digest.nearDuplicates.length, 1);
  assert.equal(digest.nearDuplicates[0].length, 2);
});

test("renderReviewPrompt lists the queue and asks the admit question", () => {
  const { fleet } = standUpAndFold(root, [
    { id: "concept-a", edgeId: "e-a", confidence: 0.4, created: "2026-10-10T16:00:00Z" },
  ]);
  const prompt = renderReviewPrompt(reviewDigest(fleet.canonicalPath));
  assert.match(prompt, /1 pending/);
  assert.match(prompt, /\[0\.40\] concept:Foo/);
  assert.match(prompt, /Which to admit\?/);
  assert.match(prompt, /writes nothing/);
});

test("the review digest is read-only: canonical gains no commit", () => {
  const { fleet } = standUpAndFold(root, [{ confidence: 0.5 }]);
  const before = commitCount(fleet.canonicalPath);
  reviewDigest(fleet.canonicalPath);
  renderReviewPrompt(reviewDigest(fleet.canonicalPath));
  assert.equal(commitCount(fleet.canonicalPath), before, "presenting the queue writes nothing");
});

test("an empty queue renders a nothing-to-review prompt", () => {
  const { fleet } = standUpAndFold(root, []);
  const prompt = renderReviewPrompt(reviewDigest(fleet.canonicalPath));
  assert.match(prompt, /0 pending/);
  assert.match(prompt, /Nothing to review/);
});
