#!/usr/bin/env node
// konspekt review units — link bound commits to the review units that contain them
//
// The engineer layer's changed-code log (changes/changed.md) binds each commit to
// an entity. This tool asks the forge which review units (on GitHub, pull
// requests) contain those commits and writes changes/review-units.md,
// `| review unit | state | merge commit | commit | timestamp |`, one row per
// (review unit, commit). Entity -> review units is then a join through the
// changed-code log (spec/personas/engineer/SPEC.md § Review units;
// task-review-unit-log, nw-task-pr-map-derivable).
//
// The rows are derived from the forge's record, never typed: a hand-kept map
// drifts. The file is rewritten whole on each run, so a unit that moves from
// open to merged or closed gets its row updated. Every review unit counts —
// opened by a human, an agent, or a bot — once it contains a bound commit; a
// commit in stacked units gets one row per unit; a commit made on the default
// branch outside any unit gets no row.
//
// The core checker stays forge-neutral; only this tool talks to a forge. The
// GitHub adapter uses the `gh` CLI. Precondition: commits are bound in the
// changed-code log. The forge lists a unit's own branch commits whether it was
// merged by merge commit or squash, so rows link either way; squash and rebase
// merges are still out of scope, because the changed-code log and
// tools/binding-audit.mjs assume the bound SHAs reach the default branch.
//
// Output is a pure function of the changed-code log and the forge's record: no
// wall-clock time is written. `timestamp` is the unit's merge time, else its
// close time, else its creation time.
//
// Usage (from the repository root):
//   node tools/review-units.mjs                 # rewrite changes/review-units.md
//   node tools/review-units.mjs --check         # exit 1 if the file is stale
//   node tools/review-units.mjs --report        # print entity -> review units
//   options: --repo <owner/name> (default: gh's repository for the cwd)
//            --instance <dir>    (default: .konspekt/instance)

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";

export const LOG_FILE = join("changes", "review-units.md");
const CHANGED_FILE = join("changes", "changed.md");

// ---------- pure parts (tested in test/review-units.test.mjs) ----------

// Rows of the changed-code log, in file order: { entity, commit }.
export function parseChanged(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const c = t.split("|").slice(1, -1).map((x) => x.trim());
    if (c.length < 3 || c[0] === "entity" || /^-+$/.test(c[0]) || !c[1]) continue;
    out.push({ entity: c[0], commit: c[1] });
  }
  return out;
}

// units: [{ url, number, state: open|merged|closed, mergeCommit, timestamp, commits: [sha] }]
// A changed-log token matches a forge SHA when the SHA starts with it (tokens may
// be abbreviated); the row keeps the token exactly as the changed-code log has it,
// so the checker can compare strings.
export function buildRows(changed, units) {
  const tokens = [];
  const seen = new Set();
  for (const r of changed) if (!seen.has(r.commit)) { seen.add(r.commit); tokens.push(r.commit); }
  const bySha = new Map(); // sha -> [unit]
  for (const u of units) for (const s of u.commits) {
    if (!bySha.has(s)) bySha.set(s, []);
    bySha.get(s).push(u);
  }
  const shas = [...bySha.keys()];
  const rows = [];
  for (const tok of tokens) {
    const t = tok.toLowerCase();
    const hit = bySha.get(t) || shas.filter((s) => s.startsWith(t)).flatMap((s) => bySha.get(s));
    const uniq = [...new Map(hit.map((u) => [u.url, u])).values()].sort((a, b) => a.number - b.number);
    for (const u of uniq) {
      rows.push({ unit: u.url, state: u.state, mergeCommit: u.mergeCommit || "", commit: tok, timestamp: u.timestamp || "" });
    }
  }
  return rows;
}

export function renderLog(rows) {
  const head = [
    "# Review units (engineer layer)",
    "",
    "Derived by `node tools/review-units.mjs`; do not edit by hand. Each row links a",
    "commit bound in `changed.md` to a review unit (on GitHub, a pull request) that",
    "contains it, one row per (review unit, commit), in the changed-code log's",
    "commit order. The entity is found through `changed.md`. `state` is open,",
    "merged, or closed; `timestamp` is the unit's merge, else close, else creation",
    "time. A commit made outside any review unit has no row.",
    "",
    "| review unit | state | merge commit | commit | timestamp |",
    "|-------------|-------|--------------|--------|-----------|",
  ];
  return head.concat(rows.map((r) => `| ${r.unit} | ${r.state} | ${r.mergeCommit} | ${r.commit} | ${r.timestamp} |`)).join("\n") + "\n";
}

