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

import { join, dirname, basename, resolve } from "node:path";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { init, addWorktree, removeWorktree, commitAll, currentBranch, listWorktrees } from "./git.mjs";

export const OUTBOX_PREFIX = "outbox/";
const MANIFEST = "fleet.json";
// The committed fleet config: repo-local envelope on the canonical branch,
// beside OPERATING.md, NOT inside the portable .konspekt/instance/
// (nw-fleet-config-on-canonical). It is the declarative setup driver
// (nw-fleet-config-is-setup-driver).
export const CONFIG_REL = join(".konspekt", "fleet", "config", "fleet.json");

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

// ----- config-driven setup/attach (task-fleet-config-driven-setup) -----
//
// The committed `.konspekt/fleet/config/fleet.json` is the single declarative
// source: fleet-level fields plus one entry per agent
// `{ handle, role, entityTypes, branch? }`, grants folded in. Host paths are not
// stored — under `topology: worktree` each is resolved at attach time from
// `git worktree list` keyed by the agent's branch (nw-fleet-config-is-setup-driver).

// Read and minimally validate the committed config from the canonical worktree.
export function readFleetConfig(canonicalPath, { configRel = CONFIG_REL } = {}) {
  const path = join(canonicalPath, configRel);
  if (!existsSync(path)) throw new Error(`no fleet config at ${configRel} in ${canonicalPath}`);
  const config = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(config.agents) || config.agents.length === 0) {
    throw new Error(`fleet config ${configRel} has no agents[]`);
  }
  for (const a of config.agents) {
    if (!a.handle) throw new Error(`fleet config agent entry has no handle: ${JSON.stringify(a)}`);
  }
  const topology = config.topology || "worktree";
  if (topology !== "worktree") {
    throw new Error(`fleet config topology "${topology}" is not supported (only "worktree")`);
  }
  return config;
}

// The proposer grant map verify/fold expect: { <handle>: { entityTypes } },
// taken from each agent's config entry (the former separate grants.json).
export function grantsFromConfig(config) {
  const grants = {};
  for (const a of config.agents) {
    if (Array.isArray(a.entityTypes)) grants[a.handle] = { entityTypes: a.entityTypes };
  }
  return grants;
}

const agentBranch = (a) => a.branch || branchForHandle(a.handle);

// Stand up the fleet from a committed config: one `outbox/<handle>` worktree per
// agent off the canonical branch. `canonicalPath` is the committer's canonical
// worktree (the shared object store). `worktreeDir` is where the outbox
// worktrees are created; it is NOT persisted (derived on attach), defaulting to
// a `<name>-fleet` sibling of the canonical worktree. Returns { descriptor,
// grants, config }.
export function setupFromConfig({ canonicalPath, worktreeDir, config, configRel } = {}) {
  const cfg = config || readFleetConfig(canonicalPath, { configRel });
  const canonicalBranch = cfg.canonicalBranch || currentBranch(canonicalPath);
  const dir = worktreeDir || join(dirname(canonicalPath), `${basename(canonicalPath)}-fleet`);

  const seen = new Set();
  const built = [];
  for (const a of cfg.agents) {
    if (seen.has(a.handle)) throw new Error(`duplicate agent handle in config: ${a.handle}`);
    seen.add(a.handle);
    const branch = agentBranch(a);
    const path = join(dir, `outbox-${a.handle}`);
    addWorktree(canonicalPath, path, branch, { newBranch: true });
    built.push({ handle: a.handle, path, branch });
  }

  const descriptor = descriptorFrom({ root: dir, canonicalPath, canonicalBranch, proposers: built });
  return { descriptor, grants: grantsFromConfig(cfg), config: cfg };
}

// Attach to a config-driven fleet with no hand-written manifest: read the
// committed config and resolve each agent's outbox worktree path from
// `git worktree list` on the canonical worktree, keyed by branch. Returns
// { fleet, grants, config }. A configured agent whose outbox worktree is not
// stood up is an error — run setup first.
export function loadFromConfig({ canonicalPath, configRel } = {}) {
  const cfg = readFleetConfig(canonicalPath, { configRel });
  const canonicalBranch = cfg.canonicalBranch || currentBranch(canonicalPath);
  const byBranch = new Map(listWorktrees(canonicalPath).map((w) => [w.branch, w.path]));
  const proposers = cfg.agents.map((a) => {
    const branch = agentBranch(a);
    const path = byBranch.get(branch);
    if (!path) throw new Error(`outbox worktree for agent "${a.handle}" (branch ${branch}) is not stood up; run setup`);
    return { handle: a.handle, path, branch };
  });
  const fleet = descriptorFrom({ root: canonicalPath, canonicalPath, canonicalBranch, proposers });
  return { fleet, grants: grantsFromConfig(cfg), config: cfg };
}

// Remove the proposer worktrees. The canonical worktree and its object store
// stay; a proposer's un-folded proposals are the committer's to fold into the
// durable proposed ref before teardown (a later milestone), not dropped here.
export function teardownFleet(descriptor, { force = false } = {}) {
  for (const p of descriptor.proposers) {
    removeWorktree(descriptor.canonicalPath, p.path, { force });
  }
}

// Resolve a fleet descriptor from the CLI's attach arguments, tolerant of the
// two invocation models so `--root` is not a footgun against a config-driven
// fleet (nw-fleet-skill-root-flag-stale). Returns { fleet, grants, mode }:
//   - `--canonical <path>`  -> config-driven attach, grants read from the config.
//   - `--root <dir>` with a flat `<dir>/fleet.json` -> legacy manifest, grants
//     null (the caller supplies them from `--grants`).
//   - `--root <FLEET_ROOT>` with no flat manifest but a config-driven canonical
//     at `<FLEET_ROOT>/canonical` -> config-driven attach off that canonical, so
//     the fleet-root mental model the proposer/committer skills describe works.
//   - otherwise a clear error naming `--canonical`.
export function resolveFleet({ canonical, root, configRel } = {}) {
  if (canonical) {
    const canonicalPath = resolve(canonical);
    const { fleet, grants } = loadFromConfig({ canonicalPath, configRel });
    return { fleet, grants, mode: "config" };
  }
  if (!root) throw new Error("attach needs --canonical <canonical-worktree> or --root <fleet-root>");
  const rootPath = resolve(root);
  if (existsSync(join(rootPath, MANIFEST))) {
    return { fleet: loadFleet(rootPath), grants: null, mode: "flat" };
  }
  const canonicalGuess = join(rootPath, "canonical");
  if (existsSync(join(canonicalGuess, configRel || CONFIG_REL))) {
    const { fleet, grants } = loadFromConfig({ canonicalPath: canonicalGuess, configRel });
    return { fleet, grants, mode: "config" };
  }
  throw new Error(
    `--root ${rootPath} has neither ${MANIFEST} nor canonical/${CONFIG_REL}; ` +
    `a config-driven fleet takes --canonical <path-to-canonical-worktree> ` +
    `(or point --root at the fleet root that holds canonical/)`,
  );
}

export { currentBranch };
