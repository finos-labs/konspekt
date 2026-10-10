import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { standUpAndFold } from "./_fixtures.mjs";

// Exercise the CLI as a subprocess — the layer the unit tests skip. The
// rebuild-index path bug (passing the fleet root instead of the canonical
// worktree) was invisible to the module tests and only surfaced in the live
// dogfood, so these run the real entry point.
const CLI = fileURLToPath(new URL("../cli.mjs", import.meta.url));
const run = (args) => execFileSync("node", [CLI, ...args], { encoding: "utf8" });

let root;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "konspekt-cli-")); });
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

test("rebuild-index resolves the canonical worktree and reports the folded proposal", () => {
  standUpAndFold(root); // one concept folded, pending
  const out = run(["rebuild-index", "--root", root]);
  assert.match(out, /1 proposal\(s\)/);
  assert.match(out, /pending 1, accepted 0, rejected 0/);
});

test("bless via the CLI accepts a folded proposal and the index follows", () => {
  const { proposals } = standUpAndFold(root);
  run(["bless", "--root", root, "--by", "denisurusov", "--mode", "inspection",
    "--now", "2026-10-10T19:00:00Z", "--accept", proposals[0].proposalId,
    "--name", "Committer", "--email", "committer@konspekt.local"]);
  const out = run(["rebuild-index", "--root", root]);
  assert.match(out, /pending 0, accepted 1, rejected 0/);
});

test("run-pass --dry-run verifies without folding", () => {
  const { fleet } = standUpAndFold(root);
  // The folded proposal's payload still sits in the outbox; a dry-run re-reads
  // and reports it verified, folding nothing.
  const out = run(["run-pass", "--root", root, "--dry-run"]);
  assert.match(out, /1\/1 verified/);
  assert.doesNotMatch(out, /folded \d+ onto canonical/);
  void fleet;
});
