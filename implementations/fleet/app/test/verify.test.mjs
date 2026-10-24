import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyProposal } from "../verify.mjs";
import { assembleProposal } from "../outbox.mjs";

const SOURCE = "excerpt\n";

function good(overrides = {}) {
  return assembleProposal({
    entityType: "concept",
    fence: "id: concept-demo\nlabel: demo\ncreatedAt: 2026-10-10T16:00:00Z\nupdatedAt: 2026-10-10T16:00:00Z",
    prose: "# Concept: demo\n\nbody.",
    confidence: 0.8,
    conversationId: "s",
    timestamp: "2026-10-10T16:00:00Z",
    origin: { agent: "agent-a", model: "m", session: "s" },
    binding: "task-fleet-worktree-committer",
    edges: [{ id: "e-foo", kind: "mentions", from: "node:task-demo", to: "concept:concept-demo", review: "proposed" }],
    source: SOURCE,
    ...overrides,
  });
}

function verify(assembled, opts = {}) {
  return verifyProposal({
    entityMd: assembled.entityMd,
    sourceMd: assembled.sourceMd,
    meta: assembled.meta,
    branchOwner: "agent-a",
    ...opts,
  });
}

test("a well-formed proposal from its own branch verifies", () => {
  const v = verify(good());
  assert.equal(v.ok, true, v.reasons.join("; "));
  assert.deepEqual(v.reasons, []);
});

test("origin spoof: branch owner disagrees with the envelope agent", () => {
  const v = verify(good(), { branchOwner: "agent-b" });
  assert.equal(v.ok, false);
  assert.equal(v.checks.origin, false);
  assert.match(v.reasons.join("; "), /does not match branch owner/);
});

test("unregistered branch (null owner) fails origin", () => {
  const v = verify(good(), { branchOwner: null });
  assert.equal(v.checks.origin, false);
});

test("a tampered source fails the source check", () => {
  const a = good();
  a.sourceMd = "different\n";
  const v = verify(a);
  assert.equal(v.checks.source, false);
});

test("a review other than proposed is set aside", () => {
  const v = verify(good({ review: "accepted" }));
  assert.equal(v.checks.scope, false);
  assert.match(v.reasons.join("; "), /review accepted is not "proposed"/);
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
  const child = good({ dependsOn: ["concept-premise"] });
  assert.equal(verify(child, { known: new Set(["concept-premise"]) }).checks.depends_on, true);
  const miss = verify(child, { known: new Set() });
  assert.equal(miss.checks.depends_on, false);
  assert.match(miss.reasons.join("; "), /depends_on unresolved/);
});

test("an entity with no ```yaml fence is set aside, not thrown", () => {
  const v = verifyProposal({ entityMd: "# no fence\n", sourceMd: SOURCE, meta: { origin: { agent: "agent-a" } }, branchOwner: "agent-a" });
  assert.equal(v.ok, false);
  assert.match(v.reasons.join("; "), /no ```yaml fence/);
});

// ----- carried files (task-fleet-proposal-carries-files) -----

test("a carried file with matching bytes and a legal target verifies", () => {
  const a = good({ files: [{ path: "docs/x.md", bytes: "hello\n" }] });
  assert.deepEqual(a.meta.files.map((f) => f.path), ["docs/x.md"]);
  const v = verify(a, { files: a.files, instanceSubdir: ".konspekt/instance" });
  assert.equal(v.ok, true, v.reasons.join("; "));
  assert.equal(v.checks.files, true);
});

test("a carried file whose bytes were tampered fails the files check", () => {
  const a = good({ files: [{ path: "docs/x.md", bytes: "hello\n" }] });
  const tampered = a.files.map((f) => ({ ...f, bytes: Buffer.from("tampered\n") }));
  const v = verify(a, { files: tampered });
  assert.equal(v.ok, false);
  assert.equal(v.checks.files, false);
  assert.match(v.reasons.join("; "), /docs\/x\.md hash mismatch/);
});

test("a carried file missing its bytes in the outbox is set aside", () => {
  const a = good({ files: [{ path: "docs/x.md", bytes: "hello\n" }] });
  const v = verify(a, { files: [{ path: "docs/x.md", hash: a.meta.files[0].hash, bytes: null }] });
  assert.equal(v.checks.files, false);
  assert.match(v.reasons.join("; "), /missing its bytes/);
});

test("a carried file targeting inside the instance is set aside", () => {
  // Author-time normalize uses no instanceSubdir, so this is authored; the
  // committer, knowing the instance subpath, rejects it.
  const a = good({ files: [{ path: ".konspekt/instance/nodes/x.md", bytes: "hi\n" }] });
  const v = verify(a, { files: a.files, instanceSubdir: ".konspekt/instance" });
  assert.equal(v.checks.files, false);
  assert.match(v.reasons.join("; "), /inside the instance/);
});

test("assembleProposal rejects an absolute carried-file target at author time", () => {
  assert.throws(() => good({ files: [{ path: "/etc/passwd", bytes: "x" }] }), /absolute/);
  assert.throws(() => good({ files: [{ path: "../escape.md", bytes: "x" }] }), /illegal path segment/);
});
