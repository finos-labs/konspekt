#!/usr/bin/env node
// Integration test for squash and rebase merges (nw-landed-commit-recorded) and
// direct commits (nw-direct-commits-recorded), against a real git repository
// built in a temporary directory. No forge is called: the review units are
// written by hand in the shape githubUnits() returns, as GitHub would report
// them after a squash merge and a rebase merge. The landed commits are then
// found with git (gitLander), and tools/binding-audit.mjs, copied into the
// repository, is run before and after the review-unit log is written.
//
// Run:  node test/review-units-git.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ru = await import(pathToFileURL(join(HERE, "..", "tools", "review-units.mjs")));

let failed = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) console.log(`  ok   ${name}`);
  else { failed++; console.log(`  FAIL ${name}\n       got  ${g}\n       want ${w}`); }
};

const dir = mkdtempSync(join(tmpdir(), "konspekt-landed-"));
const prevCwd = process.cwd();
let clock = Date.parse("2026-01-01T00:00:00Z") / 1000;
const git = (args, at) => {
  const t = `${at ?? (clock += 3600)} +0000`;
  return execFileSync("git", args, {
    cwd: dir, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_AUTHOR_DATE: t, GIT_COMMITTER_DATE: t, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.invalid",
      GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.invalid" },
  }).trim();
};
const write = (f, text) => { mkdirSync(dirname(join(dir, f)), { recursive: true }); writeFileSync(join(dir, f), text); };
const commit = (f, text, msg, at) => { write(f, text); git(["add", f]); git(["commit", "-q", "-m", msg], at); return git(["rev-parse", "HEAD"]); };

try {
  git(["init", "-q", "-b", "main"]);
  git(["config", "commit.gpgsign", "false"]);
  write(".konspekt/instance/project.md", "binding: required\n");
  commit("README", "base\n", "base");

  // Squash: two bound branch commits become one squash commit on main.
  git(["checkout", "-q", "-b", "feat-squash"]);
  const b1 = commit("a.txt", "a1\n", "b1");
  const b2 = commit("b.txt", "b1\n", "b2");
  git(["checkout", "-q", "main"]);
  git(["merge", "-q", "--squash", "feat-squash"]);
  const squashAt = (clock += 3600);
  git(["commit", "-q", "-m", "squash (#1)"], squashAt);
  const S = git(["rev-parse", "HEAD"]);

  // Direct: a bound commit pushed straight to main.
  const u = commit("c.txt", "direct\n", "direct work");

  // Rebase: two bound branch commits replayed onto main at merge time; the
  // second is changed while replaying (a conflict resolved by hand), so its
  // patch-id no longer matches.
  git(["checkout", "-q", "-b", "feat-rebase", S]);
  const b3 = commit("d.txt", "d1\n", "b3");
  const b4 = commit("e.txt", "e1\n", "b4");
  git(["checkout", "-q", "main"]);
  const mergeAt = (clock += 3600);
  git(["cherry-pick", "-x", b3], mergeAt);
  const r3 = git(["rev-parse", "HEAD"]);
  write("e.txt", "e1 resolved\n"); git(["add", "e.txt"]); git(["commit", "-q", "-m", "b4"], mergeAt);
  const r4 = git(["rev-parse", "HEAD"]);

  const units = [
    { url: "u/1", number: 1, state: "merged", mergeCommit: S, timestamp: "2026-01-01T03:00:00Z", commits: [b1, b2] },
    { url: "u/2", number: 2, state: "merged", mergeCommit: r4, timestamp: "2026-01-01T06:00:00Z", commits: [b3, b4] },
  ];
  const changedText = ["| entity | commit | file | timestamp |", "|---|---|---|---|",
    `| task-s | ${b1} | a.txt | t |`, `| task-s | ${b2.slice(0, 7)} | b.txt | t |`,
    `| task-d | ${u} | c.txt | t |`, `| task-r | ${b3} | d.txt | t |`, `| task-r | ${b4} | e.txt | t |`].join("\n") + "\n";
  write(".konspekt/instance/changes/changed.md", changedText);

  process.chdir(dir);
  const rows = ru.buildRows(ru.parseChanged(changedText), units, ru.mainlineCommits("main"), ru.gitLander());
  process.chdir(prevCwd);
  const view = rows.map((r) => [r.unit, r.state, r.commit.slice(0, 7), r.landed.slice(0, 7), r.match]);
  eq("squash, direct and rebase rows", view, [
    ["u/1", "merged", b1.slice(0, 7), S.slice(0, 7), "squash"],
    ["u/1", "merged", b2.slice(0, 7), S.slice(0, 7), "squash"],
    ["", "direct", u.slice(0, 7), u.slice(0, 7), "same"],
    ["u/2", "merged", b3.slice(0, 7), r3.slice(0, 7), "patch-id"],
    ["u/2", "merged", b4.slice(0, 7), r4.slice(0, 7), "position"],
  ]);

  // The binding audit, copied into the repository so it finds this instance.
  mkdirSync(join(dir, "tools"), { recursive: true });
  copyFileSync(join(HERE, "..", "tools", "binding-audit.mjs"), join(dir, "tools", "binding-audit.mjs"));
  const audit = () => {
    const r = spawnSync(process.execPath, [join(dir, "tools", "binding-audit.mjs"), "--since", git(["rev-list", "--max-parents=0", "HEAD"])],
      { cwd: dir, encoding: "utf8", windowsHide: true });
    const reported = (r.stderr.match(/^ {2}[0-9a-f]{10} /gm) || []).map((s) => s.trim());
    return { status: r.status, reported };
  };
  const before = audit();
  eq("before the log is derived, the squash and rebased commits are unbound",
    [before.status, before.reported.sort()], [1, [S, r3, r4].map((s) => s.slice(0, 10)).sort()]);
  write(".konspekt/instance/changes/review-units.md", ru.renderLog(rows));
  const after = audit();
  eq("after the log is derived, the audit is clean", [after.status, after.reported], [0, []]);
} finally {
  process.chdir(prevCwd);
  rmSync(dir, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
