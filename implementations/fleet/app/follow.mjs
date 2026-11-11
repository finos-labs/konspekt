// Canonical branch following (task-fleet-canonical-follow).
//
// When the committer's canonical branch changes, every proposer follows it:
//
//   1. refuse unless the canonical worktree and every outbox worktree are clean;
//   2. drain: fold every pending outbox proposal onto the OLD canonical branch,
//      and apply pending claims there;
//   3. clear: delete the drained proposal directories from each outbox branch
//      (one commit per outbox), so they do not fold again onto the new branch;
//   4. write the new branch name into the fleet config's `canonicalBranch` on
//      the new branch (the value is dynamic: it names the branch the committer
//      created or cloned into);
//   5. merge the new canonical branch into each outbox branch, so each proposer
//      authors against the new graph and loads current skills;
//   6. record the new branch in the runtime state `.konspekt-fleet/canonical-branch`.
//
// Two entry points share these steps. `switchCanonical` is the explicit
// committer command: it drains in the canonical worktree, then switches it.
// `followSwitch` runs after the canonical worktree was already switched (by
// hand, or observed by the watcher): it drains onto the previous branch through
// a temporary worktree, because the canonical worktree no longer has that branch
// checked out. The previous branch comes from the runtime state, falling back to
// the config value the fleet was attached with.
//
// Both act only in fleet mode (`fleetMode` in worktrees.mjs): the caller attaches
// config-driven and passes the attached descriptor. The committer writes to the
// outbox branches only in steps 3 and 5. It never accepts: drained proposals
// land as `review: proposed`, and pending releases stay pending.

import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { verifyPass, foldPass } from "./committer.mjs";
import { applyClaims } from "./claims.mjs";
import { writeConfigBranch, CONFIG_REL } from "./worktrees.mjs";
import { FLEET_DIR } from "./proposed-ref.mjs";
import {
  git,
  currentBranch,
  statusLines,
  branchExists,
  isAncestor,
  switchBranch,
  mergeBranch,
  removeAndCommit,
  showFile,
  addWorktree,
  removeWorktree,
  listWorktrees,
} from "./git.mjs";

export const BRANCH_STATE = "canonical-branch";

// A refusal the operator resolves (dirty worktree, unverified proposal, bad
// target branch). The watcher logs it and retries on a later tick; the CLI
// prints it and exits non-zero. Other errors are unexpected failures.
export class FollowRefused extends Error {
  constructor(message) {
    super(message);
    this.name = "FollowRefused";
  }
}

// The last canonical branch the committer folded onto, from runtime state, or
// null when none is recorded.
export function readRecordedBranch(canonicalPath) {
  const p = join(canonicalPath, FLEET_DIR, BRANCH_STATE);
  if (!existsSync(p)) return null;
  const v = readFileSync(p, "utf8").trim();
  return v || null;
}

export function recordBranch(canonicalPath, branch) {
  const dir = join(canonicalPath, FLEET_DIR);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, BRANCH_STATE), branch + "\n", "utf8");
}

