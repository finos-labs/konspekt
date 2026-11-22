#!/usr/bin/env node
// konspekt review units — link bound commits to the review units that contain them
//
// The engineer layer's changed-code log (changes/changed.md) binds each commit to
// an entity. This tool asks the forge which review units (on GitHub, pull
// requests) contain those commits and writes changes/review-units.md,
// `| review unit | state | merge commit | commit | timestamp | landed | match |`,
// one row per (review unit, commit). Entity -> review units is then a join
// through the changed-code log (spec/personas/engineer/SPEC.md § Review units;
// task-review-unit-log, nw-task-pr-map-derivable).
//
// The rows are derived from the forge's record, never typed: a hand-kept map
// drifts. The file is rewritten whole on each run, so a unit that moves from
// open to merged or closed gets its row updated. Every review unit counts —
// opened by a human, an agent, or a bot — once it contains a bound commit; a
// commit in stacked units gets one row per unit.
//
// Direct commits (nw-direct-commits-recorded). A bound commit on the default
// branch that no unit contains gets one `state: direct` row, with an empty review
// unit and merge commit and the commit's committer time. A bound commit with no
// row is therefore not on the default branch yet, or not derived yet.
//
// Landed commits (nw-landed-commit-recorded). `landed` is the default-branch
// commit that carries the bound commit's change, and `match` says how it was
// found: `same` (the commit itself is on the default branch: a merge-commit merge,
// or a direct row), `squash` (the unit's merge commit squashed its commits),
// `patch-id` (a commit the rebase put on the default branch has the same
// `git patch-id --stable`), or `position` (no patch-id matched, as after a
// conflict resolved in the rebase; the rebased commit at the same position in the
// unit). Open and closed units have no landed commit. tools/binding-audit.mjs
// counts a landed commit as bound.
//
// The core checker stays forge-neutral; only this tool talks to a forge. The
// GitHub adapter uses the `gh` CLI; the default branch's history and patch-ids
// are read with `git`, so the clone must hold that branch in full, and the tool
// fetches refs/pull/<n>/head when a merged unit's original commits are missing.
// Precondition: commits are bound in the changed-code log.
//
// Output is a pure function of the changed-code log, the forge's record, and the
// repository's history: no wall-clock time is written. `timestamp` is the unit's
// merge time, else its close time, else its creation time; on a direct row it is
// the commit's committer time.
//
// Usage (from the repository root):
//   node tools/review-units.mjs                 # rewrite changes/review-units.md
//   node tools/review-units.mjs --check         # exit 1 if the file is stale
//   node tools/review-units.mjs --report        # print entity -> review units
//   options: --repo <owner/name> (default: gh's repository for the cwd)
//            --branch <ref>      (default: origin/<default branch>, else <default branch>)
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
// mainline: Map(sha -> ISO committer time) of every commit on the default branch.
// land(unit, sha): for a merged unit whose commit `sha` is not on the default
//   branch, { landed, match } (match: squash | patch-id | position), or null.
// A changed-log token matches a SHA when the SHA starts with it (tokens may be
// abbreviated); the row keeps the token exactly as the changed-code log has it,
// so the checker can compare strings.
export function buildRows(changed, units, mainline = new Map(), land = () => null) {
  const tokens = [];
  const seen = new Set();
  for (const r of changed) if (!seen.has(r.commit)) { seen.add(r.commit); tokens.push(r.commit); }
  const bySha = new Map(); // sha -> [unit]
  for (const u of units) for (const s of u.commits) {
    if (!bySha.has(s)) bySha.set(s, []);
    bySha.get(s).push(u);
  }
  const shas = [...bySha.keys()];
  const mainShas = [...mainline.keys()];
  const rows = [];
  for (const tok of tokens) {
    const t = tok.toLowerCase();
    const hit = bySha.has(t) ? [t] : shas.filter((s) => s.startsWith(t));
    const pairs = new Map(); // unit url -> { u, sha }
    for (const s of hit) for (const u of bySha.get(s)) if (!pairs.has(u.url)) pairs.set(u.url, { u, sha: s });
    const inUnits = [...pairs.values()].sort((a, b) => a.u.number - b.u.number);
    for (const { u, sha } of inUnits) {
      let l = null;
      if (u.state === "merged") l = mainline.has(sha) ? { landed: sha, match: "same" } : land(u, sha);
      rows.push({
        unit: u.url, state: u.state, mergeCommit: u.mergeCommit || "", commit: tok, timestamp: u.timestamp || "",
        landed: l?.landed || "", match: l?.match || "",
      });
    }
    if (inUnits.length) continue;
    const onMain = mainline.has(t) ? t : mainShas.find((s) => s.startsWith(t));
    if (onMain) {
      rows.push({ unit: "", state: "direct", mergeCommit: "", commit: tok, timestamp: mainline.get(onMain), landed: onMain, match: "same" });
    }
  }
  return rows;
}

