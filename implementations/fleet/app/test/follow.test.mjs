// Canonical branch following (task-fleet-canonical-follow): drain onto the old
// branch, clear the outboxes, write the config, merge the new branch into each
// outbox, refuse on dirty worktrees or unverifiable proposals, fleet mode only.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setupFromConfig, loadFromConfig, fleetMode, writeConfigBranch, readFleetConfig, CONFIG_REL } from "../worktrees.mjs";
import { init, commitAll, currentBranch, git, isAncestor, showFile, switchBranch } from "../git.mjs";
import { proposeToOutbox } from "../outbox.mjs";
import { switchCanonical, followSwitch, readRecordedBranch, dirtyWorktrees, FollowRefused } from "../follow.mjs";
import { writeSeed, conceptProposal, IDENTITY } from "./_fixtures.mjs";

const SUB = join(".konspekt", "instance");
const CLI = join(dirname(fileURLToPath(import.meta.url)), "..", "cli.mjs");

// Compact agent lines, as the dogfood config writes them, to check that the
// canonicalBranch write keeps the rest of the file's formatting.
const CONFIG_TEXT =
  '{\n  "version": 1,\n  "canonicalBranch": "fleet_main",\n  "topology": "worktree",\n  "agents": [\n' +
  '    { "handle": "agent-a", "role": "r", "entityTypes": ["concept"] }\n  ]\n}\n';

let root, canonicalPath, worktreeDir;

function seedCanonical(configText = CONFIG_TEXT) {
  init(canonicalPath, { initialBranch: "fleet_main" });
  writeSeed(join(canonicalPath, SUB));
  writeFileSync(join(canonicalPath, ".gitignore"), ".konspekt-fleet/\n", "utf8");
  const cfg = join(canonicalPath, CONFIG_REL);
  mkdirSync(dirname(cfg), { recursive: true });
  writeFileSync(cfg, configText, "utf8");
  commitAll(canonicalPath, "seed canonical", IDENTITY);
}

function standUp() {
  seedCanonical();
  setupFromConfig({ canonicalPath, worktreeDir, identity: IDENTITY });
  return loadFromConfig({ canonicalPath });
}

const outboxPath = (fleet) => fleet.proposerFor("agent-a").path;
const outboxItems = (fleet) => {
  const d = join(outboxPath(fleet), "proposals");
  return existsSync(d) ? readdirSync(d) : [];
};
const conceptOn = (rev, id = "concept-foo") => showFile(canonicalPath, rev, `${SUB}/concepts/${id}.md`) != null;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "konspekt-follow-"));
  canonicalPath = join(root, "canonical");
  worktreeDir = join(root, "wt");
});
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

test("fleetMode is active only when the config's outbox worktrees are stood up", () => {
  seedCanonical();
  const before = fleetMode(canonicalPath);
  assert.equal(before.active, false);
  assert.match(before.reason, /not stood up/);
  setupFromConfig({ canonicalPath, worktreeDir, identity: IDENTITY });
  assert.equal(fleetMode(canonicalPath).active, true);
  assert.equal(fleetMode(join(root, "elsewhere")).active, false);
});

test("writeConfigBranch edits canonicalBranch in place and commits that file only", () => {
  seedCanonical();
  writeFileSync(join(canonicalPath, "unrelated.txt"), "x\n", "utf8");
  const commit = writeConfigBranch(canonicalPath, "next", { identity: IDENTITY });
  assert.ok(commit);
  const text = readFileSync(join(canonicalPath, CONFIG_REL), "utf8");
  assert.equal(text, CONFIG_TEXT.replace('"fleet_main"', '"next"'));
  assert.equal(git(canonicalPath, ["status", "--porcelain"]), "?? unrelated.txt");
  assert.match(git(canonicalPath, ["log", "-1", "--format=%B"]), /Signed-off-by:/);
  assert.equal(writeConfigBranch(canonicalPath, "next", { identity: IDENTITY }), null);
});

