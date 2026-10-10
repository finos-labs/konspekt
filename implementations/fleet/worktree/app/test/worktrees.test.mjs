import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  setupFleet,
  teardownFleet,
  branchForHandle,
  handleForBranch,
} from "../worktrees.mjs";
import { listWorktrees, commitAll, currentBranch } from "../git.mjs";

const IDENTITY = { name: "Test Committer", email: "test@konspekt.local" };
let root;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "konspekt-fleet-"));
});

afterEach(() => {
  try {
    rmSync(root, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup; a locked worktree on Windows should not fail the run.
  }
});

function fleet() {
  return setupFleet({
    root,
    proposers: ["agent-a", "agent-b"],
    identity: IDENTITY,
  });
}

test("branch <-> handle round-trips", () => {
  assert.equal(branchForHandle("agent-a"), "outbox/agent-a");
  assert.equal(handleForBranch("outbox/agent-a"), "agent-a");
  assert.equal(handleForBranch("canonical"), null);
});

test("setup creates N+1 worktrees off one object store", () => {
  const f = fleet();
  assert.equal(currentBranch(f.canonicalPath), "canonical");
  assert.equal(f.proposers.length, 2);

  const wts = listWorktrees(f.canonicalPath);
  assert.equal(wts.length, 3); // canonical + 2 outboxes
  const branches = wts.map((w) => w.branch).sort();
  assert.deepEqual(branches, ["canonical", "outbox/agent-a", "outbox/agent-b"]);
});

test("ownerOf is the anti-spoof branch -> owner map", () => {
  const f = fleet();
  assert.equal(f.ownerOf("outbox/agent-a"), "agent-a");
  assert.equal(f.ownerOf("outbox/agent-b"), "agent-b");
  assert.equal(f.ownerOf("outbox/not-a-proposer"), null);
  assert.equal(f.ownerOf("canonical"), null);
});

test("a proposer writes only its own worktree", () => {
  const f = fleet();
  const a = f.proposerFor("agent-a");
  const b = f.proposerFor("agent-b");

  mkdirSync(join(a.path, "proposals", "p1"), { recursive: true });
  writeFileSync(join(a.path, "proposals", "p1", "proposal.md"), "---\nkind: entity\n---\nbody\n");
  commitAll(a.path, "outbox: p1", IDENTITY);

  // The proposal lives on agent-a's branch only.
  assert.ok(existsSync(join(a.path, "proposals", "p1", "proposal.md")));
  assert.ok(!existsSync(join(b.path, "proposals", "p1", "proposal.md")));
  assert.ok(!existsSync(join(f.canonicalPath, "proposals", "p1", "proposal.md")));
});

test("duplicate proposer handles are rejected", () => {
  assert.throws(
    () => setupFleet({ root, proposers: ["dup", "dup"], identity: IDENTITY }),
    /duplicate proposer handle/,
  );
});

test("teardown removes the proposer worktrees, keeping canonical", () => {
  const f = fleet();
  teardownFleet(f, { force: true });
  const wts = listWorktrees(f.canonicalPath);
  assert.equal(wts.length, 1);
  assert.equal(wts[0].branch, "canonical");
});
