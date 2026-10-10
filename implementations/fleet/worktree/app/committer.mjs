// The committer's read side (fleet-spec.md § Committer protocol, steps 1-2).
//
// For the co-located worktree layout the committer reads each proposer's outbox
// as a sibling directory on the same machine: the proposals/ directory in the
// proposer's worktree. A later milestone makes the read incremental per outbox
// branch (since the last processed sequence); this reads the full outbox, which
// is enough for verify and for the dry-run pass.
//
// The read and verify side lives here (steps 1-2), and so does `foldPass` (step
// 4): the deterministic write onto canonical. Bless and the derived `proposed`
// index are M7/M6. The fold translation itself is fold.mjs; this module reads,
// verifies, orders the verified set, folds the batch, and commits it once.

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { verifyProposal } from "./verify.mjs";
import { parseProposal } from "./payload.mjs";
import { foldOrder } from "./order.mjs";
import { foldProposals } from "./fold.mjs";
import { commitAll } from "./git.mjs";

// Read one proposer worktree's outbox. Returns
// [{ proposalId, dir, proposalMd, sourceMd }]; proposalId is the directory name.
export function readOutbox(worktreePath) {
  const base = join(worktreePath, "proposals");
  if (!existsSync(base)) return [];
  const out = [];
  for (const id of readdirSync(base)) {
    const dir = join(base, id);
    const proposalPath = join(dir, "proposal.md");
    if (!existsSync(proposalPath)) continue;
    const sourcePath = join(dir, "source.md");
    out.push({
      proposalId: id,
      dir,
      proposalMd: readFileSync(proposalPath, "utf8"),
      sourceMd: existsSync(sourcePath) ? readFileSync(sourcePath, "utf8") : null,
    });
  }
  return out;
}

// Read every proposer's outbox, tagged with its owner handle and branch.
export function readProposals(fleet) {
  const all = [];
  for (const p of fleet.proposers) {
    for (const prop of readOutbox(p.path)) {
      all.push({ ...prop, owner: p.handle, branch: p.branch });
    }
  }
  return all;
}

// The verdict for one read proposal: verify plus the directory-name check (a
// payload whose id disagrees with its directory is as set-aside as a hash
// mismatch). Shared by verifyPass and foldPass so both judge a proposal the
// same way.
function verdictFor(fleet, pr, { grants, known }) {
  const branchOwner = fleet.ownerOf(pr.branch);
  const grant = grants[pr.owner] ?? {};
  const v = verifyProposal({ proposalMd: pr.proposalMd, sourceMd: pr.sourceMd, branchOwner, grant, known });
  const dirMatchesId = v.proposalId === pr.proposalId;
  const reasons = dirMatchesId
    ? v.reasons
    : [...v.reasons, `directory ${pr.proposalId} does not match proposal_id ${v.proposalId ?? "(none)"}`];
  return {
    proposalId: pr.proposalId,
    owner: pr.owner,
    branch: pr.branch,
    dir: pr.dir,
    ok: v.ok && dirMatchesId,
    checks: { ...v.checks, dir: dirMatchesId },
    reasons,
  };
}

// Run verify across every outbox proposal. `grants` maps an agent handle to its
// propose grant; `known` is the optional depends_on resolution set. Returns one
// verdict row per proposal, in read order.
export function verifyPass(fleet, { grants = {}, known = null } = {}) {
  return readProposals(fleet).map((pr) => verdictFor(fleet, pr, { grants, known }));
}

// The deterministic write pass (fleet-spec.md § Committer protocol, step 4):
// read, verify, order the verified set in fold order, fold the batch whole onto
// canonical as `review: proposed`, and commit it once. `instanceSubdir` locates
// the konspekt instance inside the canonical worktree (e.g. ".konspekt/instance"
// when dogfooding the real store); default is the worktree root. Returns
// { verdicts, folded, setAside, commit }. A verified proposal the fold cannot
// place is reported in `setAside`, and nothing partial is committed — fold
// writes files and this commits once, so an aborted fold leaves canonical clean.
export function foldPass(fleet, { grants = {}, known = null, identity = {}, instanceSubdir = "", now = null } = {}) {
  const verdicts = [];
  const verified = [];
  for (const pr of readProposals(fleet)) {
    const verdict = verdictFor(fleet, pr, { grants, known });
    verdicts.push(verdict);
    if (!verdict.ok) continue;
    let created = null;
    try { created = parseProposal(pr.proposalMd).front.created ?? null; } catch { /* verified payloads parse */ }
    verified.push({ proposalId: pr.proposalId, proposalMd: pr.proposalMd, sourceMd: pr.sourceMd, created });
  }

  const instanceDir = instanceSubdir ? join(fleet.canonicalPath, instanceSubdir) : fleet.canonicalPath;
  const { folded, setAside } = foldProposals(instanceDir, foldOrder(verified), { now, fleetDir: fleet.canonicalPath });

  let commit = null;
  if (folded.length) {
    commit = commitAll(fleet.canonicalPath, `fold: ${folded.length} proposal(s)`, {
      name: identity.name,
      email: identity.email,
      signoff: true,
    });
  }
  return { verdicts, folded, setAside, commit };
}