test("setupFromConfig writes the current branch into a config that names another", () => {
  seedCanonical(CONFIG_TEXT.replace('"fleet_main"', '"stale_branch"'));
  const { descriptor } = setupFromConfig({ canonicalPath, worktreeDir, identity: IDENTITY });
  assert.equal(descriptor.canonicalBranch, "fleet_main");
  assert.equal(readFleetConfig(canonicalPath).canonicalBranch, "fleet_main");
  // The outbox forks after the config commit, so it carries the corrected value.
  const cfgOnOutbox = JSON.parse(readFileSync(join(descriptor.proposers[0].path, CONFIG_REL), "utf8"));
  assert.equal(cfgOnOutbox.canonicalBranch, "fleet_main");
});

test("switchCanonical drains onto the old branch, clears the outbox, and moves the fleet", () => {
  const { fleet, grants } = standUp();
  git(canonicalPath, ["branch", "other"]); // an existing branch without the fold
  proposeToOutbox(outboxPath(fleet), conceptProposal(), { identity: IDENTITY });
  assert.equal(outboxItems(fleet).length, 1);

  const r = switchCanonical(fleet, { to: "other", grants, identity: IDENTITY, instanceSubdir: SUB });

  assert.equal(r.from, "fleet_main");
  assert.equal(r.drain.folded.length, 1);
  assert.ok(conceptOn("fleet_main"), "the pending proposal folded onto the old branch");
  assert.equal(conceptOn("other"), false, "the new branch did not receive the drained fold");
  assert.equal(outboxItems(fleet).length, 0, "the drained proposal was cleared from the outbox");
  assert.equal(currentBranch(canonicalPath), "other");
  assert.equal(readFleetConfig(canonicalPath).canonicalBranch, "other");
  assert.ok(isAncestor(outboxPath(fleet), "other", "HEAD"), "the outbox contains the new canonical");
  assert.equal(readRecordedBranch(canonicalPath), "other");
  assert.equal(fleet.canonicalBranch, "other");
  assert.match(git(outboxPath(fleet), ["log", "-2", "--format=%B"]), /Signed-off-by:/);
});

test("switchCanonical --create makes the new branch after the drain", () => {
  const { fleet, grants } = standUp();
  proposeToOutbox(outboxPath(fleet), conceptProposal(), { identity: IDENTITY });
  const r = switchCanonical(fleet, { to: "next", create: true, grants, identity: IDENTITY, instanceSubdir: SUB });
  assert.equal(r.to, "next");
  assert.ok(conceptOn("fleet_main"));
  assert.ok(conceptOn("next"), "a branch created after the drain carries the fold");
  assert.equal(readFleetConfig(canonicalPath).canonicalBranch, "next");
  assert.equal(r.outboxes[0].status, "merged");
});

test("switchCanonical refuses while a worktree is dirty and changes nothing", () => {
  const { fleet, grants } = standUp();
  git(canonicalPath, ["branch", "other"]);
  proposeToOutbox(outboxPath(fleet), conceptProposal(), { identity: IDENTITY });
  writeFileSync(join(outboxPath(fleet), "scratch.txt"), "work in progress\n", "utf8");

  assert.equal(dirtyWorktrees(fleet).length, 1);
  assert.throws(
    () => switchCanonical(fleet, { to: "other", grants, identity: IDENTITY, instanceSubdir: SUB }),
    (e) => e instanceof FollowRefused && /uncommitted changes/.test(e.message) && /agent-a/.test(e.message),
  );
  assert.equal(currentBranch(canonicalPath), "fleet_main");
  assert.equal(conceptOn("fleet_main"), false);
  assert.equal(outboxItems(fleet).length, 1);
});

test("switchCanonical refuses when a pending proposal fails verification", () => {
  const { fleet } = standUp();
  git(canonicalPath, ["branch", "other"]);
  proposeToOutbox(outboxPath(fleet), conceptProposal(), { identity: IDENTITY });
  const noGrant = { "agent-a": { entityTypes: ["artifact"] } };
  assert.throws(
    () => switchCanonical(fleet, { to: "other", grants: noGrant, identity: IDENTITY, instanceSubdir: SUB }),
    (e) => e instanceof FollowRefused && /fail verification/.test(e.message),
  );
  assert.equal(currentBranch(canonicalPath), "fleet_main");
  assert.equal(outboxItems(fleet).length, 1);
});

