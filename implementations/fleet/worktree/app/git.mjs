// Git plumbing for the committer and the proposer outboxes.
//
// A thin, synchronous wrapper around the git CLI. The committer is a
// deterministic single writer (fleet-spec.md § Model), so these calls are
// intentionally blocking and one-at-a-time; there is no concurrency to manage
// here. Everything shells out to one `git` process per call and surfaces the
// exit code and stderr on failure, so a caller never mistakes a failed git for
// a success.

import { execFileSync } from "node:child_process";

// Run one git command in `cwd` and return trimmed stdout. Throws with stderr on
// a non-zero exit. `input`, when given, is written to stdin.
export function git(cwd, args, { input } = {}) {
  try {
    return execFileSync("git", args, {
      cwd,
      input,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    const stderr = err.stderr ? String(err.stderr).trim() : "";
    const e = new Error(`git ${args.join(" ")} failed in ${cwd}: ${stderr || err.message}`);
    e.cause = err;
    e.stderr = stderr;
    throw e;
  }
}

// Initialize a repository at `dir` with `initialBranch` as its first branch.
// Uses `git init -b`, which is the object store the N+1 worktrees share.
export function init(dir, { initialBranch = "canonical" } = {}) {
  git(process.cwd(), ["init", "-b", initialBranch, dir]);
  return dir;
}

// The branch currently checked out in `cwd`.
export function currentBranch(cwd) {
  return git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);
}

// Stage everything and commit. `signoff` adds the DCO trailer. `allowEmpty`
// seeds an empty initial commit. Identity is passed per-call with `-c` rather
// than written to config, so the object store carries no ambient identity.
export function commitAll(cwd, message, { name, email, signoff = false, allowEmpty = false } = {}) {
  git(cwd, ["add", "-A"]);
  const args = [
    "-c", `user.name=${name ?? "konspekt-committer"}`,
    "-c", `user.email=${email ?? "committer@konspekt.local"}`,
    "commit", "-m", message,
  ];
  if (signoff) args.push("--signoff");
  if (allowEmpty) args.push("--allow-empty");
  git(cwd, args);
  return git(cwd, ["rev-parse", "HEAD"]);
}

// Add a linked worktree at `path`. With `newBranch`, create `branch` off the
// current HEAD (the canonical base a proposer reads from); otherwise check out
// an existing `branch`.
export function addWorktree(cwd, path, branch, { newBranch = false } = {}) {
  const args = ["worktree", "add"];
  if (newBranch) args.push("-b", branch, path);
  else args.push(path, branch);
  git(cwd, args);
  return path;
}

// Remove a linked worktree. `force` drops it even with local changes.
export function removeWorktree(cwd, path, { force = false } = {}) {
  const args = ["worktree", "remove"];
  if (force) args.push("--force");
  args.push(path);
  git(cwd, args);
}

// Parse `git worktree list --porcelain` into { path, head, branch }. `branch`
// is the short name (refs/heads/x -> x) or null for a detached worktree.
export function listWorktrees(cwd) {
  const out = git(cwd, ["worktree", "list", "--porcelain"]);
  const entries = [];
  let cur = null;
  for (const line of out.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (cur) entries.push(cur);
      cur = { path: line.slice("worktree ".length), head: null, branch: null };
    } else if (line.startsWith("HEAD ")) {
      if (cur) cur.head = line.slice("HEAD ".length);
    } else if (line.startsWith("branch ")) {
      if (cur) cur.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "");
    } else if (line === "detached") {
      if (cur) cur.branch = null;
    }
  }
  if (cur) entries.push(cur);
  return entries;
}
