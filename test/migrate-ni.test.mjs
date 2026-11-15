#!/usr/bin/env node
// Test for tools/migrate-ni.mjs (task-ni-test-migration, wp-adr-in-place-ni-migration).
//
// Builds a small instance with SHA-1 references in an entity, a transition
// row, a checkpoint row, the executed log and a `command:` edge endpoint, plus
// one entity with no content-addressed provenance. Migrates it and checks that
// nothing is lost (the SHA-1 files stay, the old refs sit under
// provenance.deprecated and in deprecated.md), that the new references verify
// under the conformance checker, and that a second run changes no file.
//
// Run:  node test/migrate-ni.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const { gitBlobSha, niRef, sha256Hex, loadInstance, splitEntityFile } =
  await import(pathToFileURL(join(HERE, "..", "lib", "conformance.mjs")));
const { migrate } = await import(pathToFileURL(join(HERE, "..", "tools", "migrate-ni.mjs")));
const REG = await import(pathToFileURL(join(HERE, "..", "spec", "personas", "engineer", "registry.mjs")));

const failures = [];
const check = (name, ok, detail = "") => {
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
};

const TS = "2026-01-01T00:00:00Z";
const NOW = "2026-02-01T00:00:00Z";
const fence = (fields, body) => "```yaml\n" + fields + "\n```\n" + body + "\n";
const SRC = Buffer.from("# Source excerpt\n\n**User:**\n\nmigrate\n");
const CMD = Buffer.from("node tools/example.mjs\n");
const sha = gitBlobSha(SRC), csha = gitBlobSha(CMD);