test("switchCanonical validates the target branch", () => {
  const { fleet, grants } = standUp();
  const opts = { grants, identity: IDENTITY, instanceSubdir: SUB };
  assert.throws(() => switchCanonical(fleet, { ...opts, to: "fleet_main" }), /already on/);
  assert.throws(() => switchCanonical(fleet, { ...opts, to: "missing" }), /does not exist/);
  git(canonicalPath, ["branch", "dup"]);
  assert.throws(() => switchCanonical(fleet, { ...opts, to: "dup", create: true }), /already exists/);
});

test("followSwitch drains onto the previous branch after a manual switch", () => {
  const { fleet, grants } = standUp();
  git(canonicalPath, ["branch", "other"]);
  proposeToOutbox(outboxPath(fleet), conceptProposal(), { identity: IDENTITY });
  switchBranch(canonicalPath, "other"); // switched outside the fleet

  const r = followSwitch(fleet, { grants, identity: IDENTITY, instanceSubdir: SUB });

  assert.equal(r.from, "fleet_main");
  assert.equal(r.to, "other");
  assert.ok(conceptOn("fleet_main"), "drained onto the previous branch through a temporary worktree");
  assert.equal(conceptOn("other"), false);
  assert.equal(outboxItems(fleet).length, 0);
  assert.equal(readFleetConfig(canonicalPath).canonicalBranch, "other");
  assert.ok(isAncestor(outboxPath(fleet), "other", "HEAD"));
  // The fold log stays in the real canonical worktree's runtime directory.
  assert.match(readFileSync(join(canonicalPath, ".konspekt-fleet", "folded.md"), "utf8"), /concept:concept-foo/);
  // The temporary worktree is gone.
  assert.equal(git(canonicalPath, ["worktree", "list"]).split("\n").length, 2);
  assert.equal(followSwitch(fleet, { grants, identity: IDENTITY, instanceSubdir: SUB }), null);
});

test("cli follow-canonical follows a manual switch; run-pass names it on a mismatch", () => {
  const { fleet } = standUp();
  git(canonicalPath, ["branch", "other"]);
  proposeToOutbox(outboxPath(fleet), conceptProposal(), { identity: IDENTITY });
  switchBranch(canonicalPath, "other");
  const run = (args) => execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

  assert.throws(() => run(["run-pass", "--canonical", canonicalPath, "--dry-run"]), (e) => /follow-canonical/.test(String(e.stderr)));
  const out = run(["follow-canonical", "--canonical", canonicalPath, "--name", IDENTITY.name, "--email", IDENTITY.email]);
  assert.match(out, /canonical branch: fleet_main -> other/);
  assert.match(out, /cleared 1 item\(s\) from outbox\/agent-a/);
  assert.match(run(["follow-canonical", "--canonical", canonicalPath]), /nothing to follow/);
  run(["run-pass", "--canonical", canonicalPath, "--dry-run"]); // no mismatch now
});

