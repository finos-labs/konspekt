import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupFleet, loadFleet } from "../worktrees.mjs";
import { assembleProposal, proposeToOutbox } from "../outbox.mjs";
import { readOutbox, readProposals, verifyPass, watchLoop } from "../committer.mjs";

const IDENTITY = { name: "Test", email: "test@konspekt.local" };
let root;

beforeEach(() => { root = mkdtempSync(join(tmpdir(), "konspekt-committer-")); });
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

function proposal(agent, overrides = {}) {
  return assembleProposal({
    entityType: "concept",
    fence: `id: concept-from-${agent}\nlabel: demo\ncreatedAt: 2026-10-10T16:00:00Z\nupdatedAt: 2026-10-10T16:00:00Z`,
    prose: `# Concept: from ${agent}\n\nbody.`,
    confidence: 0.7,
    conversationId: "s",
    timestamp: "2026-10-10T16:00:00Z",
    origin: { agent, model: "m", session: "s" },
    binding: "task-fleet-worktree-committer",
    edges: [{ id: `e-${agent}`, kind: "mentions", from: "node:task-demo", to: `concept:concept-from-${agent}`, review: "proposed" }],
    source: `excerpt from ${agent}\n`,
    ...overrides,
  });
}

test("readOutbox returns an empty list for an untouched worktree", () => {
  const f = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
  assert.deepEqual(readOutbox(f.proposerFor("agent-a").path), []);
});

test("readProposals tags each proposal with its owner and branch", () => {
  const f = setupFleet({ root, proposers: ["agent-a", "agent-b"], identity: IDENTITY });
  proposeToOutbox(f.proposerFor("agent-a").path, proposal("agent-a"), { identity: IDENTITY });
  proposeToOutbox(f.proposerFor("agent-b").path, proposal("agent-b"), { identity: IDENTITY });

  const all = readProposals(f);
  assert.equal(all.length, 2);
  const byOwner = Object.fromEntries(all.map((p) => [p.owner, p]));
  assert.equal(byOwner["agent-a"].branch, "outbox/agent-a");
  assert.equal(byOwner["agent-b"].branch, "outbox/agent-b");
});

test("verifyPass passes honest proposals and sets aside a spoofed origin", () => {
  const f = setupFleet({ root, proposers: ["agent-a", "agent-b"], identity: IDENTITY });

  // Honest: agent-a proposes on its own branch.
  proposeToOutbox(f.proposerFor("agent-a").path, proposal("agent-a"), { identity: IDENTITY });
  // Spoof: an atom whose envelope claims origin agent-b, written onto agent-a's outbox.
  proposeToOutbox(f.proposerFor("agent-a").path, proposal("agent-b"), { identity: IDENTITY });

  const verdicts = verifyPass(f);
  assert.equal(verdicts.length, 2);
  const spoof = verdicts.find((v) => !v.ok);
  const honest = verdicts.find((v) => v.ok);
  assert.ok(honest);
  assert.ok(spoof);
  assert.equal(honest.owner, "agent-a");
  assert.match(spoof.reasons.join("; "), /does not match branch owner/);
});

test("verifyPass works through a reloaded manifest (separate attach)", () => {
  const f = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
  proposeToOutbox(f.proposerFor("agent-a").path, proposal("agent-a"), { identity: IDENTITY });

  const reattached = loadFleet(root);
  const verdicts = verifyPass(reattached);
  assert.equal(verdicts.length, 1);
  assert.equal(verdicts[0].ok, true, verdicts[0].reasons.join("; "));
});

test("a proposal directory renamed to disagree with its content id is set aside", () => {
  const f = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
  const a = proposal("agent-a");
  // Hand-place the proposal under a wrong directory name.
  const dir = join(f.proposerFor("agent-a").path, "proposals", "deadbeef");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "entity.md"), a.entityMd, "utf8");
  writeFileSync(join(dir, "source.md"), a.sourceMd, "utf8");
  writeFileSync(join(dir, "edges.md"), a.edgesMd, "utf8");
  writeFileSync(join(dir, "meta.json"), JSON.stringify(a.meta, null, 2) + "\n", "utf8");

  const verdicts = verifyPass(f);
  assert.equal(verdicts.length, 1);
  assert.equal(verdicts[0].ok, false);
  assert.match(verdicts[0].reasons.join("; "), /does not match the entity content id/);
});

test("watchLoop runs tick each iteration, waits between ticks, and stops on stop()", async () => {
  // Pure control-flow test: no real timers or signals. stop() flips true once
  // three ticks have run, so the loop ends promptly and runs no extra tick.
  let ticks = 0;
  const waits = [];
  const n = await watchLoop({
    tick: () => { ticks++; },
    intervalMs: 1234,
    stop: () => ticks >= 3,
    wait: (ms) => { waits.push(ms); return Promise.resolve(); },
  });
  assert.equal(n, 3); // three ticks
  assert.equal(ticks, 3);
  assert.deepEqual(waits, [1234, 1234]); // waited between ticks, not after the last
});

test("watchLoop does not tick when stop() is already true", async () => {
  let ticks = 0;
  const n = await watchLoop({ tick: () => { ticks++; }, stop: () => true });
  assert.equal(n, 0);
  assert.equal(ticks, 0);
});

test("watchLoop requires a tick function", async () => {
  await assert.rejects(() => watchLoop({}), /needs a tick function/);
});
