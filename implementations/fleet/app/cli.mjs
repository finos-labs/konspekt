#!/usr/bin/env node
// Committer / proposer CLI.
//
// Commands:
//   init       stand up a throwaway N+1 store and write the flat manifest (legacy)
//   setup      stand up outbox worktrees from the committed canonical config
//   doctor     check acceptance authority + canonical-branch match, standing nothing up
//   teardown   remove the proposer worktrees (keeps canonical + branches)
//   propose    assemble, sign, and commit a proposal onto a proposer's outbox
//   run-pass   verify the outboxes and, live, fold the verified set onto canonical
//   bless      apply the human's per-proposal accept/reject decisions
//   rebuild-index  rebuild the derived proposed index from canonical
//
// Attach model: config-driven commands take `--canonical <path>` and read the
// committed `.konspekt/fleet/config/fleet.json` (no hand-written manifest;
// task-fleet-config-driven-setup). The legacy flat path takes `--root <dir>`
// and reads `<root>/fleet.json` written by `init`.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { setupFleet, loadFleet, setupFromConfig, loadFromConfig, teardownFleet, readFleetConfig } from "./worktrees.mjs";
import { assembleProposal, proposeToOutbox } from "./outbox.mjs";
import { verifyPass, foldPass, blessPass } from "./committer.mjs";
import { assembleClaim, writeClaimToOutbox, readClaimRequests, applyClaims, acceptRelease } from "./claims.mjs";
import { rebuildIndex } from "./proposed-ref.mjs";
import { reviewDigest, renderReviewPrompt } from "./review-assistant.mjs";
import { authorityPreflight, canonicalBranchCheck, DEFAULT_INSTANCE_SUBDIR } from "./preflight.mjs";

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) out[key] = true;
      else { out[key] = next; i++; }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function need(args, key) {
  if (args[key] === undefined || args[key] === true) {
    throw new Error(`missing --${key}`);
  }
  return args[key];
}

// Attach to a fleet for a read/write command. Prefers config-driven attach from
// a committed `.konspekt/fleet/config/fleet.json` when `--canonical <path>` is
// given (no hand-written manifest, grants read from config); otherwise falls
// back to the flat `--root/fleet.json` manifest with grants from `--grants`.
// Returns { fleet, grants }.
function attach(args) {
  if (args["canonical"] && args["canonical"] !== true) {
    const canonicalPath = resolve(args["canonical"]);
    const configRel = args["config"] && args["config"] !== true ? args["config"] : undefined;
    const { fleet, grants } = loadFromConfig({ canonicalPath, configRel });
    return { fleet, grants };
  }
  const fleet = loadFleet(need(args, "root"));
  const grants = args["grants"] ? JSON.parse(readFileSync(args["grants"], "utf8")) : {};
  return { fleet, grants };
}

// Config-driven setup: stand up one outbox worktree per agent from the committed
// config on the canonical worktree. No --proposers, no hand-written manifest.
function cmdSetup(args) {
  const canonicalPath = resolve(need(args, "canonical"));
  const worktreeDir = args["worktree-dir"] && args["worktree-dir"] !== true ? resolve(args["worktree-dir"]) : undefined;
  const configRel = args["config"] && args["config"] !== true ? args["config"] : undefined;
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : DEFAULT_INSTANCE_SUBDIR;

  // Acceptance-authority preflight is a BLOCKING precondition of setup: refuse
  // to stand up worktrees for a fleet that cannot attributably accept what its
  // proposers fold (task-agent-fleet). `doctor` runs the same check on demand.
  const pf = authorityPreflight({ canonicalPath, instanceSubdir });
  if (!pf.ok) {
    throw new Error(
      `acceptance-authority preflight failed; not standing up the fleet:\n` +
        pf.problems.map((p) => `  - ${p}`).join("\n") +
        `\nRun \`cli.mjs doctor --canonical <path>\` after fixing to re-check.`,
    );
  }

  const { descriptor } = setupFromConfig({ canonicalPath, worktreeDir, configRel });
  console.log(`set up fleet from config at ${canonicalPath}`);
  console.log(`  acceptance authority: ${pf.principal} (granted: ${pf.acceptors.join(", ")})`);
  console.log(`  canonical branch: ${descriptor.canonicalBranch}`);
  for (const p of descriptor.proposers) console.log(`  proposer ${p.handle}: ${p.path} (branch ${p.branch})`);
}

