import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { init, commitAll } from "../git.mjs";
import { CONFIG_REL } from "../worktrees.mjs";
import { authorityPreflight, canonicalBranchCheck, DEFAULT_INSTANCE_SUBDIR, PRINCIPAL_ENV } from "../preflight.mjs";

const CLI = fileURLToPath(new URL("../cli.mjs", import.meta.url));
const IDENTITY = { name: "T", email: "t@konspekt.local" };

const PRINCIPALS = `# Principals

| id | kind | roles | key |
|----|------|-------|-----|
| denisurusov | human | grantor |  |
| spec-writer | agent |  |  |
`;
// A grantor-held accept grant over the whole graph, dated well in the past so it
// is effective now.
const GRANTS = `# Grants

| scope | acceptor | action | grantor | timestamp | source |
|-------|----------|--------|---------|-----------|--------|
| * | denisurusov | grant | denisurusov | 2020-01-01T00:00:00Z |  |
`;

const CONFIG = {
  version: 1,
  canonicalBranch: "fleet_main",
  topology: "worktree",
  agents: [{ handle: "spec-writer", role: "spec-writer", entityTypes: ["artifact"] }],
};

let root, canonicalPath;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "konspekt-preflight-"));
  canonicalPath = join(root, "canonical");
});
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

const authDir = () => join(canonicalPath, DEFAULT_INSTANCE_SUBDIR, "authority");
function writeAuthority({ principals = PRINCIPALS, grants = GRANTS } = {}) {
  mkdirSync(authDir(), { recursive: true });
  if (principals !== null) writeFileSync(join(authDir(), "principals.md"), principals, "utf8");
  if (grants !== null) writeFileSync(join(authDir(), "grants.md"), grants, "utf8");
}

// --- authorityPreflight (pure, no git) ---------------------------------------

test("preflight passes when a grantor is declared, granted, and named by the env", () => {
  writeAuthority();
  const pf = authorityPreflight({ canonicalPath, principal: "denisurusov" });
  assert.equal(pf.ok, true, pf.problems.join("; "));
  assert.deepEqual(pf.acceptors, ["denisurusov"]);
});

test("preflight blocks when the instance declares no authority at all", () => {
  const pf = authorityPreflight({ canonicalPath, principal: "denisurusov" });
  assert.equal(pf.ok, false);
  assert.match(pf.problems.join("\n"), /declares no principals/);
  assert.match(pf.problems.join("\n"), /no effective accept grant/);
});

test("preflight blocks when no principal is a human grantor", () => {
  writeAuthority({
    principals: `# Principals

| id | kind | roles | key |
|----|------|-------|-----|
| spec-writer | agent |  |  |
`,
  });
  const pf = authorityPreflight({ canonicalPath, principal: "denisurusov" });
  assert.equal(pf.ok, false);
  assert.match(pf.problems.join("\n"), /no human grantor/);
});

test("preflight blocks when there is no effective accept grant", () => {
  writeAuthority({
    grants: `# Grants

| scope | acceptor | action | grantor | timestamp | source |
|-------|----------|--------|---------|-----------|--------|
`,
  });
  const pf = authorityPreflight({ canonicalPath, principal: "denisurusov" });
  assert.equal(pf.ok, false);
  assert.match(pf.problems.join("\n"), /no effective accept grant/);
});

test("preflight blocks when KONSPEKT_PRINCIPAL is unset", () => {
  writeAuthority();
  const pf = authorityPreflight({ canonicalPath, principal: "" });
  assert.equal(pf.ok, false);
  assert.match(pf.problems.join("\n"), new RegExp(`${PRINCIPAL_ENV} is not set`));
  // the hint names a value that would satisfy the check
  assert.match(pf.problems.join("\n"), /denisurusov/);
});

test("preflight blocks when KONSPEKT_PRINCIPAL names an undeclared principal", () => {
  writeAuthority();
  const pf = authorityPreflight({ canonicalPath, principal: "mallory" });
  assert.equal(pf.ok, false);
  assert.match(pf.problems.join("\n"), /names no declared principal/);
});

test("preflight blocks when KONSPEKT_PRINCIPAL names a declared but ungranted principal", () => {
  writeAuthority();
  const pf = authorityPreflight({ canonicalPath, principal: "spec-writer" });
  assert.equal(pf.ok, false);
  assert.match(pf.problems.join("\n"), /holds no accept grant/);
});

// --- CLI wiring: setup blocks, doctor reports --------------------------------

const run = (args, { principal } = {}) => {
  const env = { ...process.env };
  delete env[PRINCIPAL_ENV];
  if (principal) env[PRINCIPAL_ENV] = principal;
  return execFileSync("node", [CLI, ...args], { encoding: "utf8", env });
};

function seedCanonicalGit({ withAuthority = true } = {}) {
  init(canonicalPath, { initialBranch: "fleet_main" });
  const cfgPath = join(canonicalPath, CONFIG_REL);
  mkdirSync(join(cfgPath, ".."), { recursive: true });
  writeFileSync(cfgPath, JSON.stringify(CONFIG, null, 2) + "\n", "utf8");
  if (withAuthority) writeAuthority();
  commitAll(canonicalPath, "seed canonical", IDENTITY);
}

