// The N+1 worktree layout (fleet-spec.md § Model).
//
// One object store carries N+1 linked worktrees: one committer worktree holding
// the canonical branch, and one worktree per proposer agent on its own outbox
// branch. A linked git worktree binds to exactly one branch, so one worktree per
// agent is one outbox branch per agent by construction.
//
// The branch -> owner map built here is the anti-spoof binding: an agent writes
// only to its own outbox branch, so the committer maps the branch back to the
// agent and rejects any payload whose declared origin disagrees. `ownerOf`
// returns the registered handle for a known outbox branch and null for anything
// else, so an unregistered branch owns nothing.

import { join } from "node:path";
import { init, addWorktree, removeWorktree, commitAll, currentBranch } from "./git.mjs";

export const OUTBOX_PREFIX = "outbox/";

export function branchForHandle(handle) {
  return `${OUTBOX_PREFIX}${handle}`;
}

export function handleForBranch(branch) {
  return branch && branch.startsWith(OUTBOX_PREFIX)
    ? branch.slice(OUTBOX_PREFIX.length)
    : null;
}

// Stand up the fleet layout under `root`:
//   <root>/canonical          committer worktree on the canonical branch
//   <root>/outbox-<handle>     one worktree per proposer on outbox/<handle>
//
// The canonical repo is the shared object store; proposer worktrees are linked
// to it, so all N+1 share one store. The canonical branch is seeded with one
// commit so the outbox branches have a base to fork from (a proposer reads
// canonical as its starting point).
//
// Returns a descriptor whose `ownerOf(branch)` is the branch -> owner map.
export function setupFleet({ root, canonicalBranch = "canonical", proposers = [], identity = {} }) {
  const canonicalPath = join(root, "canonical");
  init(canonicalPath, { initialBranch: canonicalBranch });
  commitAll(canonicalPath, "seed canonical", {
    name: identity.name,
    email: identity.email,
    allowEmpty: true,
  });

  const owners = new Map(); // outbox branch -> handle
  const built = [];
  for (const p of proposers) {
    const handle = typeof p === "string" ? p : p.handle;
    if (!handle) throw new Error("proposer needs a handle");
    if (owners.has(branchForHandle(handle))) {
      throw new Error(`duplicate proposer handle: ${handle}`);
    }
    const branch = branchForHandle(handle);
    const path = join(root, `outbox-${handle}`);
    addWorktree(canonicalPath, path, branch, { newBranch: true });
    owners.set(branch, handle);
    built.push({ handle, path, branch });
  }

  return {
    root,
    canonicalPath,
    canonicalBranch,
    proposers: built,
    // The anti-spoof binding: known outbox branch -> owner handle, else null.
    ownerOf(branch) {
      return owners.get(branch) ?? null;
    },
    proposerFor(handle) {
      return built.find((p) => p.handle === handle) ?? null;
    },
  };
}

// Remove the proposer worktrees. The canonical worktree and its object store
// stay; a proposer's un-folded proposals are the committer's to fold into the
// durable proposed ref before teardown (a later milestone), not dropped here.
export function teardownFleet(descriptor, { force = false } = {}) {
  for (const p of descriptor.proposers) {
    removeWorktree(descriptor.canonicalPath, p.path, { force });
  }
}

export { currentBranch };