// Read-only fleet readiness check. Runs the same acceptance-authority preflight
// `setup` blocks on, plus (when a fleet config exists) asserts the canonical
// worktree is on the branch the config declares — all without standing anything
// up, so an adopter can verify (from the acceptance client's own shell) that the
// instance declares an authority, KONSPEKT_PRINCIPAL is configured, and folds
// would land on the intended branch. Exits non-zero when the fleet is not ready.
function cmdDoctor(args) {
  const canonicalPath = resolve(need(args, "canonical"));
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : DEFAULT_INSTANCE_SUBDIR;
  const configRel = args["config"] && args["config"] !== true ? args["config"] : undefined;
  const pf = authorityPreflight({ canonicalPath, instanceSubdir });

  // Also assert the canonical worktree is on the branch the config declares, so
  // a silent config/worktree branch disagreement fails loudly here rather than
  // folding onto the wrong branch (nw-fleet-fold-follows-worktree-branch). Only
  // when a fleet config exists — authority is doctor's core check regardless.
  let bc = null;
  try {
    const cfg = readFleetConfig(canonicalPath, { configRel });
    bc = canonicalBranchCheck({ canonicalPath, configuredBranch: cfg.canonicalBranch });
  } catch {
    // no config (or unreadable): skip the branch check, keep the authority verdict.
  }

  if (pf.ok && (!bc || bc.ok)) {
    console.log(`acceptance authority OK at ${canonicalPath}`);
    console.log(`  KONSPEKT_PRINCIPAL=${pf.principal} holds an accept grant (granted: ${pf.acceptors.join(", ")})`);
    if (bc) console.log(`  canonical worktree on branch "${bc.actual}" matches config canonicalBranch`);
    return;
  }
  console.error(`fleet doctor FAILED at ${canonicalPath}:`);
  for (const p of pf.problems) console.error(`  - ${p}`);
  if (bc && !bc.ok) console.error(`  - ${bc.problem}`);
  process.exitCode = 1;
}

// Remove the proposer worktrees (keeps canonical, the object store, and the
// outbox branches). Attaches the same way as the read/write commands.
function cmdTeardown(args) {
  const { fleet } = attach(args);
  teardownFleet(fleet, { force: Boolean(args["force"]) });
  console.log(`tore down ${fleet.proposers.length} proposer worktree(s)`);
  for (const p of fleet.proposers) console.log(`  removed ${p.path} (branch ${p.branch} kept)`);
}

function cmdInit(args) {
  const root = need(args, "root");
  const proposers = String(need(args, "proposers")).split(",").map((s) => s.trim()).filter(Boolean);
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };
  const f = setupFleet({ root, proposers, identity });
  console.log(`initialized fleet at ${root}`);
  console.log(`  canonical: ${f.canonicalPath} (branch ${f.canonicalBranch})`);
  for (const p of f.proposers) console.log(`  proposer ${p.handle}: ${p.path} (branch ${p.branch})`);
}

function cmdPropose(args) {
  const agent = need(args, "agent");
  const specPath = need(args, "spec");
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  const source = readFileSync(need(args, "source"), "utf8");
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };

  const { fleet } = attach(args);
  const proposer = fleet.proposerFor(agent);
  if (!proposer) throw new Error(`no proposer "${agent}" in the fleet`);

  // The proposer authors the stored-form atom: a type-specific fence (without
  // review/provenance, which assembleProposal renders) and the prose body. It
  // provides them inline (`fence`, `prose`) or from files (`fence_file`,
  // `prose_file`), resolved relative to the spec.
  const readRel = (p) => readFileSync(resolve(dirname(specPath), p), "utf8");
  let fence = spec.fence;
  if (fence === undefined && spec.fence_file) fence = readRel(spec.fence_file);
  if (fence === undefined) throw new Error("spec needs `fence` or `fence_file`");
  let prose = spec.prose;
  if (prose === undefined && spec.prose_file) prose = readRel(spec.prose_file);

  const assembled = assembleProposal({
    entityType: spec.entity_type,
    fence,
    prose: prose ?? "",
    confidence: spec.confidence,
    conversationId: spec.session ?? spec.conversationId,
    timestamp: spec.timestamp ?? spec.created ?? new Date().toISOString(),
    origin: { agent, model: spec.model ?? "unknown", session: spec.session ?? "cli" },
    binding: spec.binding,
    dependsOn: spec.depends_on ?? [],
    edges: spec.edges ?? [],
    source,
  });

  const { proposalId, commit } = proposeToOutbox(proposer.path, assembled, { identity });
  console.log(`proposed ${proposalId} by ${agent}`);
  console.log(`  committed ${commit} on ${proposer.branch}`);
}

