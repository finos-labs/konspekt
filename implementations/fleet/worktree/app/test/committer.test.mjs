import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupFleet, loadFleet } from "../worktrees.mjs";
import { assembleProposal, proposeToOutbox, renderEdgesBlock } from "../outbox.mjs";
import { readOutbox, readProposals, verifyPass } from "../committer.mjs";

const IDENTITY = { name: "Test", email: "test@konspekt.local" };
let root;

beforeEach(() => { root = mkdtempSync(join(tmpdir(), "konspekt-committer-")); });
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

function proposal(agent, overrides = {}) {
  return assembleProposal({
    origin: { agent, model: "m", session: "s" },
    scope: { entity_type: "Concept", atom_state: "proposed" },
    confidence: 0.7,
    binding: "task-fleet-worktree-committer",
    created: "2026-10-10T16:00:00Z",
    body: `# Concept: from ${agent}\n\nbody.\n` + renderEdgesBlock([]),
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
  // Spoof: a payload claiming origin agent-b written onto agent-a's outbox.
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

test("a proposal directory renamed to disagree with its id is set aside", () => {
  const f = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
  const a = proposal("agent-a");
  // Hand-place the payload under a wrong directory name.
  const dir = join(f.proposerFor("agent-a").path, "proposals", "deadbeef");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "proposal.md"), a.proposalMd, "utf8");
  writeFileSync(join(dir, "source.md"), a.sourceMd, "utf8");

  const verdicts = verifyPass(f);
  assert.equal(verdicts.length, 1);
  assert.equal(verdicts[0].ok, false);
  assert.match(verdicts[0].reasons.join("; "), /does not match proposal_id/);
});
