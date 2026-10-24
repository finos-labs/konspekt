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
// index are M7/M6. The verify-and-append itself is fold.mjs; this module reads,
// verifies, orders the verified set, appends the batch, and commits it once.

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { verifyProposal } from "./verify.mjs";
import { computeEntityId } from "./payload.mjs";
import { foldOrder } from "./order.mjs";
import { foldProposals } from "./fold.mjs";
import { decideAtom } from "./bless.mjs";
import { commitAll } from "./git.mjs";
import { splitEntityFile } from "../../../lib/conformance.mjs";

// Read one proposer worktree's outbox. Returns
// [{ proposalId, dir, entityMd, sourceMd, edgesMd, meta }]; proposalId is the
// directory name. A directory without entity.md is skipped. meta.json parse
// failures leave meta null, which verify reports as a missing origin.
export function readOutbox(worktreePath) {
  const base = join(worktreePath, "proposals");
  if (!existsSync(base)) return [];
  const out = [];
  for (const id of readdirSync(base)) {
    const dir = join(base, id);
    const entityPath = join(dir, "entity.md");
    if (!existsSync(entityPath)) continue;
    const read = (name) => (existsSync(join(dir, name)) ? readFileSync(join(dir, name), "utf8") : null);
    let meta = {};
    const metaText = read("meta.json");
    if (metaText != null) { try { meta = JSON.parse(metaText); } catch { meta = {}; } }
    out.push({
      proposalId: id,
      dir,
      entityMd: readFileSync(entityPath, "utf8"),
      sourceMd: read("source.md"),
      edgesMd: read("edges.md") ?? "",
      meta,
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
  const v = verifyProposal({ entityMd: pr.entityMd, sourceMd: pr.sourceMd, meta: pr.meta, branchOwner, grant, known });
  const computedId = computeEntityId(pr.entityMd);
  const dirMatchesId = computedId === pr.proposalId;
  const reasons = dirMatchesId
    ? v.reasons
    : [...v.reasons, `directory ${pr.proposalId} does not match the entity content id ${computedId}`];
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
    const { front } = splitEntityFile(pr.entityMd);
    const created = (front.provenance && front.provenance.timestamp) || front.createdAt || null;
    verified.push({
      proposalId: pr.proposalId,
      entityMd: pr.entityMd,
      sourceMd: pr.sourceMd,
      edgesMd: pr.edgesMd,
      meta: pr.meta,
      created,
    });
  }

  const instanceDir = instanceSubdir ? join(fleet.canonicalPath, instanceSubdir) : fleet.canonicalPath;
  const { folded, alreadyFolded, setAside } = foldProposals(instanceDir, foldOrder(verified), { now, fleetDir: fleet.canonicalPath });

  // Commit only when the fold wrote something. An already-folded proposal
  // writes nothing, so a pass that folds nothing new leaves canonical byte-for-
  // byte unchanged and creates no commit (the idempotent-fold invariant).
  let commit = null;
  if (folded.length) {
    commit = commitAll(fleet.canonicalPath, `fold: ${folded.length} proposal(s)`, {
      name: identity.name,
      email: identity.email,
      signoff: true,
    });
  }
  return { verdicts, folded, alreadyFolded, setAside, commit };
}

// Watch loop (task-fleet-committer-startup-scan): run a fold pass on a loop until
// `stop()` returns true, so the committer, once up, keeps folding proposals as
// proposer outboxes advance instead of acting only on a single manual pass. The
// loop is a pure control primitive — `tick`, `stop`, and `wait` are injected, so
// it is unit-testable with no real timers — and it is safe to repeat because the
// fold pass it drives is idempotent (an already-folded proposal writes nothing
// and makes no commit; nw-fleet-refold-clobbers-blessed). It never accepts:
// each tick folds as `review: proposed`; bless stays a human-gated pass. Runs
// `tick(n)` then waits `intervalMs` between ticks (not after the last), and
// re-checks `stop` before and after each tick so a signal between ticks ends it
// promptly. Returns the number of ticks run.
const defaultWait = (ms) => new Promise((r) => setTimeout(r, ms));
export async function watchLoop({ tick, intervalMs = 5000, stop = () => false, wait = defaultWait } = {}) {
  if (typeof tick !== "function") throw new Error("watchLoop needs a tick function");
  let n = 0;
  while (!stop()) {
    await tick(n);
    n++;
    if (stop()) break;
    await wait(intervalMs);
  }
  return n;
}

// The disposition pass (fleet-spec.md § Committer protocol, steps 7-8): the
// human has named a per-proposal decision; the deterministic writer executes
// exactly that subset. Each decision is { proposalId, decision: accepted|
// rejected, by, mode?, reason? }. One atomic field-only commit per dispositioned
// atom, so canonical never lands a half-flipped atom. A decision the writer
// cannot apply (unknown, already dispositioned) is set aside and the rest
// proceed. Returns { done, setAside }.
export function blessPass(fleet, decisions = [], { identity = {}, instanceSubdir = "", now = null } = {}) {
  const instanceDir = instanceSubdir ? join(fleet.canonicalPath, instanceSubdir) : fleet.canonicalPath;
  const done = [];
  const setAside = [];
  for (const d of decisions) {
    let result;
    try {
      result = decideAtom(instanceDir, fleet.canonicalPath, { ...d, now });
    } catch (e) {
      setAside.push({ proposalId: d.proposalId ?? null, reason: e.message });
      continue;
    }
    const verb = result.decision === "accepted" ? "bless" : "reject";
    const commit = commitAll(fleet.canonicalPath, `${verb}: ${result.ref}`, {
      name: identity.name,
      email: identity.email,
      signoff: true,
    });
    done.push({ ...result, commit });
  }
  return { done, setAside };
}
