// The committer's read side (fleet-spec.md § Committer protocol, steps 1-2).
//
// For the co-located worktree layout the committer reads each proposer's outbox
// as a sibling directory on the same machine: the proposals/ directory in the
// proposer's worktree. A later milestone makes the read incremental per outbox
// branch (since the last processed sequence); this reads the full outbox, which
// is enough for verify and for the dry-run pass.
//
// The write side (fold, bless, the derived proposed index) is M5-M7 and is not
// here: this module reads and verifies, and holds no authority to write
// canonical.

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { verifyProposal } from "./verify.mjs";

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

// Run verify across every outbox proposal. `grants` maps an agent handle to its
// propose grant; `known` is the optional depends_on resolution set. Returns one
// verdict row per proposal, in read order.
export function verifyPass(fleet, { grants = {}, known = null } = {}) {
  return readProposals(fleet).map((pr) => {
    const branchOwner = fleet.ownerOf(pr.branch);
    const grant = grants[pr.owner] ?? {};
    const v = verifyProposal({
      proposalMd: pr.proposalMd,
      sourceMd: pr.sourceMd,
      branchOwner,
      grant,
      known,
    });
    // The directory name must also match the recomputed id: a payload whose id
    // disagrees with its directory is as set-aside as a hash mismatch.
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
  });
}
