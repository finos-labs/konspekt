#!/usr/bin/env node
// migrate-ni — move a konspekt instance from git-blob-SHA-1 references to RFC
// 6920 `ni:///sha-256` references, in place (docs/design/source-addressing.md,
// wp-adr-in-place-ni-migration).
//
// The migration only adds. For each content-addressed directory (sources/,
// commands/) it copies every `<sha1>.md` file to `sha-256/<hex>.md` and appends
// a `| deprecated | current | migratedAt |` row to that directory's
// `deprecated.md`; the SHA-1 files stay. In each entity file whose
// provenance.sourceRef is a git blob SHA, sourceRef takes the `ni:` reference,
// and the old sourceRef and contentHash move under provenance.deprecated with a
// migratedAt timestamp; updatedAt is unchanged. Table cells that hold a migrated
// SHA-1 (the `source` cells of transitions, checkpoints and grants, the
// executed-log command cells, and `command:` edge endpoints) take the new
// reference. project.md gains `references: ni`, which tells the checker that
// every new reference must be in the ni: form. With --repo-url, project.md also
// gains a git `store` block and an empty `locators.allow`.
//
// The script is idempotent: a second run over a migrated instance changes no
// file. It runs the conformance checker at the end and exits 1 on any error,
// including a SHA-1 reference the migration did not rewrite
// (legacy-ref-in-ni-instance).
//
// Usage:
//   node tools/migrate-ni.mjs [instanceDir] [--repo-url <https://host/owner/repo>]
//                             [--ref <branch>] [--dry-run] [--now <iso8601>]
//
// instanceDir defaults to .konspekt/instance. --ref defaults to main. --now fixes
// migratedAt (for tests); it defaults to the current time.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { gitBlobSha, niRef, sha256Hex, loadInstance } from "../lib/conformance.mjs";
import { loadActivePersonas } from "../lib/load-personas.mjs";

const SHA1 = /^[0-9a-f]{40}$/;
const ENTITY_DIRS = ["nodes", "concepts", "noteworthy", "artifacts", "waypoints"];

// ---------- text helpers (line endings are preserved per file) ----------

function readText(path) {
  const raw = readFileSync(path, "utf8");
  return { crlf: raw.includes("\r\n"), text: raw.replace(/\r\n/g, "\n") };
}
function writeText(path, { crlf, text }, dryRun) {
  if (!dryRun) writeFileSync(path, crlf ? text.replace(/\n/g, "\r\n") : text);
}

// ---------- content-addressed directories ----------

// Copy each <sha1>.md in `dir` to sha-256/<hex>.md. Returns
// { map: Map<sha1, niRef>, copied, mismatched: [file] }. A file whose bytes do
// not hash to its own name is not mapped, so no reference is rewritten to it.
function migrateDir(dir, dryRun) {
  const map = new Map();
  const mismatched = [];
  let copied = 0;
  if (!existsSync(dir)) return { map, copied, mismatched };
  const target = join(dir, "sha-256");
  for (const name of readdirSync(dir).sort()) {
    const m = /^([0-9a-f]{40})\.md$/.exec(name);
    if (!m) continue;
    const bytes = readFileSync(join(dir, name));
    if (gitBlobSha(bytes) !== m[1]) { mismatched.push(name); continue; }
    const dest = join(target, `${sha256Hex(bytes)}.md`);
    if (!existsSync(dest)) {
      if (!dryRun) { mkdirSync(target, { recursive: true }); writeFileSync(dest, bytes); }
      copied++;
    }
    map.set(m[1], niRef(bytes));
  }
  return { map, copied, mismatched };
}

