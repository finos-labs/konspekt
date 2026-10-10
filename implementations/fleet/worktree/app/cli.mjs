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
import { verifyPass } from "./committer.mjs";

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

  const fleet = loadFleet(root);
  const verdicts = verifyPass(fleet, { grants });

  if (!dryRun) {
    console.log("note: fold/bless are not implemented in this cut; reporting verify only (same as --dry-run).");
  }
  console.log(`read ${verdicts.length} proposal(s) across ${fleet.proposers.length} outbox(es)\n`);

  let verified = 0;
  for (const v of verdicts) {
    const mark = v.ok ? "OK       " : "SET ASIDE";
    if (v.ok) verified++;
    console.log(`[${mark}] ${v.owner}  ${v.proposalId.slice(0, 12)}  (${v.branch})`);
    if (!v.ok) for (const r of v.reasons) console.log(`             - ${r}`);
  }
  console.log(`\n${verified}/${verdicts.length} verified; ${verdicts.length - verified} set aside.`);
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const args = parseArgs(argv.slice(1));
  try {
    if (command === "init") cmdInit(args);
    else if (command === "propose") cmdPropose(args);
    else if (command === "run-pass") cmdRunPass(args);
    else {
      console.error("usage: cli.mjs <init|propose|run-pass> [--flags]");
      process.exit(2);
    }
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
}

main();
