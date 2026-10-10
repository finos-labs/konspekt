import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyProposal } from "../verify.mjs";
import { assembleProposal, renderEdgesBlock } from "../outbox.mjs";

const SOURCE = "excerpt\n";

function good(overrides = {}) {
  return assembleProposal({
    origin: { agent: "agent-a", model: "m", session: "s" },
    scope: { entity_type: "Concept", atom_state: "proposed" },
    confidence: 0.8,
    binding: "task-fleet-worktree-committer",
    created: "2026-10-10T16:00:00Z",
    body: "# Concept: demo\n\nbody.\n" + renderEdgesBlock([]),
    source: SOURCE,
    ...overrides,
  });
}

function verify(assembled, opts = {}) {
  return verifyProposal({
    proposalMd: assembled.proposalMd,
    sourceMd: assembled.sourceMd,
    branchOwner: "agent-a",
    ...opts,
  });
}

test("a well-formed proposal from its own branch verifies", () => {
  const v = verify(good());
  assert.equal(v.ok, true, v.reasons.join("; "));
  assert.deepEqual(v.reasons, []);
});

test("origin spoof: branch owner disagrees with declared agent", () => {
  const v = verify(good(), { branchOwner: "agent-b" });
  assert.equal(v.ok, false);
  assert.equal(v.checks.origin, false);
  assert.match(v.reasons.join("; "), /does not match branch owner/);
});

test("unregistered branch (null owner) fails origin", () => {
  const v = verify(good(), { branchOwner: null });
  assert.equal(v.checks.origin, false);
});

test("tampered body fails the id check", () => {
  const a = good();
  a.proposalMd = a.proposalMd.replace("body.", "TAMPERED.");
  const v = verify(a);
  assert.equal(v.checks.id, false);
  assert.equal(v.ok, false);
});

test("swapped source fails the source check", () => {
  const a = good();
  a.sourceMd = "different\n";
  const v = verify(a);
  assert.equal(v.checks.source, false);
});

test("atom_state other than proposed is set aside", () => {
  const v = verify(good({ scope: { entity_type: "Concept", atom_state: "accepted" } }));
  assert.equal(v.checks.scope, false);
  assert.match(v.reasons.join("; "), /atom_state accepted is not "proposed"/);
});

test("entity_type outside the grant is set aside", () => {
  const v = verify(good(), { grant: { entityTypes: ["noteworthy"] } });
  assert.equal(v.checks.scope, false);
  assert.match(v.reasons.join("; "), /entity_type concept is outside/);
});

test("confidence out of range is set aside", () => {
  const v = verify(good({ confidence: 1.5 }));
  assert.equal(v.checks.confidence, false);
});

test("a none:<reason> binding is accepted as resolved", () => {
  const v = verify(good({ binding: "none:exploratory-no-entity-yet" }));
  assert.equal(v.checks.binding, true);
});

test("depends_on is resolved against a known set when provided", () => {
  const dep = good({ created: "2026-10-10T15:00:00Z" });
  const child = good({ dependsOn: [dep.proposalId] });
  assert.equal(verify(child, { known: new Set([dep.proposalId]) }).checks.depends_on, true);
  const miss = verify(child, { known: new Set() });
  assert.equal(miss.checks.depends_on, false);
  assert.match(miss.reasons.join("; "), /depends_on unresolved/);
});

test("an unframed payload is set aside, not thrown", () => {
  const v = verifyProposal({ proposalMd: "# no frontmatter\n", sourceMd: SOURCE, branchOwner: "agent-a" });
  assert.equal(v.ok, false);
  assert.match(v.reasons.join("; "), /unparseable payload/);
});