// Append the rows of `map` that deprecated.md does not already hold.
function writeDeprecatedMap(dir, map, now, dryRun) {
  if (map.size === 0) return 0;
  const path = join(dir, "deprecated.md");
  const header =
    "# Deprecated references\n\n" +
    "Maps each git blob SHA-1 reference in this directory to its `ni:///sha-256`\n" +
    "reference (docs/design/source-addressing.md). Append-only; written by\n" +
    "`tools/migrate-ni.mjs`. The SHA-1 files are kept.\n\n" +
    "| deprecated | current | migratedAt |\n|------------|---------|------------|\n";
  const doc = existsSync(path) ? readText(path) : { crlf: false, text: header };
  const have = new Set();
  for (const line of doc.text.split("\n")) {
    const cells = line.trim().startsWith("|") ? line.trim().split("|").slice(1, -1).map((c) => c.trim()) : [];
    if (cells.length >= 2 && SHA1.test(cells[0])) have.add(cells[0]);
  }
  const rows = [...map].filter(([old]) => !have.has(old)).map(([old, cur]) => `| ${old} | ${cur} | ${now} |`);
  if (rows.length === 0) return 0;
  if (!doc.text.endsWith("\n")) doc.text += "\n";
  doc.text += rows.join("\n") + "\n";
  writeText(path, doc, dryRun);
  return rows.length;
}

// ---------- entity files ----------

// Rewrite the provenance block of one entity file's ```yaml fence. Returns
// "migrated", "already", "none" (no SHA-1 sourceRef), or "unmapped".
function migrateEntity(path, sourcesMap, now, dryRun) {
  const doc = readText(path);
  const lines = doc.text.split("\n");
  if (!/^```ya?ml$/.test(lines[0] || "")) return "none";
  const close = lines.indexOf("```", 1);
  if (close < 0) return "none";
  const start = lines.findIndex((l, i) => i > 0 && i < close && l === "provenance:");
  if (start < 0) return "none";
  let end = start + 1;
  while (end < close && /^\s/.test(lines[end])) end++;
  const block = lines.slice(start + 1, end);
  const refIx = block.findIndex((l) => /^  sourceRef:/.test(l));
  if (refIx < 0) return "none";
  const ref = block[refIx].replace(/^  sourceRef:\s*/, "").trim();
  if (ref.startsWith("ni:")) return "already";
  if (!SHA1.test(ref)) return "none";
  const cur = sourcesMap.get(ref);
  if (!cur) return "unmapped";
  const hashIx = block.findIndex((l) => /^  contentHash:/.test(l));
  const oldHash = hashIx >= 0 ? block[hashIx].replace(/^  contentHash:\s*/, "").trim() : null;
  const kept = block.filter((_, i) => i !== hashIx);
  const keptRefIx = kept.findIndex((l) => /^  sourceRef:/.test(l));
  kept[keptRefIx] = `  sourceRef: ${cur}`;
  const dep = ["  deprecated:", `    migratedAt: ${now}`, `    sourceRef: ${ref}`];
  if (oldHash) dep.push(`    contentHash: ${oldHash}`);
  const out = [...lines.slice(0, start + 1), ...kept, ...dep, ...lines.slice(end)];
  doc.text = out.join("\n");
  writeText(path, doc, dryRun);
  return "migrated";
}

function* entityFiles(instanceDir) {
  for (const d of ENTITY_DIRS) {
    const root = join(instanceDir, d);
    if (!existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop();
      for (const name of readdirSync(dir).sort()) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) stack.push(p);
        else if (name.endsWith(".md")) yield p;
      }
    }
  }
}

// ---------- table cells ----------