// entity -> [{ unit, state }], entities in first-bound order, units by number order of appearance.
export function byEntity(changed, rows) {
  const unitsByCommit = new Map();
  for (const r of rows) {
    if (!unitsByCommit.has(r.commit)) unitsByCommit.set(r.commit, []);
    unitsByCommit.get(r.commit).push(r);
  }
  const out = new Map();
  for (const { entity, commit } of changed) {
    for (const r of unitsByCommit.get(commit) || []) {
      if (!out.has(entity)) out.set(entity, new Map());
      out.get(entity).set(r.unit, r.state);
    }
  }
  return out;
}

// ---------- GitHub adapter ----------

const gh = (args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 1 << 28, windowsHide: true });

const Q = `query($owner:String!,$name:String!,$after:String){repository(owner:$owner,name:$name){
pullRequests(first:50,after:$after,orderBy:{field:CREATED_AT,direction:ASC}){pageInfo{hasNextPage endCursor}
nodes{number url state createdAt closedAt mergedAt mergeCommit{oid}
commits(first:100){totalCount nodes{commit{oid}}}}}}}`;

export function githubUnits(repo) {
  const [owner, name] = repo.split("/");
  const units = [];
  let after = null;
  for (;;) {
    const args = ["api", "graphql", "-f", `query=${Q}`, "-F", `owner=${owner}`, "-F", `name=${name}`];
    if (after) args.push("-F", `after=${after}`);
    const page = JSON.parse(gh(args)).data.repository.pullRequests;
    for (const p of page.nodes) {
      let commits = p.commits.nodes.map((n) => n.commit.oid);
      if (p.commits.totalCount > commits.length) {
        commits = gh(["api", `repos/${repo}/pulls/${p.number}/commits`, "--paginate", "-q", ".[].sha"])
          .trim().split(/\s+/).filter(Boolean);
      }
      units.push({
        url: p.url,
        number: p.number,
        state: p.state.toLowerCase(), // OPEN | MERGED | CLOSED
        mergeCommit: p.state === "MERGED" ? (p.mergeCommit?.oid || "") : "",
        timestamp: p.mergedAt || p.closedAt || p.createdAt,
        commits,
      });
    }
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return units;
}

// ---------- CLI ----------

function main(argv) {
  const opt = (k) => { const i = argv.indexOf(k); return i === -1 ? null : argv[i + 1]; };
  const instanceDir = opt("--instance") || join(".konspekt", "instance");
  const repo = opt("--repo") || gh(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]).trim();
  const changedPath = join(instanceDir, CHANGED_FILE);
  if (!existsSync(changedPath)) {
    console.error(`review-units: ${changedPath} not found; nothing to link.`);
    return 1;
  }
  const changed = parseChanged(readFileSync(changedPath, "utf8"));
  const rows = buildRows(changed, githubUnits(repo));
  const outPath = join(instanceDir, LOG_FILE);

  if (argv.includes("--report")) {
    for (const [entity, units] of byEntity(changed, rows)) {
      console.log(`${entity}: ${[...units].map(([u, s]) => `${u} (${s})`).join(", ")}`);
    }
    return 0;
  }
  const text = renderLog(rows);
  if (argv.includes("--check")) {
    const cur = existsSync(outPath) ? readFileSync(outPath, "utf8").replace(/\r\n/g, "\n") : null;
    if (cur === text) { console.log(`review-units --check: ${outPath} is up to date (${rows.length} rows).`); return 0; }
    console.log(`review-units --check: ${outPath} is ${cur === null ? "missing" : "stale"}.\nRegenerate and commit it:  node tools/review-units.mjs`);
    return 1;
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, text);
  const units = new Set(rows.map((r) => r.unit)).size;
  console.log(`wrote ${outPath}\n  ${rows.length} rows, ${units} review units, ${repo}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
