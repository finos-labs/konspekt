#!/usr/bin/env node
// Tests for the engineer review-unit log (spec/personas/engineer/SPEC.md § Review
// units): the pure derivation in tools/review-units.mjs, and the checker's rules
// for changes/review-units.md in lib/conformance.mjs. No forge is called: the
// derivation is fed fixed units, the shape githubUnits() returns.
//
// Run:  node test/review-units.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const { loadInstance } = await import(pathToFileURL(join(HERE, "..", "lib", "conformance.mjs")));
const engineer = (await import(pathToFileURL(join(HERE, "..", "spec", "personas", "engineer", "registry.mjs")))).default;
const ru = await import(pathToFileURL(join(HERE, "..", "tools", "review-units.mjs")));

let failed = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) console.log(`  ok   ${name}`);
  else { failed++; console.log(`  FAIL ${name}\n       got  ${g}\n       want ${w}`); }
};

// ---------- derivation ----------
const A = "a".repeat(40), B = "b".repeat(40), C = "c".repeat(40), D = "d".repeat(40);
const changedText = [
  "| entity | commit | file | timestamp |",
  "|--------|--------|------|-----------|",
  `| task-x | ${A} | f1 | 2026-01-01T00:00:00Z |`,
  `| task-x | ${A} | f2 | 2026-01-01T00:00:00Z |`,
  `| task-y | ${B.slice(0, 7)} | f3 | 2026-01-02T00:00:00Z |`,
  `| task-y | ${C} | f4 | 2026-01-03T00:00:00Z |`,
  `| task-z | ${D} | f5 | 2026-01-04T00:00:00Z |`,
].join("\n");
const units = [
  { url: "u/2", number: 2, state: "open", mergeCommit: "", timestamp: "2026-01-05T00:00:00Z", commits: [C] },
  { url: "u/1", number: 1, state: "merged", mergeCommit: "m1", timestamp: "2026-01-04T00:00:00Z", commits: [A, B] },
  { url: "u/3", number: 3, state: "merged", mergeCommit: "m3", timestamp: "2026-01-06T00:00:00Z", commits: [B, C] }, // stacked on 1 and 2
  { url: "u/4", number: 4, state: "closed", mergeCommit: "", timestamp: "2026-01-07T00:00:00Z", commits: ["e".repeat(40)] }, // unbound commit
];
const changed = ru.parseChanged(changedText);
const rows = ru.buildRows(changed, units);
eq("one row per (unit, commit), changed-log order, units by number",
  rows.map((r) => `${r.unit}:${r.commit.slice(0, 7)}`),
  ["u/1:aaaaaaa", "u/1:bbbbbbb", "u/3:bbbbbbb", "u/2:ccccccc", "u/3:ccccccc"]);
eq("an abbreviated changed-log token is kept as written", rows[1].commit, B.slice(0, 7));
eq("a commit outside any unit gets no row", rows.some((r) => r.commit === D), false);
eq("a unit with no bound commit gets no row", rows.some((r) => r.unit === "u/4"), false);
eq("state and merge commit are carried", [rows[0].state, rows[0].mergeCommit, rows[3].state, rows[3].mergeCommit],
  ["merged", "m1", "open", ""]);
const proj = ru.byEntity(changed, rows);
eq("entity -> review units projection",
  [...proj].map(([e, u]) => `${e}=${[...u.keys()].join(",")}`),
  ["task-x=u/1", "task-y=u/1,u/3,u/2"]);
eq("rendering is deterministic", ru.renderLog(rows) === ru.renderLog(ru.buildRows(changed, units)), true);

// ---------- REST adapter (task-review-units-rest-fallback) ----------
const pr = (o) => ({ html_url: "https://github.com/o/r/pull/" + o.number, created_at: "2026-01-01T00:00:00Z",
  closed_at: null, merged_at: null, merge_commit_sha: "t".repeat(40), ...o });
eq("REST: a merged pull request maps to the GraphQL unit shape",
  ru.restUnit(pr({ number: 7, state: "closed", closed_at: "2026-01-03T00:00:00Z", merged_at: "2026-01-03T00:00:00Z", merge_commit_sha: "m7" }), [A]),
  { url: "https://github.com/o/r/pull/7", number: 7, state: "merged", mergeCommit: "m7", timestamp: "2026-01-03T00:00:00Z", commits: [A] });
eq("REST: an open pull request has no merge commit and its creation time",
  ru.restUnit(pr({ number: 8, state: "open" }), [B]),
  { url: "https://github.com/o/r/pull/8", number: 8, state: "open", mergeCommit: "", timestamp: "2026-01-01T00:00:00Z", commits: [B] });
eq("REST: a closed unmerged pull request drops its test-merge SHA",
  ru.restUnit(pr({ number: 9, state: "closed", closed_at: "2026-01-02T00:00:00Z" }), [C]),
  { url: "https://github.com/o/r/pull/9", number: 9, state: "closed", mergeCommit: "", timestamp: "2026-01-02T00:00:00Z", commits: [C] });
