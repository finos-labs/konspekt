// M8 — claims. A claim is advisory dispatch, expressed with NO new primitive:
// a proposer proposes a `status` transition on an already-accepted worked node,
// attributed to the acting agent (fleet-protocol.md § verb table / § Settled 1;
// fleet-spec.md § Claims). A `claim` opens work (`open -> active`); a `release`
// closes it (`active -> resolved | abandoned`) using the existing status verbs.
//
// Landing rule (settled this cut): a claim is committer-applied — advisory,
// non-locking, grow-only, visible to peers after the pass — because the store
// has no representation for a pending/un-applied status row (lib/conformance.mjs
// enforces node.status == the transition log's last `to`, and a contiguous
// `from` chain). A release is human-gated: it stays in the outbox unapplied (so
// no illegal pending row) and is applied in one transition only on accept.
//
// A claim request is one outbox directory `proposals/<id>/claim.json`; the id is
// the content address of the claim JSON. It carries no entity.md, so the entity
// read path (committer.readOutbox) skips it and this module reads it instead.

import { join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { computeSourceHash } from "./payload.mjs";
import { commitAll } from "./git.mjs";
import { splitEntityFile } from "../../../lib/conformance.mjs";

// The status a worked node must currently hold for each claim kind, and the
// status the kind moves it to (release names its own target: resolved|abandoned).
const CLAIM_FROM = { claim: "open", release: "active" };
const RELEASE_TARGETS = new Set(["resolved", "abandoned"]);

// Assemble a claim request. `kind` is "claim" (open -> active) or "release"
// (active -> resolved|abandoned); `to` is implied "active" for a claim and
// required for a release. Returns { claimId, claim }.
export function assembleClaim({ kind = "claim", node, to, agent, created } = {}) {
  if (kind !== "claim" && kind !== "release") throw new Error(`claim kind must be "claim" or "release", got "${kind}"`);
  if (!node) throw new Error("claim needs a node id");
  if (!agent) throw new Error("claim needs an agent handle");
  const target = kind === "claim" ? "active" : to;
  if (kind === "release" && !RELEASE_TARGETS.has(target)) {
    throw new Error(`release --to must be "resolved" or "abandoned", got "${target ?? "(none)"}"`);
  }
  const claim = { kind, node, from: CLAIM_FROM[kind], to: target, agent, created: created ?? new Date().toISOString() };
  const claimId = computeSourceHash(Buffer.from(JSON.stringify(claim), "utf8"));
  return { claimId, claim };
}

// Write and commit a claim request onto the proposer's own outbox branch.
export function writeClaimToOutbox(worktreePath, { claimId, claim }, { identity = {} } = {}) {
  const dir = join(worktreePath, "proposals", claimId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "claim.json"), JSON.stringify(claim, null, 2) + "\n", "utf8");
  const commit = commitAll(worktreePath, `outbox: ${claim.kind} ${claimId}`, {
    name: identity.name, email: identity.email, signoff: true,
  });
  return { claimId, dir, commit };
}

// Read the claim requests across every proposer outbox, tagged with owner/branch.
export function readClaimRequests(fleet) {
  const out = [];
  for (const p of fleet.proposers) {
    const base = join(p.path, "proposals");
    if (!existsSync(base)) continue;
    for (const id of readdirSync(base)) {
      const cp = join(base, id, "claim.json");
      if (!existsSync(cp)) continue;
      let claim;
      try { claim = JSON.parse(readFileSync(cp, "utf8")); } catch { claim = null; }
      out.push({ claimId: id, dir: join(base, id), owner: p.handle, branch: p.branch, claim });
    }
  }
  return out;
}

// Locate a node's stored file by id, scanning nodes/<type>/. Returns
// { relFile, absFile, front } or throws when the node is absent from canonical.
function findNode(instanceDir, id) {
  const nodesDir = join(instanceDir, "nodes");
  if (existsSync(nodesDir)) {
    for (const type of readdirSync(nodesDir)) {
      const abs = join(nodesDir, type, `${id}.md`);
      if (existsSync(abs)) {
        const front = splitEntityFile(readFileSync(abs, "utf8")).front;
        return { relFile: join("nodes", type, `${id}.md`), absFile: abs, front };
      }
    }
  }
  throw new Error(`worked node "${id}" is not on canonical`);
}

const txRow = (ref, field, from, to, ts, by) => `| ${ref} | ${field} | ${from} | ${to} | ${ts} |  | ${by} |`;

function appendTransition(instanceDir, row) {
  const path = join(instanceDir, "transitions", "transitions.md");
  let existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (existing.length && !existing.endsWith("\n")) existing += "\n";
  writeFileSync(path, existing + row + "\n", "utf8");
}

// Flip a node's frontmatter status in place (first top-level `status:` line) and
// append the matching transition row attributed to `by`. The caller has already
// checked the current status equals `from`, so the chain stays contiguous.
function applyStatus(instanceDir, relFile, nodeId, from, to, ts, by) {
  const abs = join(instanceDir, relFile);
  const text = readFileSync(abs, "utf8");
  const next = text.replace(new RegExp(`^status: ${from}$`, "m"), `status: ${to}`);
  if (next === text) throw new Error(`could not flip status ${from} -> ${to} on "${nodeId}"`);
  writeFileSync(abs, next, "utf8");
  appendTransition(instanceDir, txRow(`node:${nodeId}`, "status", from, to, ts, by));
}

// Apply the claim requests. A `claim` is applied immediately (committer-applied,
// attributed to the agent). A `release` is human-gated: it is reported in
// `pending` and NOT applied here. A request that fails verification (origin
// spoof, missing node, or a status that does not match the expected `from`) is
// set aside with a reason. Returns { applied, pending, setAside, commit }.
export function applyClaims(fleet, { instanceSubdir = "", now = null, identity = {} } = {}) {
  const instanceDir = instanceSubdir ? join(fleet.canonicalPath, instanceSubdir) : fleet.canonicalPath;
  const applied = [];
  const pending = [];
  const setAside = [];

  for (const req of readClaimRequests(fleet)) {
    try {
      if (!req.claim) throw new Error("claim.json is missing or unparseable");
      const owner = fleet.ownerOf(req.branch);
      if (req.claim.agent !== owner) {
        throw new Error(`claim origin "${req.claim.agent}" is not the branch owner "${owner ?? "(none)"}"`);
      }
      const kind = req.claim.kind;
      const expectedFrom = CLAIM_FROM[kind];
      if (!expectedFrom) throw new Error(`unknown claim kind "${kind}"`);
      const { relFile, front } = findNode(instanceDir, req.claim.node);
      if (front.status !== expectedFrom) {
        throw new Error(`node "${req.claim.node}" status is "${front.status}", expected "${expectedFrom}" for a ${kind}`);
      }
      if (kind === "release") { pending.push({ ...req }); continue; } // human-gated — applied on accept
      const ts = req.claim.created || now || new Date().toISOString();
      applyStatus(instanceDir, relFile, req.claim.node, expectedFrom, req.claim.to, ts, owner);
      applied.push({ claimId: req.claimId, node: req.claim.node, from: expectedFrom, to: req.claim.to, agent: owner });
    } catch (e) {
      setAside.push({ claimId: req.claimId, reason: e.message });
    }
  }

  let commit = null;
  if (applied.length) {
    commit = commitAll(fleet.canonicalPath, `claim: ${applied.length} applied`, {
      name: identity.name, email: identity.email, signoff: true,
    });
  }
  return { applied, pending, setAside, commit };
}
