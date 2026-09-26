#!/usr/bin/env node
// konspekt binding audit — detect unbound work
//
// `binding: required` (spec/architecture/BINDING.md) requires every conversation
// to resolve to an entity. Completeness is enforced at extraction; nothing else
// detects a lapse, because lib/validate.mjs sees only files that exist and an
// uncaptured conversation produces none (nw-binding-enforcement-gap). This tool
// gives that requirement a detection surface at the commit boundary: every
// non-bookkeeping commit since the baseline must be bound — referenced by a row
// in the engineer layer's changed-code log (changes/changed.md, "| entity |
// commit | file |"). A commit that changed surfaces outside .konspekt/instance/
// but binds to no entity is unbound work.
//
// Detection, not a persist gate: it reports after the fact and never blocks a
// save (BINDING.md; task-binding-gap-audit).
//
// Bookkeeping (skipped): a commit whose files are all under .konspekt/instance/
// (the portable instance and its logs). Everything else is product/standard work
// that must bind. Merge commits are skipped; the merged branch commits carry the
// binding. This assumes a merge-commit workflow, not squash-merge.
//
// Usage:
//   node tools/binding-audit.mjs [--since <ref>] [--head <ref>]
// Baseline resolution: --since, else $KONSPEKT_AUDIT_SINCE, else the "baseline"
// field of .konspekt/binding-audit.json. Commits at or before the baseline are
// the pre-enforcement backlog and are not audited.

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = join(REPO_ROOT, ".konspekt", "binding-audit.json");
const CHANGED_LOG = join(REPO_ROOT, ".konspekt", "instance", "changes", "changed.md");
const INSTANCE_PREFIX = ".konspekt/instance/";

function git(args) { return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }); }
function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; }

// ----- baseline + allowlist -----
let baseline = arg("--since") || process.env.KONSPEKT_AUDIT_SINCE || null;
const allow = new Set();
if (existsSync(CONFIG)) {
  const cfg = JSON.parse(readFileSync(CONFIG, "utf8"));
  if (!baseline) baseline = cfg.baseline || null;
  for (const c of cfg.allow || []) allow.add(c);
}
if (!baseline) {
  console.error("binding-audit: no baseline. Set --since <ref>, $KONSPEKT_AUDIT_SINCE, or the \"baseline\" field of .konspekt/binding-audit.json.");
  process.exit(2);
}
const head = arg("--head") || "HEAD";

// ----- commit tokens the changed-code log binds -----
const boundCommits = new Set();
if (existsSync(CHANGED_LOG)) {
  for (const line of readFileSync(CHANGED_LOG, "utf8").split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 3 || cells[0] === "entity" || /^-+$/.test(cells[0])) continue;
    if (cells[1]) boundCommits.add(cells[1]);
  }
}
const isBound = (sha) =>
  boundCommits.has(sha) || [...boundCommits].some((c) => c && (sha.startsWith(c) || c.startsWith(sha)));
const isAllowed = (sha) => allow.has(sha) || [...allow].some((a) => a && sha.startsWith(a));

// ----- walk baseline..head -----
let out;
try { out = git(["rev-list", "--no-merges", `${baseline}..${head}`]).trim(); }
catch {
  console.error(`binding-audit: cannot list ${baseline}..${head}. Needs full history — in CI use actions/checkout with fetch-depth: 0.`);
  process.exit(2);
}
const commits = out ? out.split("\n") : [];

const unbound = [];
for (const sha of commits) {
  if (isAllowed(sha)) continue;
  const files = git(["diff-tree", "--no-commit-id", "--name-only", "-r", sha]).split("\n").map((s) => s.trim()).filter(Boolean);
  if (!files.length) continue;
  const touchesProduct = files.some((f) => !f.startsWith(INSTANCE_PREFIX));
  if (!touchesProduct) continue; // bookkeeping: instance-only
  if (!isBound(sha)) {
    const subject = git(["log", "-1", "--format=%s", sha]).trim();
    unbound.push({ sha: sha.slice(0, 10), subject });
  }
}

if (unbound.length) {
  console.error(`binding-audit: ${unbound.length} unbound commit(s) since ${baseline.slice(0, 10)} — changed surfaces outside the instance, bound to no entity:`);
  for (const u of unbound) console.error(`  ${u.sha}  ${u.subject}`);
  console.error(`\nUnder binding: required, bind each to an entity: add a "| <entity-id> | <commit> | <file> |" row to`);
  console.error(`.konspekt/instance/changes/changed.md (spec/architecture/BINDING.md). If a commit is genuinely exempt, list its SHA in .konspekt/binding-audit.json "allow".`);
  process.exit(1);
}
console.log(`binding-audit: clean — every non-bookkeeping commit since ${baseline.slice(0, 10)} is bound to an entity.`);
