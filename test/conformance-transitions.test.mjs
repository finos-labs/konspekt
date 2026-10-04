#!/usr/bin/env node
// Conformance test for the transition log (task-transition-log).
//
// Builds a minimal instance in a temporary directory, then checks the three
// rules SERIALIZATION.md § Transitions states — birth row required, continuity,
// agreement — plus ref resolution and the no-log case. Each case writes one
// transitions/transitions.md variant and asserts the problem codes it yields.
//
// Run:  node test/conformance-transitions.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const { loadInstance } = await import(pathToFileURL(join(HERE, "..", "lib", "conformance.mjs")));

const TS = "2026-01-01T00:00:00Z";
const entity = (fields, body) => "```yaml\n" + fields + "\n```\n" + body + "\n";
const base = (id) =>
  `id: ${id}\nreview: accepted\nprovenance:\n  conversationId: t\n  timestamp: ${TS}\n` +
  `createdAt: ${TS}\nupdatedAt: ${TS}`;

const HEADER = "| ref | field | from | to | timestamp | source |\n|-----|-------|------|----|-----------|--------|\n";
const row = (...cells) => `| ${cells.join(" | ")} |\n`;

// A conformant log for the fixture: one node (review + status), one noteworthy
// (review only), one edge (review).
const GOOD = [
  ["node:task-a", "review", "", "proposed", "2026-01-01T00:00:00Z", ""],
  ["node:task-a", "status", "", "open", "2026-01-01T00:00:00Z", ""],
  ["noteworthy:nw-a", "review", "", "accepted", "2026-01-01T00:00:00Z", ""],
  ["edge:e-not-a", "review", "", "accepted", "2026-01-01T00:00:00Z", ""],
  ["node:task-a", "review", "proposed", "accepted", "2026-01-02T00:00:00Z", ""],
  ["node:task-a", "status", "open", "resolved", "2026-01-03T00:00:00Z", ""],
];

function build(rows) {
  const dir = mkdtempSync(join(tmpdir(), "konspekt-transitions-"));
  for (const d of ["nodes/task", "noteworthy", "edges", "sources"]) mkdirSync(join(dir, d), { recursive: true });
  writeFileSync(join(dir, "project.md"),
    entity(`id: project-t\ngoal: test\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# t"));
  writeFileSync(join(dir, "nodes/task/task-a.md"),
    entity(`${base("task-a")}\ntype: task\ntitle: A\nstatus: resolved`, "# Task: A"));
  writeFileSync(join(dir, "noteworthy/nw-a.md"), entity(`${base("nw-a")}\nkind: fact`, "# Noteworthy: a"));
  writeFileSync(join(dir, "edges/edges.md"),
    entity(`provenance:\n  conversationId: t\n  timestamp: ${TS}\nreview: accepted`,
      "| id | kind | from | to | weight | review |\n|----|------|------|----|--------|--------|\n" +
      "| e-not-a | notes | node:task-a | noteworthy:nw-a |  |  |"));
  if (rows) {
    mkdirSync(join(dir, "transitions"));
    writeFileSync(join(dir, "transitions/transitions.md"),
      "# Transitions\n\n" + HEADER + rows.map((r) => row(...r)).join(""));
  }
  return dir;
}

const codesFor = (rows) => {
  const dir = build(rows);
  try {
    const r = loadInstance(dir, {});
    return { codes: r.problems.filter((p) => p.code.includes("transition") || p.code === "dangling-source")
      .map((p) => `${p.severity}:${p.code}`).sort(), count: r.meta.counts.transitions };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const without = (i) => GOOD.filter((_, ix) => ix !== i);
const replaced = (i, r) => GOOD.map((g, ix) => (ix === i ? r : g));

const CASES = [
  ["no log is conformant and reported as info", null, ["info:no-transition-log"]],
  ["a complete log passes", GOOD, []],
  ["missing review birth row for an edge", without(3), ["error:transition-missing"]],
  ["missing status birth row for a node", GOOD.filter((r) => r[1] !== "status"), ["error:transition-missing"]],
  ["last row disagrees with current review", without(4), ["error:transition-state-divergence"]],
  ["last row disagrees with current status", without(5), ["error:transition-state-divergence"]],
  ["first row with a non-empty from",
    replaced(2, ["noteworthy:nw-a", "review", "proposed", "accepted", TS, ""]), ["error:transition-chain-break"]],
  ["from does not continue the previous to",
    replaced(4, ["node:task-a", "review", "rejected", "accepted", "2026-01-02T00:00:00Z", ""]),
    ["error:transition-chain-break"]],
  ["ref that resolves to nothing",
    [...GOOD, ["node:task-gone", "review", "", "accepted", TS, ""]], ["error:dangling-transition"]],
  ["ref with the wrong entity type",
    [...GOOD, ["concept:task-a", "review", "", "accepted", TS, ""]], ["error:dangling-transition"]],
  ["status row on an edge",
    [...GOOD, ["edge:e-not-a", "status", "", "open", TS, ""]], ["error:transition-unknown-field"]],
  ["unparseable timestamp",
    replaced(2, ["noteworthy:nw-a", "review", "", "accepted", "yesterday", ""]), ["error:transition-incomplete"]],
  ["row timestamped before the row it follows",
    replaced(4, ["node:task-a", "review", "proposed", "accepted", "2025-12-31T00:00:00Z", ""]),
    ["warning:transition-out-of-order"]],
  ["source that is not in sources/",
    replaced(4, ["node:task-a", "review", "proposed", "accepted", "2026-01-02T00:00:00Z", "0".repeat(40)]),
    ["error:dangling-source"]],
];

const failures = [];
for (const [name, rows, want] of CASES) {
  const { codes, count } = codesFor(rows);
  const ok = JSON.stringify(codes) === JSON.stringify(want.slice().sort());
  if (!ok) failures.push(`${name}: wanted [${want}] got [${codes}]`);
  if (rows && count !== rows.length) failures.push(`${name}: counted ${count} rows, wrote ${rows.length}`);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
console.log(`\n${CASES.length} case(s) passed.`);
