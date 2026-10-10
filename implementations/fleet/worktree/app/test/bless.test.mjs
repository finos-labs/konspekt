import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { blessPass } from "../committer.mjs";
import { readDecisions } from "../bless.mjs";
import { buildIndex } from "../proposed-ref.mjs";
import { loadInstance } from "../../../../../lib/conformance.mjs";
import { standUpAndFold, commitCount, IDENTITY } from "./_fixtures.mjs";

const NOW = "2026-10-10T18:00:00Z";
const errorsOf = (dir) => loadInstance(dir, { personas: [] }).problems.filter((p) => p.severity === "error");

let root;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "konspekt-bless-")); });
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

test("bless flips the atom and its edges to accepted, one commit, tree stays valid", () => {
  const { fleet, proposals } = standUpAndFold(root);
  const before = commitCount(fleet.canonicalPath);

  const { done, setAside } = blessPass(
    fleet,
    [{ proposalId: proposals[0].proposalId, decision: "accepted", by: "denisurusov", mode: "inspection" }],
    { identity: IDENTITY, now: NOW }
  );
  assert.equal(setAside.length, 0);
  assert.equal(done.length, 1);
  assert.equal(done[0].edges.length, 1);
  assert.equal(commitCount(fleet.canonicalPath), before + 1, "one atomic commit per dispositioned atom");

  const entity = readFileSync(join(fleet.canonicalPath, "concepts/concept-foo.md"), "utf8");
  assert.match(entity, /review: accepted/);
  const edges = readFileSync(join(fleet.canonicalPath, "edges/edges.md"), "utf8");
  assert.match(edges, /\| e-foo \|.*\| accepted \|/);

  assert.equal(errorsOf(fleet.canonicalPath).length, 0, JSON.stringify(errorsOf(fleet.canonicalPath), null, 2));
});

test("bless appends the transition chain proposed -> accepted naming the acceptor", () => {
  const { fleet, proposals } = standUpAndFold(root);
  blessPass(fleet, [{ proposalId: proposals[0].proposalId, decision: "accepted", by: "denisurusov", mode: "batch" }], { identity: IDENTITY, now: NOW });

  const tr = readFileSync(join(fleet.canonicalPath, "transitions/transitions.md"), "utf8");
  assert.match(tr, /\| concept:concept-foo \| review \| proposed \| accepted \| 2026-10-10T18:00:00Z \|  \| denisurusov \|/);
  assert.match(tr, /\| edge:e-foo \| review \| proposed \| accepted \| 2026-10-10T18:00:00Z \|  \| denisurusov \|/);
});

test("the decision record ties proposal_id to acceptor, time, and mode", () => {
  const { fleet, proposals } = standUpAndFold(root);
  blessPass(fleet, [{ proposalId: proposals[0].proposalId, decision: "accepted", by: "denisurusov", mode: "inspection" }], { identity: IDENTITY, now: NOW });

  const decisions = readDecisions(fleet.canonicalPath);
  assert.equal(decisions.length, 1);
  assert.deepEqual(
    { proposalId: decisions[0].proposalId, decision: decisions[0].decision, by: decisions[0].by, mode: decisions[0].mode },
    { proposalId: proposals[0].proposalId, decision: "accepted", by: "denisurusov", mode: "inspection" }
  );
});

test("the derived index reflects the bless as accepted", () => {
  const { fleet, proposals } = standUpAndFold(root);
  blessPass(fleet, [{ proposalId: proposals[0].proposalId, decision: "accepted", by: "denisurusov", mode: "inspection" }], { identity: IDENTITY, now: NOW });
  const index = buildIndex(fleet.canonicalPath);
  assert.equal(index.counts.accepted, 1);
  assert.equal(index.counts.pending, 0);
});

test("reject writes a review: rejected tombstone with its reason, tree stays valid", () => {
  const { fleet, proposals } = standUpAndFold(root);
  const { done } = blessPass(
    fleet,
    [{ proposalId: proposals[0].proposalId, decision: "rejected", by: "denisurusov", reason: "duplicate of concept-bar" }],
    { identity: IDENTITY, now: NOW }
  );
  assert.equal(done[0].decision, "rejected");

  const entity = readFileSync(join(fleet.canonicalPath, "concepts/concept-foo.md"), "utf8");
  assert.match(entity, /review: rejected/);
  // The atom and its prose are retained — a tombstone, not an erasure.
  assert.match(entity, /# Concept: Foo/);

  const decisions = readDecisions(fleet.canonicalPath);
  assert.equal(decisions[0].reason, "duplicate of concept-bar");
  assert.equal(buildIndex(fleet.canonicalPath).counts.rejected, 1);
  assert.equal(errorsOf(fleet.canonicalPath).length, 0, JSON.stringify(errorsOf(fleet.canonicalPath), null, 2));
});

test("blessing an already-dispositioned proposal is set aside, not re-applied", () => {
  const { fleet, proposals } = standUpAndFold(root);
  const d = { proposalId: proposals[0].proposalId, decision: "accepted", by: "denisurusov", mode: "inspection" };
  blessPass(fleet, [d], { identity: IDENTITY, now: NOW });

  const { done, setAside } = blessPass(fleet, [d], { identity: IDENTITY, now: NOW });
  assert.equal(done.length, 0);
  assert.equal(setAside.length, 1);
  assert.match(setAside[0].reason, /already dispositioned/);
});

test("an accept with no acceptor is set aside", () => {
  const { fleet, proposals } = standUpAndFold(root);
  const { done, setAside } = blessPass(
    fleet,
    [{ proposalId: proposals[0].proposalId, decision: "accepted", mode: "inspection" }],
    { identity: IDENTITY, now: NOW }
  );
  assert.equal(done.length, 0);
  assert.match(setAside[0].reason, /must name the acceptor/);
});
