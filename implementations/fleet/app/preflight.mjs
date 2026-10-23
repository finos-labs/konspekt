// Setup-time acceptance-authority preflight (task-agent-fleet).
//
// A fleet is "one reviewer over many proposers": the proposers fold atoms onto
// canonical as review: proposed, and a human accepts them. That arrangement is
// incoherent unless two preconditions hold, and both are checkable before any
// worktree is stood up:
//
//   1. the canonical instance declares an acceptance authority — a human
//      grantor principal, and a grant that gives some principal the right to
//      accept; and
//   2. the approving identity is configured in the environment the acceptance
//      client runs in — KONSPEKT_PRINCIPAL is set and names a declared
//      principal that holds an accept grant.
//
// Without (1) a UI client that declares no principals writes an accept with an
// empty `by` (lost attribution); declaring principals makes the client
// fail-closed, but only at accept time. Without (2) the human cannot accept at
// all. Checking both at `setup` (and on demand via `doctor`) turns a
// first-accept-time surprise into a blocking setup precondition, so an adopter
// cannot stand up a fleet that can fold proposals but never attributably accept
// them.
//
// The env-var check validates the environment THIS process runs in. In the
// single-human adopter topology (committer and approver share one user
// environment) that is the approver's environment. In a split topology each
// acceptance client needs the export in its own environment; the problem text
// says so, and each client still enforces fail-closed at accept time.

import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { parsePrincipals, parseGrants, activeGrants } from "../../../lib/authority.mjs";
import { currentBranch } from "./git.mjs";

export const PRINCIPAL_ENV = "KONSPEKT_PRINCIPAL";

// The standard adopter layout carries the portable instance at
// <canonical>/.konspekt/instance (the fleet config sits beside it under
// .konspekt/fleet/config/). Callers may override for a non-standard layout.
export const DEFAULT_INSTANCE_SUBDIR = join(".konspekt", "instance");

// Build the `set KONSPEKT_PRINCIPAL` hint from the principals that actually hold
// a grant, so the message names a value that will pass this same check.
function configureHint(acceptors) {
  const ids = [...acceptors];
  const choices = ids.length ? ids.join(" | ") : "<a granted principal>";
  const one = ids[0] || "<id>";
  return (
    `Set ${PRINCIPAL_ENV} to a granted principal (${choices}) in the acceptance ` +
    `client's environment — Windows: \`setx ${PRINCIPAL_ENV} ${one}\`; ` +
    `POSIX: \`export ${PRINCIPAL_ENV}=${one}\`. Each acceptance client (committer ` +
    `shell, IDE plugin) needs it in its own environment.`
  );
}

// Run the acceptance-authority preflight against a canonical worktree. Pure and
// read-only: it reads the instance's authority tables and one environment
// variable and returns a verdict. `principal` overrides the environment lookup
// (used by tests and by a caller that already resolved the identity).
//
// Returns { ok, problems: string[], principal, acceptors: string[] }.
export function authorityPreflight({
  canonicalPath,
  instanceSubdir = DEFAULT_INSTANCE_SUBDIR,
  principal,
} = {}) {
  if (!canonicalPath) throw new Error("authorityPreflight needs a canonicalPath");
  const who = principal !== undefined ? principal : process.env[PRINCIPAL_ENV];
  const problems = [];

  const instanceDir = join(canonicalPath, instanceSubdir);
  const label = join(instanceSubdir, "authority");
  const prPath = join(instanceDir, "authority", "principals.md");
  const grPath = join(instanceDir, "authority", "grants.md");

  const principals = existsSync(prPath) ? parsePrincipals(readFileSync(prPath, "utf8")) : null;
  const grants = existsSync(grPath) ? parseGrants(readFileSync(grPath, "utf8")) : null;

  // 1a. the instance declares principals at all.
  if (!principals || principals.length === 0) {
    problems.push(
      `${label}/principals.md declares no principals: a fleet needs a declared ` +
        `human acceptor before setup. Declare one (a human principal with the ` +
        `grantor role) and grant it accept rights.`,
    );
  } else if (!principals.some((p) => p.kind === "human" && p.roles.includes("grantor"))) {
    // 1b. and at least one of them is a human grantor.
    problems.push(
      `${label}/principals.md declares no human grantor: add a human principal ` +
        `with the grantor role.`,
    );
  }

  // 2. an effective accept grant exists; collect who holds one (any scope).
  const effective = grants ? activeGrants(grants, Date.now()) : new Map();
  const acceptors = new Set();
  for (const set of effective.values()) for (const a of set) acceptors.add(a);
  if (acceptors.size === 0) {
    problems.push(
      `${label}/grants.md declares no effective accept grant: declare a grant so ` +
        `proposals folded by the fleet can be accepted.`,
    );
  }

  // 3. the approving identity is configured in this environment and can accept.
  const declaredIds = new Set((principals || []).map((p) => p.id));
  if (!who) {
    problems.push(
      `${PRINCIPAL_ENV} is not set: the approving authority's identity is ` +
        `unconfigured. ${configureHint(acceptors)}`,
    );
  } else if (principals && !declaredIds.has(who)) {
    problems.push(
      `${PRINCIPAL_ENV}="${who}" names no declared principal. ${configureHint(acceptors)}`,
    );
  } else if (!acceptors.has(who)) {
    problems.push(
      `${PRINCIPAL_ENV}="${who}" holds no accept grant. ${configureHint(acceptors)}`,
    );
  }

  return { ok: problems.length === 0, problems, principal: who ?? null, acceptors: [...acceptors] };
}

// Assert the canonical worktree is on the branch the config declares. The
// committer folds onto the canonical worktree's CURRENT branch (`commitAll`
// checks out nothing); `canonicalBranch` in the config is used only by `setup`
// (to fork the outbox branches) and as attach metadata. The two can therefore
// silently disagree — switch the worktree's branch without updating the config
// and folds land on the new branch while the config still names the old one
// (nw-fleet-fold-follows-worktree-branch). This turns that silent disagreement
// into a loud, blocking one at run-pass / doctor time.
//
// `configuredBranch` is the config's declared canonicalBranch. When it is empty
// (the config omits it, so attach falls back to the worktree's current branch)
// there is nothing to contradict and the check passes. Pure and read-only.
//
// Returns { ok, configured, actual, problem }.
export function canonicalBranchCheck({ canonicalPath, configuredBranch } = {}) {
  if (!canonicalPath) throw new Error("canonicalBranchCheck needs a canonicalPath");
  const actual = currentBranch(canonicalPath);
  if (!configuredBranch || actual === configuredBranch) {
    return { ok: true, configured: configuredBranch || null, actual, problem: null };
  }
  return {
    ok: false,
    configured: configuredBranch,
    actual,
    problem:
      `canonical worktree is on branch "${actual}" but the fleet config declares ` +
      `canonicalBranch "${configuredBranch}": folds follow the worktree's current ` +
      `branch, so they would land on "${actual}", not "${configuredBranch}". Switch ` +
      `the worktree (\`git -C "${canonicalPath}" switch ${configuredBranch}\`) or update ` +
      `canonicalBranch in the config to match (nw-fleet-fold-follows-worktree-branch).`,
  };
}