// Author a claim (advisory dispatch): propose `status: open -> active` on an
// already-accepted worked node, onto the agent's own outbox (M8). The committer
// applies it on the next `run-pass`.
function cmdClaim(args) {
  const agent = need(args, "agent");
  const node = need(args, "node");
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };
  const { fleet } = attach(args);
  const proposer = fleet.proposerFor(agent);
  if (!proposer) throw new Error(`no proposer "${agent}" in the fleet`);
  const created = args["now"] && args["now"] !== true ? args["now"] : undefined;
  const { claimId, claim } = assembleClaim({ kind: "claim", node, agent, created });
  const { commit } = writeClaimToOutbox(proposer.path, { claimId, claim }, { identity });
  console.log(`claimed ${node} (open -> active) by ${agent}`);
  console.log(`  committed ${commit} on ${proposer.branch} as ${claimId.slice(0, 12)}`);
}

// Author a release (close a claim): propose `status: active -> resolved|abandoned`
// on the worked node. Unlike a claim it is human-gated — run-pass reports it
// pending; the human applies it with `accept-release`.
function cmdRelease(args) {
  const agent = need(args, "agent");
  const node = need(args, "node");
  const to = need(args, "to");
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };
  const { fleet } = attach(args);
  const proposer = fleet.proposerFor(agent);
  if (!proposer) throw new Error(`no proposer "${agent}" in the fleet`);
  const created = args["now"] && args["now"] !== true ? args["now"] : undefined;
  const { claimId, claim } = assembleClaim({ kind: "release", node, to, agent, created });
  const { commit } = writeClaimToOutbox(proposer.path, { claimId, claim }, { identity });
  console.log(`release proposed ${node} (active -> ${to}) by ${agent}; awaiting accept`);
  console.log(`  committed ${commit} on ${proposer.branch} as ${claimId.slice(0, 12)}`);
}

// Human accept of a pending release: the committer applies the node status
// transition attributed to the acceptor.
function cmdAcceptRelease(args) {
  const by = need(args, "by");
  const claimId = need(args, "claim");
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : "";
  const now = args["now"] && args["now"] !== true ? args["now"] : null;
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };
  const { fleet } = attach(args);
  const r = acceptRelease(fleet, { claimId, by, instanceSubdir, now, identity });
  console.log(`released ${r.node} -> ${r.to} by ${r.by} in ${r.commit}`);
}

function cmdRunPass(args) {
  const dryRun = Boolean(args["dry-run"]);
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : "";

  const { fleet, grants } = attach(args);

  // Refuse if the canonical worktree has drifted off the branch the fleet
  // records as canonical: folds follow the worktree's current branch, so a
  // mismatch would land them on the wrong branch (nw-fleet-fold-follows-worktree-branch).
  // Blocks the dry-run too — you want the mismatch before, not after, a live pass.
  const bc = canonicalBranchCheck({ canonicalPath: fleet.canonicalPath, configuredBranch: fleet.canonicalBranch });
  if (!bc.ok) {
    throw new Error(
      `${bc.problem}\nRun \`cli.mjs doctor --canonical <path>\` after fixing to re-check.`,
    );
  }

  // --dry-run reads and reports only; a live pass folds the verified set onto
  // canonical as review: proposed in one commit (bless is M7).
  const res = dryRun
    ? { verdicts: verifyPass(fleet, { grants }), folded: [], alreadyFolded: [], setAside: [], commit: null }
    : foldPass(fleet, { grants, identity, instanceSubdir });
  const { verdicts, folded, alreadyFolded = [], setAside, commit } = res;

  console.log(`read ${verdicts.length} proposal(s) across ${fleet.proposers.length} outbox(es)\n`);

  let verified = 0;
  for (const v of verdicts) {
    const mark = v.ok ? "OK       " : "SET ASIDE";
    if (v.ok) verified++;
    console.log(`[${mark}] ${v.owner}  ${v.proposalId.slice(0, 12)}  (${v.branch})`);
    if (!v.ok) for (const r of v.reasons) console.log(`             - ${r}`);
  }
  console.log(`\n${verified}/${verdicts.length} verified; ${verdicts.length - verified} set aside.`);

  if (!dryRun) {
    for (const f of folded) console.log(`  folded ${f.entityType} ${f.entityId}  <- ${f.proposalId.slice(0, 12)}`);
    for (const a of alreadyFolded) console.log(`  ALREADY FOLDED ${a.entityType} ${a.entityId}  <- ${a.proposalId ? a.proposalId.slice(0, 12) : "(?)"}`);
    for (const s of setAside) console.log(`  not folded ${s.proposalId ? s.proposalId.slice(0, 12) : "(?)"}: ${s.reason}`);
    if (commit) console.log(`\nfolded ${folded.length} onto canonical in ${commit}`);
    else console.log(`\nnothing to fold${alreadyFolded.length ? ` (${alreadyFolded.length} already folded)` : ""}`);
  }

  // Claims (M8): a claim is committer-applied status dispatch; a release is
  // human-gated and only reported here. A dry-run reads and reports, applying
  // nothing.
  const claimReqs = readClaimRequests(fleet);
  if (dryRun) {
    for (const r of claimReqs) console.log(`  claim (dry) ${r.claim?.kind ?? "?"} ${r.claim?.node ?? "?"} by ${r.owner}`);
  } else if (claimReqs.length) {
    const cp = applyClaims(fleet, { instanceSubdir, identity });
    for (const a of cp.applied) console.log(`  claimed ${a.node} (${a.from} -> ${a.to}) by ${a.agent}`);
    for (const p of cp.pending) console.log(`  release pending (needs human accept): ${p.claim?.node} -> ${p.claim?.to} by ${p.owner}`);
    for (const s of cp.setAside) console.log(`  claim set aside ${s.claimId.slice(0, 12)}: ${s.reason}`);
    if (cp.commit) console.log(`\napplied ${cp.applied.length} claim(s) in ${cp.commit}`);
  }
}

