#!/usr/bin/env node
// Test for .claude/hooks/require-binding.sh — the PreToolUse hook that denies
// file edits until the session is bound, and, under `basis: accepted`, until the
// bound entity is accepted (task-binding-gap-audit, task-acceptance-before-work).
//
// Each case builds a temporary project directory, runs the hook with a tool
// payload on stdin, and checks whether the hook's output denies the edit. The
// hook signals a denial by printing a JSON object with permissionDecision
// "deny"; it prints nothing when it allows the edit.
//
// Run:  node test/require-binding-hook.test.mjs   (exit 0 = pass, 1 = fail)
// Requires bash on PATH.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, "..", ".claude", "hooks", "require-binding.sh");
const SESSION = "session-1";

function run({ basis, review, marker = "task-a", tool = "Edit", path, session = SESSION }) {
  const dir = mkdtempSync(join(tmpdir(), "konspekt-hook-"));
  try {
    const instance = join(dir, ".konspekt", "instance");
    mkdirSync(join(instance, "nodes", "task"), { recursive: true });
    writeFileSync(join(instance, "project.md"),
      "```yaml\nid: project-t\ngoal: test\n" + (basis ? `basis: ${basis}\n` : "") + "```\n# t\n");
    if (review) {
      writeFileSync(join(instance, "nodes", "task", "task-a.md"),
        "```yaml\nid: task-a\ntype: task\ntitle: A\nstatus: open\nreview: " + review + "\n```\n# Task: A\n");
    }
    if (marker) {
      mkdirSync(join(dir, ".claude", ".binding"), { recursive: true });
      writeFileSync(join(dir, ".claude", ".binding", SESSION), marker + "\n");
    }
    const payload = JSON.stringify({
      session_id: session, tool_name: tool,
      tool_input: path === undefined ? {} : { file_path: path.replace("<dir>", dir) },
    });
    const r = spawnSync("bash", [HOOK], { input: payload, encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
    if (r.status !== 0) return `exit ${r.status}: ${r.stderr}`;
    return /"permissionDecision"\s*:\s*"deny"/.test(r.stdout) ? "deny" : "allow";
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const SRC = "<dir>/lib/a.mjs";
const CASES = [
  ["no binding marker: edit denied", { marker: "", review: "accepted", path: SRC }, "deny"],
  ["bound, no basis field: edit allowed", { review: "proposed", path: SRC }, "allow"],
  ["bound, basis proposed: edit allowed", { basis: "proposed", review: "proposed", path: SRC }, "allow"],
  ["basis accepted, entity proposed, file outside the instance: denied",
    { basis: "accepted", review: "proposed", path: SRC }, "deny"],
  ["basis accepted, entity proposed, file inside the instance: allowed",
    { basis: "accepted", review: "proposed", path: "<dir>/.konspekt/instance/nodes/task/task-a.md" }, "allow"],
  ["basis accepted, entity proposed, Windows path inside the instance: allowed",
    { basis: "accepted", review: "proposed", path: "C:\\Users\\dev\\repo\\.konspekt\\instance\\edges\\edges.md" }, "allow"],
  ["basis accepted, entity proposed, Windows path outside the instance: denied",
    { basis: "accepted", review: "proposed", path: "C:\\Users\\dev\\repo\\lib\\a.mjs" }, "deny"],
  ["basis accepted, entity accepted: allowed", { basis: "accepted", review: "accepted", path: SRC }, "allow"],
  ["basis accepted, entity rejected: denied", { basis: "accepted", review: "rejected", path: SRC }, "deny"],
  ["basis accepted, marker names no entity of the instance: denied",
    { basis: "accepted", review: "accepted", marker: "task-missing", path: SRC }, "deny"],
  ["basis accepted, payload without a file path: allowed", { basis: "accepted", review: "proposed" }, "allow"],
  ["a tool that does not edit files: allowed", { basis: "accepted", review: "proposed", tool: "Bash", path: SRC }, "allow"],
];

const failures = [];
for (const [name, opts, want] of CASES) {
  const got = run(opts);
  const ok = got === want;
  if (!ok) failures.push(`${name}: wanted ${want}, got ${got}`);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
}
if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
console.log(`\n${CASES.length} case(s) passed.`);