eq("REST and GraphQL units derive the same rows",
  ru.renderLog(ru.buildRows(changed, [ru.restUnit(pr({ number: 1, state: "closed", merged_at: "2026-01-04T00:00:00Z", closed_at: "2026-01-04T00:00:00Z", merge_commit_sha: "m1", html_url: "u/1" }), [A, B])])),
  ru.renderLog(ru.buildRows(changed, [units[1]])));
eq("repository from remote URLs",
  ["https://github.com/finos-labs/konspekt.git", "https://github.com/finos-labs/konspekt", "git@github.com:finos-labs/konspekt.git",
   "ssh://git@github.com/finos-labs/konspekt.git", "http://127.0.0.1:8080/git/finos-labs/konspekt\n", "konspekt"].map(ru.repoFromRemote),
  ["finos-labs/konspekt", "finos-labs/konspekt", "finos-labs/konspekt", "finos-labs/konspekt", "finos-labs/konspekt", null]);
eq("api modes", ru.API_MODES, ["auto", "graphql", "rest"]);

// ---------- GraphQL failure (task-review-units-graphql-error) ----------
const ghFail = () => { const e = new Error("Command failed: gh api graphql -f query=..."); e.stderr = "GraphQL: Resource not accessible by integration (repository)\nmore"; throw e; };
const restStub = () => [units[0]];
const caught = (fn) => { try { fn(); return null; } catch (e) { return e; } };
const forced = caught(() => ru.githubUnits("o/r", "graphql", () => {}, { graphql: ghFail, rest: restStub }));
eq("forced GraphQL failure throws ForgeError", forced instanceof ru.ForgeError, true);
eq("forced GraphQL failure is one line naming the mode and gh's reason", forced && forced.message,
  "review-units: GitHub GraphQL unavailable (GraphQL: Resource not accessible by integration (repository)); --api graphql forces GraphQL; use --api auto or --api rest.");
const notices = [];
eq("auto falls back to REST on the same failure",
  ru.githubUnits("o/r", "auto", (m) => notices.push(m), { graphql: ghFail, rest: restStub }), [units[0]]);
eq("auto prints one notice", notices.length, 1);

// direct rows and landed commits (nw-direct-commits-recorded, nw-landed-commit-recorded)
const mainline = new Map([[A, "2026-01-01T00:00:00Z"], [D, "2026-01-09T00:00:00Z"]]);
const S = "5".repeat(40);
const land = (u, sha) => (u.url === "u/3" ? { landed: S, match: "squash" } : null);
const rows2 = ru.buildRows(changed, units, mainline, land);
const dRow = rows2.find((r) => r.commit === D);
eq("a bound commit on the default branch in no unit gets one direct row",
  [rows2.filter((r) => r.commit === D).length, dRow.unit, dRow.state, dRow.mergeCommit, dRow.timestamp, dRow.landed, dRow.match],
  [1, "", "direct", "", "2026-01-09T00:00:00Z", D, "same"]);
eq("a merged commit on the default branch lands as itself",
  [rows2[0].landed, rows2[0].match], [A, "same"]);
eq("a merged commit off the default branch takes the lander's answer",
  rows2.filter((r) => r.unit === "u/3").map((r) => `${r.landed.slice(0, 1)}:${r.match}`), ["5:squash", "5:squash"]);
eq("open units carry no landed commit", [rows2[3].unit, rows2[3].landed, rows2[3].match], ["u/2", "", ""]);
eq("a commit in a unit gets no direct row even when on the default branch",
  rows2.filter((r) => r.commit === A).map((r) => r.state), ["merged"]);
eq("a direct row renders with an empty review unit",
  ru.renderLog(rows2).split("\n").find((l) => l.includes(D)), `|  | direct |  | ${D} | 2026-01-09T00:00:00Z | ${D} | same |`);
eq("the report counts direct commits",
  [...ru.byEntity(changed, rows2).get("task-z")], [["direct", 1]]);

// landedCommit: chain is oldest first and ends at the merge commit.
const P = (x) => x.repeat(40);
const pidOf = { [P("1")]: "p1", [P("2")]: "p2", [P("3")]: "p3", [P("r")]: "p1", [P("s")]: "p2", [P("t")]: "px", [P("m")]: "pm" };
const pid = (c) => pidOf[c] || "";
const at = (t) => () => t;
const unitRb = { mergeCommit: P("t"), commits: [P("1"), P("2"), P("3")] };
eq("rebase: a patch-id match lands on the rebased commit",
  ru.landedCommit(unitRb, P("2"), [P("r"), P("s"), P("t")], pid, at(100)), { landed: P("s"), match: "patch-id" });
eq("rebase: no patch-id match falls back to position",
  ru.landedCommit(unitRb, P("3"), [P("r"), P("s"), P("t")], pid, at(100)), { landed: P("t"), match: "position" });
const ctimes = { [P("r")]: 10, [P("s")]: 20, [P("t")]: 5000 };
eq("squash: earlier commits from other work make the merge commit a squash",
  ru.landedCommit(unitRb, P("2"), [P("r"), P("s"), P("t")], pid, (c) => ctimes[c]), { landed: P("t"), match: "squash" });
