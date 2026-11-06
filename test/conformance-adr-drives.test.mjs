#!/usr/bin/env node
// Conformance test for the engineer persona's inbound-drives rule.
//
// An ADR's context is its inbound `drives` edges from ASRs
// (spec/personas/engineer/SPEC.md § ADR). The checker reports an ADR that no
// ASR drives — an error (`subtype-missing-inbound-proposed`) when the ADR is
// proposed, a warning (`subtype-missing-inbound`) when accepted — except a
// rejected ADR or one that is the `to` of a supersedes edge. Each case builds a minimal
// instance with one ASR and one ADR and asserts the codes it yields.
//
// Run:  node test/conformance-adr-drives.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const { loadInstance } = await import(pathToFileURL(join(HERE, "..", "lib", "conformance.mjs")));
const engineer = (await import(pathToFileURL(join(HERE, "..", "spec", "personas", "engineer", "registry.mjs")))).default;

const TS = "2026-01-01T00:00:00Z";
const entity = (fields, body) => "```yaml\n" + fields + "\n```\n" + body + "\n";
const base = (id, review = "accepted") =>
  `id: ${id}\nreview: ${review}\nprovenance:\n  conversationId: t\n  timestamp: ${TS}\n` +
  `createdAt: ${TS}\nupdatedAt: ${TS}`;

// rows: edge rows beyond the fixed `marks` edges that keep every entity referenced.
function build({ rows = [], adrReview = "accepted", extraAdr = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "konspekt-adr-drives-"));
  for (const d of ["nodes/task", "concepts", "waypoints", "edges"]) mkdirSync(join(dir, d), { recursive: true });
  writeFileSync(join(dir, "project.md"),
    entity(`id: project-t\ngoal: test\npersonas: [engineer]\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# t"));
  writeFileSync(join(dir, "nodes/task/task-a.md"),
    entity(`${base("task-a")}\ntype: task\ntitle: A\nstatus: open`, "# Task: A"));
  writeFileSync(join(dir, "concepts/concept-asr-a.md"),
    entity(`${base("concept-asr-a")}\nsubtype: asr`, "# ASR a"));
  writeFileSync(join(dir, "waypoints/wp-adr-a.md"),
    entity(`${base("wp-adr-a", adrReview)}\nkind: decision\nsubtype: adr\ntimestamp: ${TS}`, "# ADR a"));
  const fixed = [
    "| e-mrk-adra | marks | waypoint:wp-adr-a | node:task-a |  |  |",
    "| e-rel-asra | relates | concept:concept-asr-a | node:task-a | 0.5 |  |",
  ];
  if (extraAdr) {
    writeFileSync(join(dir, "waypoints/wp-adr-b.md"),
      entity(`${base("wp-adr-b")}\nkind: decision\nsubtype: adr\ntimestamp: ${TS}`, "# ADR b"));
    fixed.push("| e-mrk-adrb | marks | waypoint:wp-adr-b | node:task-a |  |  |");
  }
  writeFileSync(join(dir, "edges/edges.md"),
    entity(`provenance:\n  conversationId: t\n  timestamp: ${TS}\nreview: accepted`,
      "| id | kind | from | to | weight | review |\n|----|------|------|----|--------|--------|\n" +
      [...fixed, ...rows].join("\n")));
  return dir;
}

const codesFor = (opts) => {
  const dir = build(opts);
  try {
    const r = loadInstance(dir, { personas: [engineer], checkSources: false });
    return r.problems.filter((p) => p.code.startsWith("subtype-missing-inbound"))
      .map((p) => `${p.severity}:${p.code}:${p.ref}`).sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const DRIVES = "| e-drv-a | drives | concept:concept-asr-a | waypoint:wp-adr-a |  |  |";
const MISSING_A = ["warning:subtype-missing-inbound:wp-adr-a"];

const CASES = [
  ["an ADR an ASR drives passes", { rows: [DRIVES] }, []],
  ["an ADR with no drives edge warns", {}, MISSING_A],
  ["a proposed drives edge satisfies the rule", { rows: [DRIVES.replace("|  |  |", "|  | proposed |")] }, []],
  ["a rejected drives edge does not", { rows: [DRIVES.replace("|  |  |", "|  | rejected |")] }, MISSING_A],
  ["a rejected ADR is exempt", { adrReview: "rejected" }, []],
  ["a proposed ADR with no drives edge is an error", { adrReview: "proposed" },
    ["error:subtype-missing-inbound-proposed:wp-adr-a"]],
  ["a proposed ADR with a drives edge passes", { adrReview: "proposed", rows: [DRIVES] }, []],
  ["a superseded ADR is exempt",
    { extraAdr: true, rows: ["| e-sup-ba | supersedes | waypoint:wp-adr-b | waypoint:wp-adr-a |  |  |"] },
    ["warning:subtype-missing-inbound:wp-adr-b"]],
];

let failed = 0;
for (const [name, opts, want] of CASES) {
  const got = codesFor(opts);
  const ok = JSON.stringify(got) === JSON.stringify(want.slice().sort());
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `\n     want ${JSON.stringify(want)}\n     got  ${JSON.stringify(got)}`}`);
}

// Without the engineer persona the rule does not apply.
{
  const dir = build({});
  try {
    const r = loadInstance(dir, { checkSources: false });
    const n = r.problems.filter((p) => p.code.startsWith("subtype-missing-inbound")).length;
    const ok = n === 0;
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"} no engineer persona, no inbound rule`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