// Rewrite the cells of the named columns in every table of `path`. `rewrite`
// maps a trimmed cell value to its replacement, or returns null to keep it.
// Only the cell's own text changes; surrounding spacing is kept.
function migrateTable(path, columns, rewrite, dryRun) {
  if (!existsSync(path)) return 0;
  const doc = readText(path);
  // A header is the row directly above a separator row (`|---|---|`). It holds
  // until the next header, across blank and other non-table lines: the checker
  // reads every `|` line of these files as a row, so a stray blank line inside
  // a table must not end it here either. Resetting at a blank line made the
  // next data row a "header" and skipped every row below it.
  const lines = doc.text.split("\n");
  const cellsOf = (line) => line.split("|").slice(1, -1).map((c) => c.trim());
  const isRow = (line) => (line || "").trim().startsWith("|");
  const isSeparator = (line) => isRow(line) && cellsOf(line).every((c) => /^:?-+:?$/.test(c));
  let header = null;
  let changed = 0;
  const out = lines.map((line, i) => {
    if (!isRow(line)) return line;
    if (isSeparator(line)) return line;
    const segs = line.split("|");
    const cells = segs.slice(1, -1).map((c) => c.trim());
    if (isSeparator(lines[i + 1])) { header = cells; return line; }
    if (!header) return line;
    let touched = false;
    for (const col of columns) {
      const ix = header.indexOf(col);
      if (ix < 0) continue;
      const next = rewrite(cells[ix]);
      if (next == null || next === cells[ix]) continue;
      segs[ix + 1] = segs[ix + 1].replace(cells[ix], () => next);
      touched = true;
    }
    if (touched) changed++;
    return touched ? segs.join("|") : line;
  });
  if (changed) { doc.text = out.join("\n"); writeText(path, doc, dryRun); }
  return changed;
}

// ---------- project.md ----------

