import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupFleet } from "../worktrees.mjs";
import { commitAll } from "../git.mjs";
import { assembleClaim, writeClaimToOutbox, readClaimRequests, applyClaims, acceptRelease } from "../claims.mjs";
import { loadInstance, splitEntityFile } from "../../../../lib/conformance.mjs";
import { writeSeed, IDENTITY } from "./_fixtures.mjs";

const errorsOf = (dir) =>
  loadInstance(dir, { personas: [] }).problems.filter((p) => p.severity === "error");
const statusOf = (canonicalPath, id) =>
  splitEntityFile(readFileSync(join(canonicalPath, "nodes/task", `${id}.md`), "utf8")).front.status;

let root;
// A one-proposer fleet whose canonical carries the seed's accepted `open` node.
function stand() {
  const fleet = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
  writeSeed(fleet.canonicalPath);
  commitAll(fleet.canonicalPath, "seed instance", { ...IDENTITY });
  return fleet;
}

beforeEach(() => { root = mkdtempSync(join(tmpdir(), "konspekt-claims-")); });
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

test("assembleClaim defaults a claim to open->active and validates a release target", () => {
  const c = assembleClaim({ kind: "claim", node: "task-demo", agent: "agent-a" });
  assert.deepEqual([c.claim.from, c.claim.to], ["open", "active"]);
  assert.throws(() => assembleClaim({ kind: "release", node: "task-demo", agent: "agent-a" }), /must be "resolved" or "abandoned"/);
  assert.throws(() => assembleClaim({ kind: "nope", node: "x", agent: "a" }), /kind must be/);
});

test("a claim is committer-applied: open -> active, attributed to the agent", () => {
  const fleet = stand();
  const c = assembleClaim({ kind: "claim", node: "task-demo", agent: "agent-a", created: "2026-10-22T10:00:00Z" });
  writeClaimToOutbox(fleet.proposerFor("agent-a").path, c, { identity: IDENTITY });

  const res = applyClaims(fleet, {});
  assert.equal(res.applied.length, 1);
  assert.deepEqual([res.applied[0].node, res.applied[0].from, res.applied[0].to, res.applied[0].agent],
    ["task-demo", "open", "active", "agent-a"]);
  assert.ok(res.commit);
  assert.equal(statusOf(fleet.canonicalPath, "task-demo"), "active");
  const tx = readFileSync(join(fleet.canonicalPath, "transitions/transitions.md"), "utf8");
  assert.match(tx, /\| node:task-demo \| status \| open \| active \|[^|]*\|  \| agent-a \|/);
  assert.equal(errorsOf(fleet.canonicalPath).length, 0, JSON.stringify(errorsOf(fleet.canonicalPath), null, 2));
});

test("a claim whose origin is not the branch owner is set aside (anti-spoof)", () => {
  const fleet = stand();
  const spoof = assembleClaim({ kind: "claim", node: "task-demo", agent: "intruder" });
  writeClaimToOutbox(fleet.proposerFor("agent-a").path, spoof, { identity: IDENTITY });
  const res = applyClaims(fleet, {});
  assert.equal(res.applied.length, 0);
  assert.equal(res.setAside.length, 1);
  assert.match(res.setAside[0].reason, /not the branch owner/);
  assert.equal(statusOf(fleet.canonicalPath, "task-demo"), "open");
});

test("a claim on a missing node, or one not in the expected status, is set aside", () => {
  const fleet = stand();
  writeClaimToOutbox(fleet.proposerFor("agent-a").path,
    assembleClaim({ kind: "claim", node: "task-ghost", agent: "agent-a" }), { identity: IDENTITY });
  const miss = applyClaims(fleet, {});
  assert.match(miss.setAside[0].reason, /not on canonical/);

  // Claim the real node (open -> active), then a second claim expects open and is set aside.
  writeClaimToOutbox(fleet.proposerFor("agent-a").path,
    assembleClaim({ kind: "claim", node: "task-demo", agent: "agent-a", created: "2026-10-22T10:00:00Z" }), { identity: IDENTITY });
  applyClaims(fleet, {});
  writeClaimToOutbox(fleet.proposerFor("agent-a").path,
    assembleClaim({ kind: "claim", node: "task-demo", agent: "agent-a", created: "2026-10-22T11:00:00Z" }), { identity: IDENTITY });
  const again = applyClaims(fleet, {});
  assert.ok(again.setAside.some((s) => /status is "active", expected "open"/.test(s.reason)));
});

