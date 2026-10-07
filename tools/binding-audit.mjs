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
// Acceptance before work (spec/architecture/REVIEW.md § Acceptance before work):
// when the instance sets `basis: accepted`, a second check runs over the same
// commits. For each bound commit it reads the transition log and requires that
// every entity the commit is bound to was `accepted` at the commit's author
// time. A commit bound to an entity that was proposed at that time is reported
// and fails the audit. The start of this check is the "basisBaseline" field of
// .konspekt/binding-audit.json when present, otherwise the binding baseline, so
// an instance can adopt `basis: accepted` without failing on earlier commits.
//
// Usage:
//   node tools/binding-audit.mjs [--since <ref>] [--head <ref>]
//                                [--basis proposed|accepted] [--basis-since <ref>]
//   --basis        overrides the `basis` field of project.md for this run
//   --basis-since  overrides "basisBaseline"
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
const PROJECT_FILE = join(REPO_ROOT, ".konspekt", "instance", "project.md");
const TRANSITION_LOG = join(REPO_ROOT, ".konspekt", "instance", "transitions", "transitions.md");
const INSTANCE_PREFIX = ".konspekt/instance/";

function git(args) { return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }); }
function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; }

// ----- baseline + allowlist -----
let baseline = arg("--since") || process.env.KONSPEKT_AUDIT_SINCE || null;
const allow = new Set();
let basisBaseline = arg("--basis-since") || null;
if (existsSync(CONFIG)) {
  const cfg = JSON.parse(readFileSync(CONFIG, "utf8"));
  if (!baseline) baseline = cfg.baseline || null;
  if (!basisBaseline) basisBaseline = cfg.basisBaseline || null;
  for (const c of cfg.allow || []) allow.add(c);
}
if (!baseline) {
  console.error("binding-audit: no baseline. Set --since <ref>, $KONSPEKT_AUDIT_SINCE, or the \"baseline\" field of .konspekt/binding-audit.json.");
  process.exit(2);
}
const head = arg("--head") || "HEAD";

// ----- commit tokens the changed-code log binds -----
const boundCommits = new Set();
const boundEntities = new Map(); // commit token -> Set of entity ids bound to it
if (existsSync(CHANGED_LOG)) {
  for (const line of readFileSync(CHANGED_LOG, "utf8").split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 3 || cells[0] === "entity" || /^-+$/.test(cells[0])) continue;
    if (cells[1]) {
      boundCommits.add(cells[1]);
      if (!boundEntities.has(cells[1])) boundEntities.set(cells[1], new Set());
      boundEntities.get(cells[1]).add(cells[0]);
    }
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

// ----- acceptance before work -----
let basis = arg("--basis");
if (!basis && existsSync(PROJECT_FILE)) {
  const m = readFileSync(PROJECT_FILE, "utf8").match(/^basis:[ \t]*([A-Za-z]+)[ \t]*$/m);
  basis = m ? m[1] : null;
}
if (basis === "accepted") {
  if (!existsSync(TRANSITION_LOG)) {
    console.error("binding-audit: basis is accepted but the instance has no transitions/transitions.md, so the order of acceptance and binding cannot be audited.");
    process.exit(1);
  }
  // Review history per entity id, in file order: [{ ms, to }].
  const history = new Map();
  for (const line of readFileSync(TRANSITION_LOG, "utf8").split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((s) => s.trim());
    if (cells.length < 5 || cells[0] === "ref" || /^-+$/.test(cells[0])) continue;
    const [ref, field, , to, timestamp] = cells;
    if (field !== "review" || ref.startsWith("edge:")) continue;
    const id = ref.slice(ref.indexOf(":") + 1);
    if (!history.has(id)) history.set(id, []);
    history.get(id).push({ ms: Date.parse(timestamp), to });
  }
  const reviewAt = (id, ms) => {
    let state = null;
    for (const h of history.get(id) || []) if (!Number.isNaN(h.ms) && h.ms <= ms) state = h.to;
    return state;
  };
  const from = basisBaseline || baseline;
  const short = (r) => (/^[0-9a-f]{40}$/.test(r) ? r.slice(0, 10) : r);
  let list;
  try { list = git(["rev-list", "--no-merges", `${from}..${head}`]).trim(); }
  catch {
    console.error(`binding-audit: cannot list ${from}..${head} for the acceptance-before-work check.`);
    process.exit(2);
  }
  const early = [];
  for (const sha of list ? list.split("\n") : []) {
    if (isAllowed(sha)) continue;
    const entities = new Set();
    for (const [token, ids] of boundEntities) {
      if (token && (sha.startsWith(token) || token.startsWith(sha))) for (const id of ids) entities.add(id);
    }
    if (!entities.size) continue;
    const when = git(["log", "-1", "--format=%aI", sha]).trim();
    const ms = Date.parse(when);
    for (const id of entities) {
      const state = reviewAt(id, ms);
      if (state !== "accepted") early.push({ sha: sha.slice(0, 10), id, when, state: state || "not recorded" });
    }
  }
  if (early.length) {
    console.error(`binding-audit: ${early.length} binding(s) since ${short(from)} to an entity that was not accepted when the commit was authored:`);
    for (const e of early) console.error(`  ${e.sha}  ${e.id}  review was ${e.state} at ${e.when}`);
    console.error(`\nUnder basis: accepted, an acceptor accepts an entity before work is bound to it (spec/architecture/REVIEW.md).`);
    process.exit(1);
  }
  console.log(`binding-audit: clean — every bound commit since ${short(from)} was authored after its entity was accepted.`);
}