const dir = mkdtempSync(join(tmpdir(), "konspekt-migrate-"));
for (const d of ["nodes/task", "edges", "sources", "commands", "transitions", "checkpoints"]) mkdirSync(join(dir, d), { recursive: true });
writeFileSync(join(dir, "project.md"),
  fence(`id: project-t\ngoal: test\npersonas: [engineer]\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# t"));
writeFileSync(join(dir, "nodes/task/task-a.md"),
  fence(`id: task-a\ntype: task\ntitle: A\nstatus: open\nreview: proposed\nprovenance:\n  sourceRef: ${sha}\n  contentHash: ${sha}\n` +
    `  conversationId: t\n  timestamp: ${TS}\n  confidence: 0.5\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# Task: A"));
writeFileSync(join(dir, "nodes/task/task-b.md"),
  fence(`id: task-b\ntype: task\ntitle: B\nstatus: open\nreview: proposed\nprovenance:\n  conversationId: t\n  timestamp: ${TS}\n` +
    `createdAt: ${TS}\nupdatedAt: ${TS}`, "# Task: B"));
writeFileSync(join(dir, "edges/edges.md"),
  fence(`provenance:\n  conversationId: t\n  timestamp: ${TS}\nreview: accepted`,
    "| id | kind | from | to | weight | review |\n|----|------|------|----|--------|--------|\n" +
    "| e-ab | links | node:task-a | node:task-b |  | proposed |\n" +
    `| e-cmd | relates | command:${csha} | node:task-a |  | proposed |`));
writeFileSync(join(dir, `sources/${sha}.md`), SRC);
writeFileSync(join(dir, `commands/${csha}.md`), CMD);
writeFileSync(join(dir, "commands/executed.md"), `# Executed\n\n| entity | command |\n|--------|---------|\n| task-a | ${csha} |\n`);
writeFileSync(join(dir, "transitions/transitions.md"),
  "# Transitions\n\n| ref | field | from | to | timestamp | source | by |\n|-----|-------|------|----|-----------|--------|----|\n" +
  // The blank line inside the table reproduces a stray blank line in an
  // adopter's transitions.md: the rows below it must still be migrated.
  `| node:task-a | review |  | proposed | ${TS} | ${sha} |  |\n\n| node:task-a | status |  | open | ${TS} | ${sha} |  |\n` +
  `| node:task-b | review |  | proposed | ${TS} |  |  |\n| node:task-b | status |  | open | ${TS} |  |  |\n` +
  `| edge:e-ab | review |  | proposed | ${TS} |  |  |\n| edge:e-cmd | review |  | proposed | ${TS} |  |  |\n`);
writeFileSync(join(dir, "checkpoints/checkpoints.md"),
  "# Checkpoints\n\n| timestamp | entity | source | venue | model | by |\n|-----------|--------|--------|-------|-------|----|\n" +
  `| ${TS} | task-a | ${sha} | claude-code-cli |  |  |\n`);

const errorsOf = () => loadInstance(dir, { personas: [REG] }).problems.filter((p) => p.severity === "error");
const snapshot = () => {
  const out = [];
  const walk = (d) => { for (const n of readdirSync(d).sort()) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : out.push([p, readFileSync(p, "utf8")]); } };
  walk(dir);
  return JSON.stringify(out);
};

try {
  check("the unmigrated fixture is conformant", errorsOf().length === 0, JSON.stringify(errorsOf()));
  const r = migrate(dir, { now: NOW });
  check("one source and one command are copied", r.sourcesCopied === 1 && r.commandsCopied === 1, JSON.stringify(r));
  check("one entity is migrated and the unaddressed one is left alone",
    r.entities.migrated === 1 && r.entities.none === 1 && r.entities.unmapped.length === 0, JSON.stringify(r.entities));
  check("transition, checkpoint, executed and edge cells are rewritten",
    r.cells.transitions === 2 && r.cells.checkpoints === 1 && r.cells.executed === 1 && r.cells.edges === 1, JSON.stringify(r.cells));

  const ref = niRef(SRC), cref = niRef(CMD);
  check("the SHA-1 files are kept", existsSync(join(dir, `sources/${sha}.md`)) && existsSync(join(dir, `commands/${csha}.md`)));
  check("the sha-256 copies hold the same bytes",
    readFileSync(join(dir, `sources/sha-256/${sha256Hex(SRC)}.md`)).equals(SRC) &&
    readFileSync(join(dir, `commands/sha-256/${sha256Hex(CMD)}.md`)).equals(CMD));

  const { front } = splitEntityFile(readFileSync(join(dir, "nodes/task/task-a.md"), "utf8"));
  const p = front.provenance;
  check("sourceRef is the ni: reference and contentHash is not stored", p.sourceRef === ref && p.contentHash === undefined);
  check("the old refs are kept under provenance.deprecated",
    p.deprecated && p.deprecated.sourceRef === sha && p.deprecated.contentHash === sha && p.deprecated.migratedAt === NOW);
  check("updatedAt is unchanged", front.updatedAt === TS);
  check("deprecated.md maps each old hash to its new reference",
    readFileSync(join(dir, "sources/deprecated.md"), "utf8").includes(`| ${sha} | ${ref} | ${NOW} |`) &&
    readFileSync(join(dir, "commands/deprecated.md"), "utf8").includes(`| ${csha} | ${cref} | ${NOW} |`));
  check("the edge endpoint is a command:ni: reference",
    readFileSync(join(dir, "edges/edges.md"), "utf8").includes(`| e-cmd | relates | command:${cref} | node:task-a |`));
  check("the migrated instance is conformant", errorsOf().length === 0, JSON.stringify(errorsOf()));

  const before = snapshot();
  const r2 = migrate(dir, { now: "2026-03-01T00:00:00Z" });
  check("a second run changes no file", snapshot() === before);
  check("a second run reports nothing to do",
    r2.sourcesCopied === 0 && r2.deprecatedRows === 0 && r2.entities.migrated === 0 &&
    Object.values(r2.cells).every((n) => n === 0), JSON.stringify(r2));

  // --repo-url writes a git store block and an empty locators.allow.
  const count = (text, re) => (text.match(re) || []).length;
  const pm = join(dir, "project.md");
  migrate(dir, { now: NOW, repoUrl: "https://github.com/example/t", ref: "main" });
  let proj = readFileSync(pm, "utf8");
  check("--repo-url writes one store block and one locators key",
    count(proj, /^store:/gm) === 1 && count(proj, /^locators:/gm) === 1, proj);
  check("the store block is accepted by the checker", errorsOf().length === 0, JSON.stringify(errorsOf()));

  // An instance whose project.md already has locators (setup/init.mjs seeds
  // `locators.allow: []`) keeps its own and gains no second key.
  writeFileSync(pm, fence(`id: project-t\ngoal: test\npersonas: [engineer]\nlocators:\n  allow: [github.com]\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# t"));
  migrate(dir, { now: NOW, repoUrl: "https://github.com/example/t", ref: "main" });
  proj = readFileSync(pm, "utf8");
  check("an existing locators key is kept and not duplicated",
    count(proj, /^store:/gm) === 1 && count(proj, /^locators:/gm) === 1 && proj.includes("allow: [github.com]"), proj);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