// Every worktree of the fleet that has uncommitted changes or untracked files.
// Returns [{ who, path, lines }]; empty when all are clean.
export function dirtyWorktrees(fleet) {
  const out = [];
  // The committer's runtime directory is excluded: it is gitignored in an
  // adopter repo, but a throwaway store may not ignore it, and the committer
  // itself writes it (fold log, recorded branch).
  // statusLines comes from git() output, which is trimmed, so the first line may
  // have lost its leading status column; strip the status code by pattern.
  const runtime = (line) => line.replace(/^[ MADRCUT?!]{1,2}\s+/, "").replace(/^"/, "").startsWith(`${FLEET_DIR}/`);
  const check = (who, path) => {
    const lines = statusLines(path).filter((l) => !runtime(l));
    if (lines.length) out.push({ who, path, lines });
  };
  check("canonical", fleet.canonicalPath);
  for (const p of fleet.proposers) check(p.handle, p.path);
  return out;
}

function refuseIfDirty(fleet) {
  const dirty = dirtyWorktrees(fleet);
  if (!dirty.length) return;
  const detail = dirty
    .map((d) => `  - ${d.who} (${d.path}):\n${d.lines.slice(0, 5).map((l) => `      ${l}`).join("\n")}` +
      (d.lines.length > 5 ? `\n      … ${d.lines.length - 5} more` : ""))
    .join("\n");
  throw new FollowRefused(
    `refusing to follow the canonical branch: these worktrees have uncommitted changes. ` +
      `Commit, stash, or discard them, then retry:\n${detail}`,
  );
}

// Fold every pending outbox proposal onto the branch checked out in
// `fleet.canonicalPath`, apply pending claims there, and delete the drained
// proposal and applied-claim directories from each outbox branch.
//
// Refuses before writing anything when any proposal fails verification: a drain
// folds ALL pending proposals or none. A fold-time set-aside after verification
// throws after the fold commit and before any outbox is cleared, so a retry sees
// the folded proposals as already folded and clears them then.
//
// `fleetDir` is where the fold log is written (the real canonical worktree when
// `fleet.canonicalPath` is a temporary worktree). `outboxFleet` supplies the
// proposer worktrees to clear; it defaults to `fleet`. Returns
// { folded, alreadyFolded, foldCommit, claims, cleared: [{ handle, ids, commit }] }.
export function drainOutboxes(fleet, { grants = {}, identity = {}, instanceSubdir = "", now = null, fleetDir = null, reason = "canonical switch" } = {}) {
  const verdicts = verifyPass(fleet, { grants, instanceSubdir });
  const bad = verdicts.filter((v) => !v.ok);
  if (bad.length) {
    const detail = bad
      .map((v) => `  - ${v.owner} ${v.proposalId.slice(0, 12)}: ${v.reasons.join("; ")}`)
      .join("\n");
    throw new FollowRefused(
      `refusing to follow the canonical branch: ${bad.length} outbox proposal(s) fail verification ` +
        `and cannot be folded. Remove them from the outbox or fix them, then retry:\n${detail}`,
    );
  }

  const res = foldPass(fleet, { grants, identity, instanceSubdir, now, fleetDir });
  if (res.setAside.length) {
    const detail = res.setAside.map((s) => `  - ${s.proposalId ? s.proposalId.slice(0, 12) : "(?)"}: ${s.reason}`).join("\n");
    throw new FollowRefused(
      `refusing to follow the canonical branch: ${res.setAside.length} verified proposal(s) could not ` +
        `be folded. Nothing was cleared from the outboxes:\n${detail}`,
    );
  }

  const claims = applyClaims(fleet, { instanceSubdir, identity, now });

  // Which outbox directories to delete, per owner: every proposal that is now on
  // the old canonical (folded in this drain or earlier), and every claim applied
  // in this drain. Pending releases and set-aside claims stay.
  const ownerOf = new Map(verdicts.map((v) => [v.proposalId, v.owner]));
  const toClear = new Map();
  const add = (owner, id) => {
    if (!owner || !id) return;
    if (!toClear.has(owner)) toClear.set(owner, []);
    toClear.get(owner).push(id);
  };
  for (const f of [...res.folded, ...res.alreadyFolded]) add(ownerOf.get(f.proposalId), f.proposalId);
  for (const a of claims.applied) add(a.agent, a.claimId);

  const cleared = [];
  for (const p of fleet.proposers) {
    const ids = toClear.get(p.handle) ?? [];
    if (!ids.length) continue;
    const commit = removeAndCommit(
      p.path,
      `outbox: clear ${ids.length} drained item(s) before ${reason}`,
      ids.map((id) => `proposals/${id}`),
      { name: identity.name, email: identity.email, signoff: true },
    );
    cleared.push({ handle: p.handle, ids, commit });
  }

  return { folded: res.folded, alreadyFolded: res.alreadyFolded, foldCommit: res.commit, claims, cleared };
}

// Merge `branch` into every outbox branch that does not already contain it.
// A merge that fails is aborted and reported; the others proceed. Returns
// [{ handle, status: "merged"|"up-to-date"|"failed", commit?, error? }].
export function followOutboxes(fleet, branch, { identity = {} } = {}) {
  const out = [];
  for (const p of fleet.proposers) {
    if (isAncestor(p.path, branch, "HEAD")) {
      out.push({ handle: p.handle, status: "up-to-date" });
      continue;
    }
    try {
      const commit = mergeBranch(p.path, branch, identity);
      out.push({ handle: p.handle, status: "merged", commit });
    } catch (e) {
      out.push({ handle: p.handle, status: "failed", error: e.stderr || e.message });
    }
  }
  return out;
}

function checkedOutElsewhere(fleet, branch) {
  return listWorktrees(fleet.canonicalPath).find((w) => w.branch === branch && w.path) ?? null;
}

// The explicit committer command: drain onto the current canonical branch, then
// switch the canonical worktree to `to` (with `create`, a new branch off the
// current HEAD), write the config, and merge the new branch into each outbox.
export function switchCanonical(fleet, { to, create = false, grants = {}, identity = {}, instanceSubdir = "", now = null, configRel = CONFIG_REL } = {}) {
  if (!to) throw new FollowRefused("switch-canonical needs a target branch (--to <branch>)");
  const from = currentBranch(fleet.canonicalPath);
  if (from === to) throw new FollowRefused(`canonical worktree is already on "${to}"`);
  if (fleet.canonicalBranch && fleet.canonicalBranch !== from) {
    throw new FollowRefused(
      `canonical worktree is on "${from}" but the fleet config declares "${fleet.canonicalBranch}"; ` +
        `the worktree was switched outside the fleet. Run follow-canonical to follow that switch first.`,
    );
  }
  if (create && branchExists(fleet.canonicalPath, to)) {
    throw new FollowRefused(`branch "${to}" already exists; drop --create to switch to it`);
  }
  if (!create) {
    if (!branchExists(fleet.canonicalPath, to)) {
      throw new FollowRefused(`branch "${to}" does not exist; pass --create to create it off "${from}"`);
    }
    const other = checkedOutElsewhere(fleet, to);
    if (other) throw new FollowRefused(`branch "${to}" is checked out in another worktree (${other.path})`);
  }
  refuseIfDirty(fleet);

  const configText = showFile(fleet.canonicalPath, "HEAD", configRel);
  const drain = drainOutboxes(fleet, { grants, identity, instanceSubdir, now, reason: `canonical switch to ${to}` });
  switchBranch(fleet.canonicalPath, to, { create });
  const configCommit = writeConfigBranch(fleet.canonicalPath, to, { configRel, identity, fallbackText: configText });
  const outboxes = followOutboxes(fleet, to, { identity });
  recordBranch(fleet.canonicalPath, to);
  fleet.canonicalBranch = to;
  return { from, to, drain, configCommit, outboxes };
}

// Follow a switch that already happened in the canonical worktree: drain onto
// `from` (the previous canonical branch) through a temporary worktree, then
// write the config on the current branch and merge it into each outbox. `from`
// defaults to the recorded runtime branch, then to the attached config value.
// Returns null when there is no switch to follow.
export function followSwitch(fleet, { from = null, grants = {}, identity = {}, instanceSubdir = "", now = null, configRel = CONFIG_REL } = {}) {
  const to = currentBranch(fleet.canonicalPath);
  const prev = from || readRecordedBranch(fleet.canonicalPath) || fleet.canonicalBranch;
  if (!prev || prev === to) return null;
  if (!branchExists(fleet.canonicalPath, prev)) {
    throw new FollowRefused(
      `the previous canonical branch "${prev}" no longer exists, so its pending proposals cannot be ` +
        `drained onto it. Recreate it, or record the current branch with ` +
        `\`follow-canonical --from ${to}\` to skip the drain.`,
    );
  }
  const other = checkedOutElsewhere(fleet, prev);
  if (other) {
    throw new FollowRefused(`the previous canonical branch "${prev}" is checked out in another worktree (${other.path}); free it so the drain can check it out`);
  }
  refuseIfDirty(fleet);

  // Drain onto `prev` in a temporary worktree outside the repository, so the
  // canonical worktree's own status is untouched.
  const tmpRoot = mkdtempSync(join(tmpdir(), "konspekt-drain-"));
  const tmp = join(tmpRoot, "wt");
  addWorktree(fleet.canonicalPath, tmp, prev);
  let drain;
  try {
    const drainFleet = { ...fleet, canonicalPath: tmp };
    drain = drainOutboxes(drainFleet, { grants, identity, instanceSubdir, now, fleetDir: fleet.canonicalPath, reason: `canonical switch to ${to}` });
  } finally {
    try { removeWorktree(fleet.canonicalPath, tmp, { force: true }); } catch { /* reported by prune below */ }
    try { git(fleet.canonicalPath, ["worktree", "prune"]); } catch { /* best effort */ }
    try { rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* best effort */ }
  }

  const configText = showFile(fleet.canonicalPath, prev, configRel);
  const configCommit = writeConfigBranch(fleet.canonicalPath, to, { configRel, identity, fallbackText: configText });
  const outboxes = followOutboxes(fleet, to, { identity });
  recordBranch(fleet.canonicalPath, to);
  fleet.canonicalBranch = to;
  return { from: prev, to, drain, configCommit, outboxes };
}

// Human-readable report lines for a switch or follow result.
export function describeFollow(r) {
  const lines = [`canonical branch: ${r.from} -> ${r.to}`];
  const d = r.drain;
  lines.push(`  drained onto ${r.from}: ${d.folded.length} folded, ${d.alreadyFolded.length} already folded` +
    (d.foldCommit ? ` (${d.foldCommit.slice(0, 12)})` : ""));
  if (d.claims.applied.length) lines.push(`  applied ${d.claims.applied.length} claim(s) on ${r.from}`);
  for (const p of d.claims.pending) lines.push(`  release still pending (kept in outbox): ${p.claim?.node} by ${p.owner}`);
  for (const c of d.cleared) lines.push(`  cleared ${c.ids.length} item(s) from outbox/${c.handle} (${c.commit.slice(0, 12)})`);
  lines.push(r.configCommit ? `  config canonicalBranch -> ${r.to} (${r.configCommit.slice(0, 12)})` : `  config already names ${r.to}`);
  for (const o of r.outboxes) {
    if (o.status === "merged") lines.push(`  outbox ${o.handle}: merged ${r.to} (${o.commit.slice(0, 12)})`);
    else if (o.status === "up-to-date") lines.push(`  outbox ${o.handle}: already contains ${r.to}`);
    else lines.push(`  outbox ${o.handle}: MERGE FAILED, aborted; resolve by hand: ${o.error}`);
  }
  return lines;
}