test("cli switch-canonical refuses outside fleet mode", () => {
  seedCanonical(); // config present, no outbox worktrees stood up
  const r = () => execFileSync(process.execPath, [CLI, "switch-canonical", "--canonical", canonicalPath, "--to", "x"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.throws(r, (e) => /not stood up|fleet mode/.test(String(e.stderr)));
});

test("run-pass --watch follows a manual switch, logging a dirty-worktree refusal once", async () => {
  const { spawn } = await import("node:child_process");
  const { fleet } = standUp();
  git(canonicalPath, ["branch", "other"]);
  proposeToOutbox(outboxPath(fleet), conceptProposal(), { identity: IDENTITY });

  const child = spawn(process.execPath, [CLI, "run-pass", "--canonical", canonicalPath, "--watch", "--interval", "0.3",
    "--name", IDENTITY.name, "--email", IDENTITY.email], { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  child.stdout.on("data", (b) => { out += b; });
  child.stderr.on("data", (b) => { out += b; });
  const until = async (re, ms = 20000) => {
    const end = Date.now() + ms;
    while (!re.test(out)) {
      if (Date.now() > end) throw new Error(`timed out waiting for ${re}; output:\n${out}`);
      await new Promise((r) => setTimeout(r, 100));
    }
  };
  try {
    // First tick folds onto fleet_main and records it.
    await until(/folded 1 onto canonical/);
    proposeToOutbox(outboxPath(fleet), conceptProposal({ id: "concept-bar", edgeId: "e-bar" }), { identity: IDENTITY });
    // Let the watcher finish folding concept-bar before switching: a manual
    // switch during a fold commit is the accepted race this test does not cover.
    await until(/folded 1 onto canonical[\s\S]*folded 1 onto canonical/);
    writeFileSync(join(outboxPath(fleet), "scratch.txt"), "wip\n", "utf8");
    switchBranch(canonicalPath, "other");
    await until(/not following yet/);
    await new Promise((r) => setTimeout(r, 1200)); // several ticks while still dirty
    assert.equal(out.match(/not following yet/g).length, 1, "the refusal is logged once");
    rmSync(join(outboxPath(fleet), "scratch.txt"));
    await until(/canonical branch: fleet_main -> other/);
  } finally {
    child.kill();
  }
  assert.ok(conceptOn("fleet_main", "concept-bar"), "concept-bar is on the old branch only");
  assert.equal(conceptOn("other", "concept-bar"), false);
  assert.equal(readFleetConfig(canonicalPath).canonicalBranch, "other");
});

test("a release awaiting accept blocks the switch; an earlier-applied claim is cleared", async () => {
  const { assembleClaim, writeClaimToOutbox, applyClaims, nodeStatus } = await import("../claims.mjs");
  const { fleet, grants } = standUp();
  git(canonicalPath, ["branch", "other"]);
  const box = outboxPath(fleet);
  const write = (c) => writeClaimToOutbox(box, assembleClaim({ ...c, agent: "agent-a", created: "2026-10-12T00:00:00Z" }), { identity: IDENTITY });

  // A claim applied in an earlier pass: task-demo is now active, the claim stays in the outbox.
  const claimed = write({ kind: "claim", node: "task-demo" });
  applyClaims(fleet, { instanceSubdir: SUB, identity: IDENTITY });
  assert.equal(nodeStatus(join(canonicalPath, SUB), "task-demo"), "active");

  // A release now awaits the human's accept: the switch refuses and writes nothing.
  const release = write({ kind: "release", node: "task-demo", to: "resolved" });
  const head = git(canonicalPath, ["rev-parse", "HEAD"]);
  assert.throws(
    () => switchCanonical(fleet, { to: "other", grants, identity: IDENTITY, instanceSubdir: SUB }),
    (e) => e instanceof FollowRefused && /await the human's accept/.test(e.message) && e.message.includes(release.claimId.slice(0, 12)),
  );
  assert.equal(git(canonicalPath, ["rev-parse", "HEAD"]), head);
  assert.equal(currentBranch(canonicalPath), "fleet_main");

  // With the release removed from the outbox, the switch proceeds and clears the
  // earlier-applied claim, whose node already holds its target status.
  git(box, ["rm", "-r", "-q", `proposals/${release.claimId}`]);
  git(box, ["-c", `user.name=${IDENTITY.name}`, "-c", `user.email=${IDENTITY.email}`, "commit", "-q", "-m", "drop release"]);
  const r = switchCanonical(fleet, { to: "other", grants, identity: IDENTITY, instanceSubdir: SUB });
  assert.deepEqual(r.drain.cleared.map((c) => c.ids).flat(), [claimed.claimId]);
  assert.equal(outboxItems(fleet).length, 0);
});