function cmdBless(args) {
  const by = need(args, "by");
  const mode = args["mode"] && args["mode"] !== true ? args["mode"] : "inspection";
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : "";
  const now = args["now"] && args["now"] !== true ? args["now"] : null;
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };

  // Accept ids from --accept a,b,c and reject ids from --reject x,y with --reason.
  const ids = (v) => (v && v !== true ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : []);
  const decisions = [
    ...ids(args["accept"]).map((proposalId) => ({ proposalId, decision: "accepted", by, mode })),
    ...ids(args["reject"]).map((proposalId) => ({ proposalId, decision: "rejected", by, reason: args["reason"] !== true ? args["reason"] : null })),
  ];
  if (decisions.length === 0) throw new Error("nothing to do: pass --accept and/or --reject with proposal ids");

  const { fleet } = attach(args);
  const { done, setAside } = blessPass(fleet, decisions, { identity, instanceSubdir, now });
  for (const d of done) console.log(`${d.decision === "accepted" ? "blessed" : "rejected"} ${d.ref}  (${d.proposalId.slice(0, 12)}) in ${d.commit}`);
  for (const s of setAside) console.log(`  not applied ${s.proposalId ? s.proposalId.slice(0, 12) : "(?)"}: ${s.reason}`);
}

function cmdRebuildIndex(args) {
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : "";
  // The fleet log and instance live in the canonical worktree, not the fleet
  // root; resolve it the same way run-pass and bless do.
  const { fleet } = attach(args);
  const index = rebuildIndex(fleet.canonicalPath, { instanceSubdir });
  const c = index.counts;
  console.log(`rebuilt proposed index from canonical: ${c.total} proposal(s)`);
  console.log(`  pending ${c.pending}, accepted ${c.accepted}, rejected ${c.rejected}` +
    (c.missing ? `, missing ${c.missing}` : "") + (c.unknown ? `, unknown ${c.unknown}` : ""));
  for (const e of index.entries) {
    console.log(`  [${e.state.padEnd(8)}] ${e.proposalId.slice(0, 12)}  ${e.ref}  (${e.agent ?? "?"})`);
  }
}

// The read-only review-assistant seam (M9): present the pending queue to the
// human, lowest-confidence first, with near-duplicate hints. Writes nothing and
// calls no model.
function cmdReview(args) {
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : "";
  const { fleet } = attach(args);
  const digest = reviewDigest(fleet.canonicalPath, { instanceSubdir });
  console.log(renderReviewPrompt(digest));
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const args = parseArgs(argv.slice(1));
  try {
    if (command === "init") cmdInit(args);
    else if (command === "setup") cmdSetup(args);
    else if (command === "doctor") cmdDoctor(args);
    else if (command === "teardown") cmdTeardown(args);
    else if (command === "propose") cmdPropose(args);
    else if (command === "claim") cmdClaim(args);
    else if (command === "release") cmdRelease(args);
    else if (command === "accept-release") cmdAcceptRelease(args);
    else if (command === "run-pass") cmdRunPass(args);
    else if (command === "review") cmdReview(args);
    else if (command === "bless") cmdBless(args);
    else if (command === "rebuild-index") cmdRebuildIndex(args);
    else {
      console.error("usage: cli.mjs <init|setup|doctor|teardown|propose|claim|release|accept-release|run-pass|review|bless|rebuild-index> [--flags]");
      console.error("  config-driven commands take --canonical <path> (reads .konspekt/fleet/config/fleet.json);");
      console.error("  the flat manifest path takes --root <dir> (legacy).");
      process.exit(2);
    }
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
}

main();
