#!/usr/bin/env node
// Committer / proposer CLI.
//
// Commands:
//   init       stand up the N+1 worktrees and write the manifest
//   propose    assemble, sign, and commit a proposal onto a proposer's outbox
//   run-pass   read the outboxes and report each proposal's verify verdict
//
// `run-pass` supports only --dry-run in this cut: it reads and reports, and does
// not fold (fold/bless are M5-M7). It is the committer side of the manual UAT
// (docs/DESIGN.md § Manual UAT checkpoint).

import { readFileSync } from "node:fs";
import { setupFleet, loadFleet } from "./worktrees.mjs";
import { assembleProposal, proposeToOutbox, renderEdgesBlock } from "./outbox.mjs";
import { verifyPass, foldPass, blessPass } from "./committer.mjs";
import { rebuildIndex } from "./proposed-ref.mjs";

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
  const root = need(args, "root");
  const agent = need(args, "agent");
  const spec = JSON.parse(readFileSync(need(args, "spec"), "utf8"));
  const source = readFileSync(need(args, "source"), "utf8");
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };

  const fleet = loadFleet(root);
  const proposer = fleet.proposerFor(agent);
  if (!proposer) throw new Error(`no proposer "${agent}" in ${root}`);

  const body = spec.body + (spec.edges ? "\n\n" + renderEdgesBlock(spec.edges) : "");
  const assembled = assembleProposal({
    kind: spec.kind ?? "entity",
    origin: { agent, model: spec.model ?? "unknown", session: spec.session ?? "cli" },
    scope: { entity_type: spec.entity_type, atom_state: spec.atom_state ?? "proposed" },
    target: { node: spec.target_node ?? "new" },
    dependsOn: spec.depends_on ?? [],
    confidence: spec.confidence,
    binding: spec.binding,
    claim: spec.claim ?? null,
    created: spec.created ?? new Date().toISOString(),
    body,
    source,
  });

  const { proposalId, commit } = proposeToOutbox(proposer.path, assembled, { identity });
  console.log(`proposed ${proposalId} by ${agent}`);
  console.log(`  committed ${commit} on ${proposer.branch}`);
}

function cmdRunPass(args) {
  const root = need(args, "root");
  const dryRun = Boolean(args["dry-run"]);
  const grants = args["grants"] ? JSON.parse(readFileSync(args["grants"], "utf8")) : {};
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : "";

  const fleet = loadFleet(root);

  // --dry-run reads and reports only; a live pass folds the verified set onto
  // canonical as review: proposed in one commit (bless is M7).
  const res = dryRun
    ? { verdicts: verifyPass(fleet, { grants }), folded: [], setAside: [], commit: null }
    : foldPass(fleet, { grants, identity, instanceSubdir });
  const { verdicts, folded, setAside, commit } = res;

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
    for (const s of setAside) console.log(`  not folded ${s.proposalId ? s.proposalId.slice(0, 12) : "(?)"}: ${s.reason}`);
    if (commit) console.log(`\nfolded ${folded.length} onto canonical in ${commit}`);
    else console.log(`\nnothing to fold`);
  }
}

function cmdBless(args) {
  const root = need(args, "root");
  const by = need(args, "by");
  const mode = args["mode"] && args["mode"] !== true ? args["mode"] : "inspection";
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : "";
  const identity = { name: args["name"] || undefined, email: args["email"] || undefined };

  // Accept ids from --accept a,b,c and reject ids from --reject x,y with --reason.
  const ids = (v) => (v && v !== true ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : []);
  const decisions = [
    ...ids(args["accept"]).map((proposalId) => ({ proposalId, decision: "accepted", by, mode })),
    ...ids(args["reject"]).map((proposalId) => ({ proposalId, decision: "rejected", by, reason: args["reason"] !== true ? args["reason"] : null })),
  ];
  if (decisions.length === 0) throw new Error("nothing to do: pass --accept and/or --reject with proposal ids");

  const { done, setAside } = blessPass(loadFleet(root), decisions, { identity, instanceSubdir });
  for (const d of done) console.log(`${d.decision === "accepted" ? "blessed" : "rejected"} ${d.ref}  (${d.proposalId.slice(0, 12)}) in ${d.commit}`);
  for (const s of setAside) console.log(`  not applied ${s.proposalId ? s.proposalId.slice(0, 12) : "(?)"}: ${s.reason}`);
}

function cmdRebuildIndex(args) {
  const root = need(args, "root");
  const instanceSubdir = args["instance-subdir"] && args["instance-subdir"] !== true ? args["instance-subdir"] : "";
  const index = rebuildIndex(root, { instanceSubdir });
  const c = index.counts;
  console.log(`rebuilt proposed index from canonical: ${c.total} proposal(s)`);
  console.log(`  pending ${c.pending}, accepted ${c.accepted}, rejected ${c.rejected}` +
    (c.missing ? `, missing ${c.missing}` : "") + (c.unknown ? `, unknown ${c.unknown}` : ""));
  for (const e of index.entries) {
    console.log(`  [${e.state.padEnd(8)}] ${e.proposalId.slice(0, 12)}  ${e.ref}  (${e.agent ?? "?"})`);
  }
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const args = parseArgs(argv.slice(1));
  try {
    if (command === "init") cmdInit(args);
    else if (command === "propose") cmdPropose(args);
    else if (command === "run-pass") cmdRunPass(args);
    else if (command === "bless") cmdBless(args);
    else if (command === "rebuild-index") cmdRebuildIndex(args);
    else {
      console.error("usage: cli.mjs <init|propose|run-pass|bless|rebuild-index> [--flags]");
      process.exit(2);
    }
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
}

main();
