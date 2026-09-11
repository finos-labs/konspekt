#!/usr/bin/env node
// Smoke test for setup/init.mjs — the adopter scaffolder (task-adoption-path).
//
// Scope is deliberately narrow: scaffold a fresh instance into a throwaway
// directory and check that every expected file lands in the right place, then
// check that a second scaffold into the same directory refuses. It does not
// assert file contents, component installs, or drift detection.
//
// Run:  node test/setup-init.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const INIT = join(HERE, "..", "setup", "init.mjs");

// Every path a default (no-arg) scaffold must create, relative to the repo root
// it runs in. Mirrors the put()/appendStanza() calls in setup/init.mjs.
const EXPECTED = [
  ".konspekt/instance/project.md",
  ".konspekt/instance/edges/edges.md",
  ".konspekt/instance/sources/README.md",
  ".konspekt/instance/nodes/.gitkeep",
  ".konspekt/instance/concepts/.gitkeep",
  ".konspekt/instance/noteworthy/.gitkeep",
  ".konspekt/instance/artifacts/.gitkeep",
  ".konspekt/instance/waypoints/.gitkeep",
  ".konspekt/OPERATING.md",
  ".konspekt/NOTES.md",
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
];

const failures = [];
const tmp = mkdtempSync(join(tmpdir(), "konspekt-setup-"));

try {
  // First scaffold must succeed (exit 0).
  try {
    execFileSync("node", [INIT, "--name", "Test Project", "--goal", "a test goal"],
      { cwd: tmp, stdio: "pipe" });
  } catch (e) {
    failures.push(`scaffold exited non-zero: ${e.status}\n${e.stderr || e.stdout || ""}`);
  }

  // Every expected file is present in the right place.
  for (const rel of EXPECTED) {
    if (!existsSync(join(tmp, rel))) failures.push(`missing: ${rel}`);
  }

  // A second scaffold into the same directory must refuse (non-zero exit),
  // rather than clobber the instance that is already there.
  let refused = false;
  try {
    execFileSync("node", [INIT], { cwd: tmp, stdio: "pipe" });
  } catch {
    refused = true;
  }
  if (!refused) failures.push("second scaffold did not refuse an existing instance");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL setup/init.mjs smoke test (${failures.length}):`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`ok setup/init.mjs — scaffolds ${EXPECTED.length} files in place and refuses to clobber`);