test("setup refuses to stand up a fleet with no acceptance authority", () => {
  seedCanonicalGit({ withAuthority: false });
  let err;
  try {
    run(["setup", "--canonical", canonicalPath, "--worktree-dir", join(root, "wt")], { principal: "denisurusov" });
  } catch (e) { err = e; }
  assert.ok(err, "setup should have failed");
  const text = String(err.stderr || err.message);
  assert.match(text, /preflight failed/);
  assert.match(text, /declares no principals/);
});

test("setup proceeds and names the acceptance authority when the preflight passes", () => {
  seedCanonicalGit({ withAuthority: true });
  const out = run(["setup", "--canonical", canonicalPath, "--worktree-dir", join(root, "wt")], { principal: "denisurusov" });
  assert.match(out, /set up fleet from config/);
  assert.match(out, /acceptance authority: denisurusov/);
});

test("doctor exits non-zero and explains when authority is missing", () => {
  mkdirSync(canonicalPath, { recursive: true });
  let err;
  try { run(["doctor", "--canonical", canonicalPath], {}); } catch (e) { err = e; }
  assert.ok(err, "doctor should have exited non-zero");
  const text = String(err.stderr || err.message);
  assert.match(text, /doctor FAILED/);
  assert.match(text, new RegExp(`${PRINCIPAL_ENV} is not set`));
});

test("doctor passes when authority is declared and KONSPEKT_PRINCIPAL is granted", () => {
  mkdirSync(canonicalPath, { recursive: true });
  writeAuthority();
  const out = run(["doctor", "--canonical", canonicalPath], { principal: "denisurusov" });
  assert.match(out, /acceptance authority OK/);
  assert.match(out, /denisurusov/);
});

// --- canonicalBranchCheck (git-backed) ---------------------------------------

test("canonicalBranchCheck passes when the worktree is on the configured branch", () => {
  init(canonicalPath, { initialBranch: "fleet_main" });
  commitAll(canonicalPath, "seed", { ...IDENTITY, allowEmpty: true });
  const bc = canonicalBranchCheck({ canonicalPath, configuredBranch: "fleet_main" });
  assert.equal(bc.ok, true, bc.problem || "");
  assert.equal(bc.actual, "fleet_main");
});

test("canonicalBranchCheck fails when the worktree has drifted off the configured branch", () => {
  init(canonicalPath, { initialBranch: "fleet_main" });
  commitAll(canonicalPath, "seed", { ...IDENTITY, allowEmpty: true });
  execFileSync("git", ["-C", canonicalPath, "switch", "-c", "drifted"], { encoding: "utf8" });
  const bc = canonicalBranchCheck({ canonicalPath, configuredBranch: "fleet_main" });
  assert.equal(bc.ok, false);
  assert.equal(bc.actual, "drifted");
  assert.match(bc.problem, /folds follow the worktree's current branch/);
});

test("canonicalBranchCheck passes when no branch is configured (nothing to contradict)", () => {
  init(canonicalPath, { initialBranch: "fleet_main" });
  commitAll(canonicalPath, "seed", { ...IDENTITY, allowEmpty: true });
  const bc = canonicalBranchCheck({ canonicalPath, configuredBranch: undefined });
  assert.equal(bc.ok, true);
  assert.equal(bc.actual, "fleet_main");
});

// --- CLI wiring: run-pass / doctor assert the canonical branch ---------------

test("doctor reports the canonical branch matches the config", () => {
  seedCanonicalGit({ withAuthority: true });
  const out = run(["doctor", "--canonical", canonicalPath], { principal: "denisurusov" });
  assert.match(out, /acceptance authority OK/);
  assert.match(out, /matches config canonicalBranch/);
});

test("doctor fails when the canonical worktree drifted off the configured branch", () => {
  seedCanonicalGit({ withAuthority: true });
  execFileSync("git", ["-C", canonicalPath, "switch", "-c", "drifted"], { encoding: "utf8" });
  let err;
  try { run(["doctor", "--canonical", canonicalPath], { principal: "denisurusov" }); } catch (e) { err = e; }
  assert.ok(err, "doctor should have exited non-zero");
  const text = String(err.stderr || err.message);
  assert.match(text, /doctor FAILED/);
  assert.match(text, /folds follow the worktree's current branch/);
});

test("run-pass refuses when the canonical worktree drifted off the configured branch", () => {
  seedCanonicalGit({ withAuthority: true });
  run(["setup", "--canonical", canonicalPath, "--worktree-dir", join(root, "wt")], { principal: "denisurusov" });
  execFileSync("git", ["-C", canonicalPath, "switch", "-c", "drifted"], { encoding: "utf8" });
  let err;
  try {
    run(["run-pass", "--canonical", canonicalPath, "--dry-run"], { principal: "denisurusov" });
  } catch (e) { err = e; }
  assert.ok(err, "run-pass should have refused");
  assert.match(String(err.stderr || err.message), /folds follow the worktree's current branch/);
});
