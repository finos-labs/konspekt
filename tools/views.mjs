#!/usr/bin/env node
// konspekt — derived-view CLI
//
// A thin renderer over lib/views.mjs. It loads the instance the same way
// tools/roadmap.mjs does (loadActivePersonas + loadInstance) and prints one of
// the two views as a dependency-driven table, or as JSON for machine use. The
// view logic lives in lib/views.mjs; this file only loads and formats.
//
// Usage:
//   node tools/views.mjs goal <goalId> [--json] [instanceDir]
//   node tools/views.mjs provenance <entityId> [--json] [instanceDir]
//
//   node tools/views.mjs goal goal-portability
//   node tools/views.mjs provenance nw-node-status-does-transition --json
//
// <id> may be given bare (goal-portability) or typed (node:goal-portability).
// KONSPEKT_FILENAME_RULE is honored, matching the other tools.

import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadInstance } from "../lib/conformance.mjs";
import { loadActivePersonas } from "../lib/load-personas.mjs";
import { goalState, provenanceChain } from "../lib/views.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const json = args.includes("--json");
const positional = args.filter((a) => !a.startsWith("--"));
const [view, ref, dirArg] = positional;

const ALIASES = { goal: "goal", "goal-state": "goal", prov: "provenance", provenance: "provenance" };
const chosen = ALIASES[view];

if (!chosen || !ref) {
  console.error("usage:\n" +
    "  node tools/views.mjs goal <goalId> [--json] [instanceDir]\n" +
    "  node tools/views.mjs provenance <entityId> [--json] [instanceDir]");
  process.exit(2);
}

const instanceDir = resolve(dirArg || join(REPO_ROOT, ".konspekt", "instance"));
const sourcesDir = join(instanceDir, "sources");
const FILENAME_RULE = process.env.KONSPEKT_FILENAME_RULE || "strict";

const personas = await loadActivePersonas(instanceDir, join(REPO_ROOT, "spec", "personas"), {
  warn: (m) => console.error(`warning: ${m}`),
});
const g = loadInstance(instanceDir, { filenameRule: FILENAME_RULE, personas });

const pad = (s, n) => String(s ?? "").padEnd(n);
const V = { true: "ok", false: "FAIL", null: "-" };

try {
  if (chosen === "goal") {
    const r = goalState(g, ref);
    if (json) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
    const root = r.root;
    console.log(`\nGoal state — ${root.id}  [${root.status ?? "?"}]${root.title ? "  " + root.title : ""}`);
    console.log("-".repeat(72));
    console.log(`${pad("STATUS", 10)}${pad("TYPE", 15)}${pad("REVIEW", 10)}NODE`);
    for (const n of r.nodes) {
      const indent = "  ".repeat(n.depth);
      const flags = [];
      if (n.produces) flags.push(`${n.produces}▸artifact`);
      if (n.notes) flags.push(`${n.notes}▸notes`);
      if (n.openAssumptions) flags.push(`${n.openAssumptions}▸open-asm`);
      if (n.parents.length > 1) flags.push(`parents:${n.parents.length}`);
      if (n.missing) flags.push("MISSING");
      const tail = flags.length ? `   (${flags.join(", ")})` : "";
      console.log(`${pad(n.status, 10)}${pad(n.type, 15)}${pad(n.review, 10)}${indent}${n.id}${tail}`);
    }
    console.log("-".repeat(72));
    const s = r.rollup;
    const st = Object.entries(s.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ");
    console.log(`${s.total} descendant nodes   ${st}`);
    console.log(`proposed ${s.proposed} · open assumptions ${s.openAssumptions}\n`);
  } else {
    const r = provenanceChain(g, ref, { sourcesDir });
    if (json) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
    const e = r.entity;
    const head = r.current ? "current" : `superseded by ${r.supersededBy.join(", ")}`;
    console.log(`\nProvenance chain — ${e.id}  (${e.entityType}${e.kind ? "/" + e.kind : ""}${e.subtype ? "/" + e.subtype : ""})  [${head}]`);
    console.log("-".repeat(72));
    r.chain.forEach((c, i) => {
      const arrow = i === 0 ? "●" : "└▸ supersedes";
      const v = c.verify;
      const vtxt = v.mode === "content-addressed" ? `verify:${V[String(v.ok)]}` : `verify:${v.mode}`;
      console.log(`${arrow} ${c.id}  [${c.review ?? "?"}]  ${vtxt}  ${c.timestamp ?? ""}`);
      console.log(`     ${v.detail}`);
    });
    if (r.executed) {
      console.log("-".repeat(72));
      console.log("executed (who-did-what):");
      for (const x of r.executed) console.log(`  ${x.command}  [${x.review ?? "?"}]`);
    }
    if (r.drivenBy) {
      console.log(`driven by (ASR forces): ${r.drivenBy.join(", ")}`);
    }
    console.log("");
  }
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}