// Where a merged unit's commit landed, given what the merge put on the default
// branch. chain: the first-parent commits ending at the merge commit, oldest
// first, as many as the unit has commits (fewer if the branch is shorter).
// pid(sha): `git patch-id --stable`, or "" when unavailable. ctime(sha): committer
// time in seconds. The unit's commits are oldest first (the forge's order).
//
// A rebase merge replays every commit of the unit, and the forge commits each
// one at merge time, so the chain is a rebase when it has one commit per unit
// commit and all of them share the merge commit's committer time (within
// REBASE_WINDOW_S). Otherwise the merge commit is a squash. Patch-ids pick the
// matching rebased commit; with no match, the commit at the same position.
// A one-commit unit lands on the merge commit either way.
export const REBASE_WINDOW_S = 60;
export function landedCommit(unit, sha, chain, pid, ctime) {
  const m = unit.mergeCommit;
  if (!m || !chain.length || chain[chain.length - 1] !== m) return null;
  const n = unit.commits.length;
  if (n === 1) return { landed: m, match: pid(sha) && pid(sha) === pid(m) ? "patch-id" : "squash" };
  const mt = ctime(m);
  const rebased = chain.length === n && chain.every((c) => Math.abs(ctime(c) - mt) <= REBASE_WINDOW_S);
  if (!rebased) return { landed: m, match: "squash" };
  const own = pid(sha);
  const hit = own ? chain.find((c) => pid(c) === own) : null;
  if (hit) return { landed: hit, match: "patch-id" };
  const i = unit.commits.indexOf(sha);
  return i >= 0 ? { landed: chain[i], match: "position" } : null;
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
    "time. A commit on the default branch that no review unit contains has one",
    "`direct` row, with no review unit or merge commit and the commit's committer",
    "time; a commit with no row is not on the default branch yet, or not derived",
    "yet. `landed` is the default-branch commit that carries the change; `match` is",
    "`same`, `squash`, `patch-id`, or `position` (spec/personas/engineer/SPEC.md).",
    "",
    "| review unit | state | merge commit | commit | timestamp | landed | match |",
    "|-------------|-------|--------------|--------|-----------|--------|-------|",
  ];
  return head.concat(rows.map((r) =>
    `| ${r.unit || ""} | ${r.state} | ${r.mergeCommit} | ${r.commit} | ${r.timestamp} | ${r.landed || ""} | ${r.match || ""} |`,
  )).join("\n") + "\n";
}

// entity -> Map(unit -> state), entities in first-bound order, units in order of
// appearance; direct commits are counted under the key "direct".
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
      const m = out.get(entity);
      if (r.state === "direct") m.set("direct", (m.get("direct") || 0) + 1);
      else m.set(r.unit, r.state);
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

// ---------- git adapter ----------

const git = (args, input) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 28, windowsHide: true, input, stdio: ["pipe", "pipe", "pipe"] });
const iso = (sec) => new Date(sec * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");

// Map(sha -> committer time, ISO 8601 UTC to the second) of every commit
// reachable from `ref`.
export function mainlineCommits(ref) {
  const out = new Map();
  for (const line of git(["log", "--format=%H %ct", ref]).split("\n")) {
    const [sha, ct] = line.trim().split(" ");
    if (sha && ct) out.set(sha, iso(Number(ct)));
  }
  return out;
}

// land(unit, sha) for buildRows, reading patch-ids and the first-parent chain
// with git. A merged unit's original commits are fetched from the forge's
// refs/pull/<n>/head when the clone lacks them.
export function gitLander(remote = "origin") {
  const has = (sha) => { try { git(["cat-file", "-e", `${sha}^{commit}`]); return true; } catch { return false; } };
  const fetched = new Set();
  const pids = new Map();
  const pid = (sha) => {
    if (!pids.has(sha)) {
      let p = "";
      try { p = (git(["patch-id", "--stable"], git(["show", "--format=", sha])).trim().split(" ")[0]) || ""; } catch { p = ""; }
      pids.set(sha, p);
    }
    return pids.get(sha);
  };
  const ctime = (sha) => Number(git(["log", "-1", "--format=%ct", sha]).trim());
  const chains = new Map();
  return (unit, sha) => {
    if (!unit.mergeCommit || !has(unit.mergeCommit)) return null;
    if (!fetched.has(unit.number) && unit.commits.some((c) => !has(c))) {
      fetched.add(unit.number);
      try { git(["fetch", "--quiet", remote, `refs/pull/${unit.number}/head`]); }
      catch { console.error(`review-units: could not fetch ${remote} refs/pull/${unit.number}/head; patch-ids unavailable for ${unit.url}`); }
    }
    if (!chains.has(unit.url)) {
      const c = git(["rev-list", "--first-parent", `--max-count=${unit.commits.length}`, unit.mergeCommit]).trim().split("\n").filter(Boolean).reverse();
      chains.set(unit.url, c);
    }
    return landedCommit(unit, sha, chains.get(unit.url), (c) => (has(c) ? pid(c) : ""), ctime);
  };
}

function defaultRef(repo) {
  const name = gh(["repo", "view", repo, "--json", "defaultBranchRef", "-q", ".defaultBranchRef.name"]).trim();
  try { git(["rev-parse", "--verify", "--quiet", `refs/remotes/origin/${name}`]); return `origin/${name}`; }
  catch { return name; }
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
  const branch = opt("--branch") || defaultRef(repo);
  const rows = buildRows(changed, githubUnits(repo), mainlineCommits(branch), gitLander());
  const outPath = join(instanceDir, LOG_FILE);

  if (argv.includes("--report")) {
    for (const [entity, units] of byEntity(changed, rows)) {
      console.log(`${entity}: ${[...units].map(([u, s]) => (u === "direct" ? `${s} direct` : `${u} (${s})`)).join(", ")}`);
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
  const units = new Set(rows.filter((r) => r.unit).map((r) => r.unit)).size;
  const direct = rows.filter((r) => r.state === "direct").length;
  const moved = rows.filter((r) => r.match && r.match !== "same").length;
  console.log(`wrote ${outPath}\n  ${rows.length} rows, ${units} review units, ${direct} direct, ${moved} landed under another SHA; ${repo} (${branch})`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