eq("one-commit unit lands on the merge commit",
  ru.landedCommit({ mergeCommit: P("m"), commits: [P("1")] }, P("1"), [P("m")], pid, at(1)), { landed: P("m"), match: "squash" });
eq("no merge commit on the chain end lands nowhere",
  ru.landedCommit(unitRb, P("2"), [P("r"), P("s")], pid, at(1)), null);

// ---------- conformance ----------
const TS = "2026-01-01T00:00:00Z";
const entity = (fields, body) => "```yaml\n" + fields + "\n```\n" + body + "\n";
function codesFor(reviewRows) {
  const dir = mkdtempSync(join(tmpdir(), "konspekt-review-units-"));
  try {
    for (const d of ["nodes/task", "edges", "changes"]) mkdirSync(join(dir, d), { recursive: true });
    writeFileSync(join(dir, "project.md"),
      entity(`id: project-t\ngoal: test\npersonas: [engineer]\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# t"));
    writeFileSync(join(dir, "nodes/task/task-x.md"),
      entity(`id: task-x\nreview: accepted\nprovenance:\n  conversationId: t\n  timestamp: ${TS}\ncreatedAt: ${TS}\nupdatedAt: ${TS}\ntype: task\ntitle: X\nstatus: open`, "# Task: X"));
    writeFileSync(join(dir, "edges/edges.md"),
      entity(`provenance:\n  conversationId: t\n  timestamp: ${TS}\nreview: accepted`,
        "| id | kind | from | to | weight | review |\n|----|------|------|----|--------|--------|"));
    writeFileSync(join(dir, "changes/changed.md"),
      `| entity | commit | file | timestamp |\n|---|---|---|---|\n| task-x | ${A} | f1 | ${TS} |\n`);
    if (reviewRows) {
      writeFileSync(join(dir, "changes/review-units.md"),
        "| review unit | state | merge commit | commit | timestamp |\n|---|---|---|---|---|\n" + reviewRows.join("\n") + "\n");
    }
    const r = loadInstance(dir, { personas: [engineer], checkSources: false });
    return r.problems.filter((p) => /review-unit/.test(p.code)).map((p) => `${p.severity}:${p.code}`).sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
eq("no review-unit log is conformant", codesFor(null), []);
eq("a well-formed log passes", codesFor([`| u/1 | merged | m1 | ${A} | ${TS} |`, `| u/2 | open |  | ${A} | ${TS} |`]), []);
eq("a commit not in the changed-code log is an error",
  codesFor([`| u/1 | merged | m1 | ${B} | ${TS} |`]), ["error:dangling-review-unit-commit", "warning:review-unit-missing"]);
eq("an abbreviation of a bound commit is not a match (string compare)",
  codesFor([`| u/1 | merged | m1 | ${A.slice(0, 7)} | ${TS} |`]), ["error:dangling-review-unit-commit", "warning:review-unit-missing"]);
eq("an unknown state is an error", codesFor([`| u/1 | approved | m1 | ${A} | ${TS} |`]), ["error:review-unit-incomplete"]);
eq("merged without a merge commit is an error", codesFor([`| u/1 | merged |  | ${A} | ${TS} |`]), ["error:review-unit-incomplete"]);
eq("an unparseable timestamp is an error", codesFor([`| u/1 | open |  | ${A} | soon |`]), ["error:review-unit-incomplete"]);
eq("a repeated (unit, commit) warns",
  codesFor([`| u/1 | open |  | ${A} | ${TS} |`, `| u/1 | open |  | ${A} | ${TS} |`]), ["warning:duplicate-review-unit-row"]);
eq("a direct row passes", codesFor([`|  | direct |  | ${A} | ${TS} | ${A} | same |`]), []);
eq("a direct row naming a review unit is an error",
  codesFor([`| u/1 | direct |  | ${A} | ${TS} | ${A} | same |`]), ["error:review-unit-incomplete"]);
eq("an empty review unit outside a direct row is an error",
  codesFor([`|  | merged | m1 | ${A} | ${TS} |`]), ["error:review-unit-incomplete"]);
eq("landed squash and rebase rows pass",
  codesFor([`| u/1 | merged | m1 | ${A} | ${TS} | m1 | squash |`, `| u/2 | merged | m2 | ${A} | ${TS} | r2 | position |`]), []);
eq("landed without match is an error", codesFor([`| u/1 | merged | m1 | ${A} | ${TS} | m1 |  |`]), ["error:review-unit-incomplete"]);
eq("an unknown match is an error", codesFor([`| u/1 | merged | m1 | ${A} | ${TS} | m1 | guess |`]), ["error:review-unit-incomplete"]);
eq("an open row with a landed commit is an error",
  codesFor([`| u/1 | open |  | ${A} | ${TS} | m1 | squash |`]), ["error:review-unit-incomplete"]);
eq("a bound commit with no row warns", codesFor([]), ["warning:review-unit-missing"]);

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