test("a release is human-gated: reported pending, not applied by the pass", () => {
  const fleet = stand();
  // Open the claim first so the node is active.
  writeClaimToOutbox(fleet.proposerFor("agent-a").path,
    assembleClaim({ kind: "claim", node: "task-demo", agent: "agent-a", created: "2026-10-22T10:00:00Z" }), { identity: IDENTITY });
  applyClaims(fleet, {});
  // Now a release request: it should be pending, and the node must stay active.
  writeClaimToOutbox(fleet.proposerFor("agent-a").path,
    assembleClaim({ kind: "release", node: "task-demo", to: "resolved", agent: "agent-a" }), { identity: IDENTITY });
  const res = applyClaims(fleet, {});
  assert.equal(res.pending.length, 1);
  assert.equal(res.pending[0].claim.to, "resolved");
  assert.equal(statusOf(fleet.canonicalPath, "task-demo"), "active");
});

test("acceptRelease applies active -> resolved attributed to the human acceptor", () => {
  const fleet = stand();
  writeClaimToOutbox(fleet.proposerFor("agent-a").path,
    assembleClaim({ kind: "claim", node: "task-demo", agent: "agent-a", created: "2026-10-22T10:00:00Z" }), { identity: IDENTITY });
  applyClaims(fleet, {});
  const rel = assembleClaim({ kind: "release", node: "task-demo", to: "resolved", agent: "agent-a" });
  writeClaimToOutbox(fleet.proposerFor("agent-a").path, rel, { identity: IDENTITY });

  const r = acceptRelease(fleet, { claimId: rel.claimId, by: "denisurusov", now: "2026-10-22T12:00:00Z", identity: IDENTITY });
  assert.equal(r.to, "resolved");
  assert.equal(statusOf(fleet.canonicalPath, "task-demo"), "resolved");
  const tx = readFileSync(join(fleet.canonicalPath, "transitions/transitions.md"), "utf8");
  assert.match(tx, /\| node:task-demo \| status \| active \| resolved \|[^|]*\|  \| denisurusov \|/);
  assert.equal(errorsOf(fleet.canonicalPath).length, 0, JSON.stringify(errorsOf(fleet.canonicalPath), null, 2));
});

test("acceptRelease rejects a missing claim, a non-release, and a non-active node", () => {
  const fleet = stand();
  assert.throws(() => acceptRelease(fleet, { claimId: "deadbeef", by: "denisurusov" }), /no claim request/);

  // A claim (not a release) cannot be release-accepted.
  const claim = assembleClaim({ kind: "claim", node: "task-demo", agent: "agent-a" });
  writeClaimToOutbox(fleet.proposerFor("agent-a").path, claim, { identity: IDENTITY });
  assert.throws(() => acceptRelease(fleet, { claimId: claim.claimId, by: "denisurusov" }), /is not a release/);

  // A release on a node that is still open (never claimed) is rejected.
  const rel = assembleClaim({ kind: "release", node: "task-demo", to: "abandoned", agent: "agent-a" });
  writeClaimToOutbox(fleet.proposerFor("agent-a").path, rel, { identity: IDENTITY });
  assert.throws(() => acceptRelease(fleet, { claimId: rel.claimId, by: "denisurusov" }), /expected "active" to release/);
});

test("acceptRelease without a named acceptor is refused", () => {
  const fleet = stand();
  const rel = assembleClaim({ kind: "release", node: "task-demo", to: "resolved", agent: "agent-a" });
  writeClaimToOutbox(fleet.proposerFor("agent-a").path, rel, { identity: IDENTITY });
  assert.throws(() => acceptRelease(fleet, { claimId: rel.claimId }), /must name the human acceptor/);
});

test("readClaimRequests surfaces claim.json dirs with owner and branch", () => {
  const fleet = stand();
  writeClaimToOutbox(fleet.proposerFor("agent-a").path,
    assembleClaim({ kind: "claim", node: "task-demo", agent: "agent-a" }), { identity: IDENTITY });
  const reqs = readClaimRequests(fleet);
  assert.equal(reqs.length, 1);
  assert.equal(reqs[0].owner, "agent-a");
  assert.equal(reqs[0].branch, "outbox/agent-a");
  assert.equal(reqs[0].claim.node, "task-demo");
});
