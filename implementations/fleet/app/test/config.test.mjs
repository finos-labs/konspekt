import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readFleetConfig,
  grantsFromConfig,
  setupFromConfig,
  loadFromConfig,
  teardownFleet,
  CONFIG_REL,
} from "../worktrees.mjs";
import { init, commitAll, listWorktrees } from "../git.mjs";

const IDENTITY = { name: "Test Committer", email: "test@konspekt.local" };

const CONFIG = {
  version: 1,
  canonicalBranch: "fleet_main",
  topology: "worktree",
  agents: [
    { handle: "spec-writer", role: "spec-writer", entityTypes: ["artifact", "noteworthy"] },
    { handle: "skill-builder", role: "skill-builder", entityTypes: ["artifact"] },
  ],
};

let root, canonicalPath, worktreeDir;

// Build a canonical repo on `fleet_main` carrying a committed fleet config.
function seedCanonical(config = CONFIG) {
  init(canonicalPath, { initialBranch: "fleet_main" });
  const cfgPath = join(canonicalPath, CONFIG_REL);
  mkdirSync(join(cfgPath, ".."), { recursive: true });
  writeFileSync(cfgPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  commitAll(canonicalPath, "seed canonical + fleet config", IDENTITY);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "konspekt-config-"));
  canonicalPath = join(root, "canonical");
  worktreeDir = join(root, "wt");
});
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

test("readFleetConfig reads the committed config and rejects a bad one", () => {
  seedCanonical();
  const cfg = readFleetConfig(canonicalPath);
  assert.equal(cfg.agents.length, 2);
  assert.throws(() => readFleetConfig(join(root, "nope")), /no fleet config/);
});

test("readFleetConfig rejects an unsupported topology and an empty agents list", () => {
  canonicalPath = join(root, "c2");
  seedCanonical({ ...CONFIG, topology: "ssh" });
  assert.throws(() => readFleetConfig(canonicalPath), /topology "ssh" is not supported/);

  canonicalPath = join(root, "c3");
  seedCanonical({ ...CONFIG, agents: [] });
  assert.throws(() => readFleetConfig(canonicalPath), /no agents/);
});

test("grantsFromConfig maps each agent's entityTypes to a propose grant", () => {
  assert.deepEqual(grantsFromConfig(CONFIG), {
    "spec-writer": { entityTypes: ["artifact", "noteworthy"] },
    "skill-builder": { entityTypes: ["artifact"] },
  });
});

test("setupFromConfig stands up one outbox worktree per agent off canonical", () => {
  seedCanonical();
  const { descriptor, grants } = setupFromConfig({ canonicalPath, worktreeDir });
  assert.equal(descriptor.canonicalBranch, "fleet_main");
  assert.equal(descriptor.proposers.length, 2);

  const wts = listWorktrees(canonicalPath);
  assert.equal(wts.length, 3); // canonical + 2 outboxes
  assert.deepEqual(wts.map((w) => w.branch).sort(), ["fleet_main", "outbox/skill-builder", "outbox/spec-writer"]);
  assert.equal(grants["spec-writer"].entityTypes.length, 2);
});

test("loadFromConfig attaches with no manifest, resolving paths from git worktree list", () => {
  seedCanonical();
  const setup = setupFromConfig({ canonicalPath, worktreeDir });

  const { fleet, grants } = loadFromConfig({ canonicalPath });
  assert.equal(fleet.canonicalBranch, "fleet_main");
  // Paths resolved from `git worktree list` match what setup created (compared
  // separator-normalized: git reports forward slashes, path.join backslashes).
  const norm = (p) => p.split("\\").join("/");
  const byHandle = (d) => Object.fromEntries(d.proposers.map((p) => [p.handle, norm(p.path)]));
  assert.deepEqual(byHandle(fleet), byHandle(setup.descriptor));
  assert.equal(fleet.ownerOf("outbox/spec-writer"), "spec-writer");
  assert.deepEqual(grants["skill-builder"], { entityTypes: ["artifact"] });
});

test("loadFromConfig errors when a configured agent's outbox is not stood up", () => {
  seedCanonical();
  // No setup run: the outbox worktrees do not exist yet.
  assert.throws(() => loadFromConfig({ canonicalPath }), /not stood up; run setup/);
});

test("teardownFleet removes the config-driven proposer worktrees, keeping canonical", () => {
  seedCanonical();
  setupFromConfig({ canonicalPath, worktreeDir });
  const { fleet } = loadFromConfig({ canonicalPath });
  teardownFleet(fleet, { force: true });
  const wts = listWorktrees(canonicalPath);
  assert.equal(wts.length, 1);
  assert.equal(wts[0].branch, "fleet_main");
});
