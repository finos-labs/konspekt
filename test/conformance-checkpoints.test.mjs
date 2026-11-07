#!/usr/bin/env node
// Conformance test for the checkpoint log (task-session-checkpoint).
//
// Builds a minimal instance in a temporary directory, then checks the rules
// SERIALIZATION.md § Checkpoints states: the entity resolves, the source excerpt
// exists and hashes to its name, timestamps parse and do not decrease, and, when
// principals are declared, `by` names a human principal. Each case writes one
// checkpoints/checkpoints.md variant and asserts the problem codes it yields.
//
// Run:  node test/conformance-checkpoints.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const { loadInstance, gitBlobSha } = await import(pathToFileURL(join(HERE, "..", "lib", "conformance.mjs")));

const TS = "2026-01-01T00:00:00Z";
const entity = (fields, body) => "```yaml\n" + fields + "\n```\n" + body + "\n";
const EXCERPT = "# Source excerpt — checkpoint\n\n**User:**\n\ncheckpoint\n";
const SHA = gitBlobSha(Buffer.from(EXCERPT));

const HEADER = "| timestamp | entity | source | venue | model | by |\n|-----------|--------|--------|-------|-------|----|\n";
const row = (...cells) => `| ${cells.join(" | ")} |\n`;
const GOOD = [
  ["2026-01-02T00:00:00Z", "task-a", SHA, "claude-mobile", "claude-opus-5-5", "alice"],
  ["2026-01-03T00:00:00Z", "task-a", SHA, "claude-code-cli", "", "alice"],
];

function build(rows, { principals = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "konspekt-checkpoints-"));
  for (const d of ["nodes/task", "edges", "sources"]) mkdirSync(join(dir, d), { recursive: true });
  writeFileSync(join(dir, "project.md"),
    entity(`id: project-t\ngoal: test\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# t"));
  writeFileSync(join(dir, "nodes/task/task-a.md"),
    entity(`id: task-a\ntype: task\ntitle: A\nstatus: open\nreview: proposed\nprovenance:\n  conversationId: t\n` +
      `  timestamp: ${TS}\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# Task: A"));
  writeFileSync(join(dir, "edges/edges.md"),
    entity(`provenance:\n  conversationId: t\n  timestamp: ${TS}\nreview: accepted`,
      "| id | kind | from | to | weight | review |\n|----|------|------|----|--------|--------|"));
  writeFileSync(join(dir, `sources/${SHA}.md`), EXCERPT);
  if (principals) {
    mkdirSync(join(dir, "authority"));
    writeFileSync(join(dir, "authority/principals.md"),
      "# Principals\n\n| id | kind | roles | key |\n|----|------|-------|-----|\n" +
      "| alice | human | grantor |  |\n| bot | agent |  |  |\n");
    writeFileSync(join(dir, "authority/grants.md"),
      "# Grants\n\n| scope | acceptor | action | grantor | timestamp | source |\n" +
      "|-------|----------|--------|---------|-----------|--------|\n" +
      `| * | alice | grant | alice | ${TS} |  |\n`);
  }
  if (rows) {
    mkdirSync(join(dir, "checkpoints"));
    writeFileSync(join(dir, "checkpoints/checkpoints.md"),
      "# Checkpoints\n\n" + HEADER + rows.map((r) => row(...r)).join(""));
  }
  return dir;
}

const codesFor = (rows, opts) => {
  const dir = build(rows, opts);
  try {
    const r = loadInstance(dir, {});
    return { codes: r.problems.filter((p) => p.code.includes("checkpoint") || p.code === "dangling-source" ||
        p.code === "content-hash-mismatch")
      .map((p) => `${p.severity}:${p.code}`).sort(), count: r.meta.counts.checkpoints };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const replaced = (i, r) => GOOD.map((g, ix) => (ix === i ? r : g));

const CASES = [
  ["no log is conformant", null, []],
  ["a complete log passes", GOOD, []],
  ["a proposed entity is a legal checkpoint entity", [GOOD[0]], []],
  ["entity that resolves to nothing",
    replaced(1, ["2026-01-03T00:00:00Z", "task-gone", SHA, "", "", "alice"]), ["error:dangling-checkpoint"]],
  ["empty entity",
    replaced(1, ["2026-01-03T00:00:00Z", "", SHA, "", "", "alice"]), ["error:checkpoint-incomplete"]],
  ["source that is not in sources/",
    replaced(1, ["2026-01-03T00:00:00Z", "task-a", "0".repeat(40), "", "", "alice"]), ["error:dangling-source"]],
  ["empty source",
    replaced(1, ["2026-01-03T00:00:00Z", "task-a", "", "", "", "alice"]), ["error:checkpoint-incomplete"]],
  ["unparseable timestamp",
    replaced(1, ["tomorrow", "task-a", SHA, "", "", "alice"]), ["error:checkpoint-incomplete"]],
  ["row timestamped before the row it follows",
    replaced(1, ["2025-12-31T00:00:00Z", "task-a", SHA, "", "", "alice"]), ["error:checkpoint-out-of-order"]],
  ["missing by when principals are declared",
    replaced(1, ["2026-01-03T00:00:00Z", "task-a", SHA, "", "", ""]), ["error:checkpoint-incomplete"]],
  ["by names an undeclared principal",
    replaced(1, ["2026-01-03T00:00:00Z", "task-a", SHA, "", "", "mallory"]), ["error:checkpoint-unknown-principal"]],
  ["by names an agent principal",
    replaced(1, ["2026-01-03T00:00:00Z", "task-a", SHA, "", "", "bot"]), ["error:checkpoint-not-human"]],
];

const failures = [];
for (const [name, rows, want] of CASES) {
  const { codes, count } = codesFor(rows);
  const ok = JSON.stringify(codes) === JSON.stringify(want.slice().sort());
  if (!ok) failures.push(`${name}: wanted [${want}] got [${codes}]`);
  if (count !== (rows ? rows.length : 0)) failures.push(`${name}: counted ${count} rows, wrote ${rows ? rows.length : 0}`);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
}

// Without declared principals, `by` is optional.
{
  const { codes } = codesFor(GOOD.map((r) => [...r.slice(0, 5), ""]), { principals: false });
  const ok = codes.length === 0;
  if (!ok) failures.push(`by optional without principals: got [${codes}]`);
  console.log(`${ok ? "ok  " : "FAIL"}  by is optional when no principals are declared`);
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
console.log(`\n${CASES.length + 1} case(s) passed.`);
