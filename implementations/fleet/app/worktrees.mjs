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
import { writeFileSync, readFileSync } from "node:fs";
import { init, addWorktree, removeWorktree, commitAll, currentBranch } from "./git.mjs";

export const OUTBOX_PREFIX = "outbox/";
const MANIFEST = "fleet.json";

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

  const descriptor = descriptorFrom({ root, canonicalPath, canonicalBranch, proposers: built });
  writeManifest(descriptor);
  return descriptor;
}

// Build a fleet descriptor (data plus the owner/proposer lookups) from the plain
// data a manifest holds. One builder keeps setupFleet and loadFleet identical.
function descriptorFrom({ root, canonicalPath, canonicalBranch, proposers }) {
  const owners = new Map(proposers.map((p) => [p.branch, p.handle]));
  return {
    root,
    canonicalPath,
    canonicalBranch,
    proposers,
    // The anti-spoof binding: known outbox branch -> owner handle, else null.
    ownerOf(branch) {
      return owners.get(branch) ?? null;
    },
    proposerFor(handle) {
      return proposers.find((p) => p.handle === handle) ?? null;
    },
  };
}

// Persist the layout to <root>/fleet.json so a later CLI invocation (a separate
// process) attaches to the same worktrees and owner map instead of rebuilding.
export function writeManifest(descriptor) {
  const data = {
    canonicalPath: descriptor.canonicalPath,
    canonicalBranch: descriptor.canonicalBranch,
    proposers: descriptor.proposers.map((p) => ({ handle: p.handle, path: p.path, branch: p.branch })),
  };
  writeFileSync(join(descriptor.root, MANIFEST), JSON.stringify(data, null, 2) + "\n", "utf8");
}

// Attach to an existing on-disk fleet by reading its manifest. Does not touch
// git; it reconstructs the descriptor so run-pass and propose can operate.
export function loadFleet(root) {
  const data = JSON.parse(readFileSync(join(root, MANIFEST), "utf8"));
  return descriptorFrom({ root, ...data });
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
