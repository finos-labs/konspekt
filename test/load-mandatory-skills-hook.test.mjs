#!/usr/bin/env node
// Test for .claude/hooks/load-mandatory-skills.sh — the SessionStart hook that
// injects the mandatory skills, the active persona briefs, and OPERATING.md.
//
// Scope: the persona-brief lookup and the binding-policy text. The brief must be
// found in an adopter's vendored copy (.konspekt/spec/personas/<layer>/) as well
// as in the standard's own spec/personas/<layer>/; a layer found in neither is
// named in a warning. The binding text must follow project.md `binding:`.
//
// Run:  node test/load-mandatory-skills-hook.test.mjs   (exit 0 = pass, 1 = fail)
// Requires bash on PATH.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, "..", ".claude", "hooks", "load-mandatory-skills.sh");
const BRIEF = "ENGINEER-BRIEF-MARKER";

// Returns the additionalContext string the hook emits for a temporary project.
function context({ briefAt, binding }) {
  const dir = mkdtempSync(join(tmpdir(), "konspekt-ssh-"));
  try {
    const instance = join(dir, ".konspekt", "instance");
    mkdirSync(instance, { recursive: true });
    writeFileSync(join(instance, "project.md"),
      "```yaml\nid: project-t\ngoal: test\npersonas: [engineer]\n" +
      (binding ? `binding: ${binding}\n` : "") + "```\n# t\n");
    writeFileSync(join(dir, ".konspekt", "OPERATING.md"), "# Operating policy\n");
    if (briefAt) {
      const d = join(dir, briefAt, "engineer");
      mkdirSync(d, { recursive: true });
      writeFileSync(join(d, "AGENTS.md"), BRIEF + "\n");
    }
    const r = spawnSync("bash", [HOOK], { encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
    if (r.status !== 0) throw new Error(`exit ${r.status}: ${r.stderr}`);
    return JSON.parse(r.stdout).hookSpecificOutput.additionalContext;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const CASES = [
  ["adopter vendored brief is injected", { briefAt: ".konspekt/spec/personas" },
    (c) => c.includes(BRIEF) && c.includes("BEGIN ACTIVE PERSONA BRIEF (engineer)")],
  ["standard's own brief is injected", { briefAt: "spec/personas" }, (c) => c.includes(BRIEF)],
  ["missing brief is named in a warning", {},
    (c) => !c.includes(BRIEF) && c.includes('persona layer "engineer" is active')],
  ["binding absent reads as required", {}, (c) => c.includes("`binding: required`")],
  ["binding optional allows a decline", { binding: "optional" },
    (c) => c.includes("`binding: optional`") && !c.includes("`binding: required`")],
];

const failures = [];
for (const [name, opts, check] of CASES) {
  let ok = false;
  try { ok = check(context(opts)); } catch (e) { failures.push(`${name}: ${e.message}`); }
  if (!ok) failures.push(name);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
}
if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
console.log(`\n${CASES.length} case(s) passed.`);