// Writes `references: ni` when absent, and with --repo-url a git `store` block
// when absent. Returns the list of keys written, empty when none.
function migrateProject(instanceDir, repoUrl, ref, dryRun) {
  const path = join(instanceDir, "project.md");
  if (!existsSync(path)) return [];
  const doc = readText(path);
  const block = [];
  const written = [];
  if (!/^references:/m.test(doc.text)) { block.push("references: ni"); written.push("references"); }
  if (repoUrl && !/^store:/m.test(doc.text)) {
    let instPath = ".konspekt/instance";
    try {
      const top = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: instanceDir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      instPath = relative(top, resolve(instanceDir)).split("\\").join("/");
    } catch { /* not a git checkout: keep the default path */ }
    const base = `${repoUrl.replace(/\/+$/, "")}/blob/{ref}/${instPath}`;
    block.push(
      "store:",
      "  kind: git",
      `  ref: ${ref}`,
      "  resolve:",
      `    source: ${base}/sources/sha-256/{hex}.md`,
      `    command: ${base}/commands/sha-256/{hex}.md`,
      `    entity: ${base}/{path}`,
      `    edges: ${base}/edges/edges.md`,
      `    checkpoints: ${base}/checkpoints/checkpoints.md`,
    );
    written.push("store");
    // setup/init.mjs seeds `locators.allow: []` in new instances; an existing
    // `locators:` key is the adopter's, so it is kept and not written twice.
    if (!/^locators:/m.test(doc.text)) block.push("locators:", "  allow: []");
  }
  if (!block.length) return [];
  const lines = doc.text.split("\n");
  const close = lines.indexOf("```", 1);
  if (!/^```ya?ml$/.test(lines[0] || "") || close < 0) return [];
  // Insert before createdAt so the timestamps stay last in the fence.
  let at = lines.findIndex((l, i) => i > 0 && i < close && /^createdAt:/.test(l));
  if (at < 0) at = close;
  lines.splice(at, 0, ...block);
  doc.text = lines.join("\n");
  writeText(path, doc, dryRun);
  return written;
}

// ---------- main ----------

export function migrate(instanceDir, { repoUrl = null, ref = "main", dryRun = false, now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z") } = {}) {
  const sources = migrateDir(join(instanceDir, "sources"), dryRun);
  const commands = migrateDir(join(instanceDir, "commands"), dryRun);
  const report = {
    sourcesCopied: sources.copied, commandsCopied: commands.copied,
    mismatched: [...sources.mismatched.map((f) => `sources/${f}`), ...commands.mismatched.map((f) => `commands/${f}`)],
    deprecatedRows: 0, entities: { migrated: 0, already: 0, none: 0, unmapped: [] }, cells: {}, project: [],
  };
  report.deprecatedRows += writeDeprecatedMap(join(instanceDir, "sources"), sources.map, now, dryRun);
  report.deprecatedRows += writeDeprecatedMap(join(instanceDir, "commands"), commands.map, now, dryRun);

  for (const p of entityFiles(instanceDir)) {
    const r = migrateEntity(p, sources.map, now, dryRun);
    if (r === "unmapped") report.entities.unmapped.push(relative(instanceDir, p).split("\\").join("/"));
    else report.entities[r]++;
  }

  const src = (v) => (SHA1.test(v) ? sources.map.get(v) ?? null : null);
  const cmd = (v) => (SHA1.test(v) ? commands.map.get(v) ?? null : null);
  const cmdEnd = (v) => {
    const m = /^command:([0-9a-f]{40})$/.exec(v);
    const cur = m ? commands.map.get(m[1]) : null;
    return cur ? `command:${cur}` : null;
  };
  report.cells.transitions = migrateTable(join(instanceDir, "transitions", "transitions.md"), ["source"], src, dryRun);
  report.cells.checkpoints = migrateTable(join(instanceDir, "checkpoints", "checkpoints.md"), ["source"], src, dryRun);
  report.cells.grants = migrateTable(join(instanceDir, "authority", "grants.md"), ["source"], src, dryRun);
  report.cells.executed = migrateTable(join(instanceDir, "commands", "executed.md"), ["command"], cmd, dryRun);
  report.cells.edges = migrateTable(join(instanceDir, "edges", "edges.md"), ["from", "to"], cmdEnd, dryRun);
  report.project = migrateProject(instanceDir, repoUrl, ref, dryRun);
  return report;
}

function parseArgs(argv) {
  const out = { instanceDir: ".konspekt/instance", repoUrl: null, ref: "main", dryRun: false, now: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--repo-url") out.repoUrl = argv[++i];
    else if (a === "--ref") out.ref = argv[++i];
    else if (a === "--now") out.now = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--")) throw new Error(`unknown option ${a}`);
    else out.instanceDir = a;
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = parseArgs(process.argv.slice(2));
  const instanceDir = resolve(args.instanceDir);
  const report = migrate(instanceDir, args);
  console.log(`migrate-ni${args.dryRun ? " (dry run)" : ""}: ${instanceDir}`);
  console.log(`  copied: ${report.sourcesCopied} source(s), ${report.commandsCopied} command(s) to sha-256/`);
  console.log(`  deprecated.md rows: ${report.deprecatedRows}`);
  console.log(`  entities: ${report.entities.migrated} migrated, ${report.entities.already} already ni:, ${report.entities.none} without a SHA-1 sourceRef`);
  console.log(`  cells: transitions ${report.cells.transitions}, checkpoints ${report.cells.checkpoints}, grants ${report.cells.grants}, executed ${report.cells.executed}, edges ${report.cells.edges}`);
  console.log(`  project.md: ${report.project.length ? `wrote ${report.project.join(", ")}` : "unchanged"}`);
  let failed = false;
  for (const f of report.mismatched) { console.log(`  NOT MIGRATED (bytes do not hash to the name): ${f}`); failed = true; }
  for (const f of report.entities.unmapped) { console.log(`  NOT MIGRATED (sourceRef names no source file): ${f}`); failed = true; }
  if (!args.dryRun) {
    const specPersonasDir = join(dirname(fileURLToPath(import.meta.url)), "..", "spec", "personas");
    const personas = await loadActivePersonas(instanceDir, specPersonasDir, { warn: (m) => console.error(`warning: ${m}`) });
    const r = loadInstance(instanceDir, { personas });
    const errors = r.problems.filter((p) => p.severity === "error");
    console.log(`  conformance: ${errors.length} error(s), ${r.problems.filter((p) => p.severity === "warning").length} warning(s)`);
    for (const e of errors.slice(0, 20)) console.log(`    ${e.code}: ${e.message}`);
    if (errors.length) failed = true;
    // A SHA-1 reference the checker still finds after the migration is one the
    // script did not rewrite. It is already counted among the errors above;
    // naming it separately says the migration is incomplete.
    const left = r.problems.filter((p) => p.code === "legacy-ref-in-ni-instance");
    if (left.length) {
      console.log(`  NOT MIGRATED: ${left.length} SHA-1 reference(s) remain`);
      for (const w of left.slice(0, 20)) console.log(`    ${w.message}`);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
}
