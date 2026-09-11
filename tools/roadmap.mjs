#!/usr/bin/env node
// konspekt roadmap — ROADMAP.md builder
//
// Emits the repo-root ROADMAP.md as a regenerated projection of the konspekt
// instance graph: goals (direction, with their "why") and the tasks that
// decompose from them, bucketed into a rough now / next / later horizon derived
// from each task's status and review. The graph stays the single source of
// truth; this file is a query over it, so the project's own roadmap demonstrates
// the standard (task-roadmap-generator, nw-roadmap-generation-coupled-to-authority).
//
// The graph reader, YAML-subset parser, and every conformance rule live in
// ../lib/conformance.mjs — the same neutral module validate.mjs and the visual
// snapshot import. This file adds no second parser (nw-derive-not-copy).
//
// Design commitments (mirroring visual/build/snapshot.mjs):
//   - Zero dependencies. Node only.
//   - Pure function of the instance. No wall-clock timestamp and no source
//     commit are baked in, so re-running on an unchanged instance produces a
//     byte-identical file. That purity is what makes the freshness gate below a
//     meaningful regenerate-and-diff (a wall-clock stamp would defeat it).
//
// Usage:
//   node tools/roadmap.mjs [instanceDir] [outFile]   write ROADMAP.md
//   node tools/roadmap.mjs --check [instanceDir] [outFile]
//                                                    regenerate in memory and
//                                                    diff against the committed
//                                                    file; exit 1 if stale.
//
//   defaults: instanceDir = ../.konspekt/instance (resolved from repo root)
//             outFile     = ../ROADMAP.md

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { loadInstance } from "../lib/conformance.mjs";
import { loadActivePersonas } from "../lib/load-personas.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const check = args.includes("--check");
const positional = args.filter((a) => !a.startsWith("--"));

const instanceDir = resolve(positional[0] || join(REPO_ROOT, ".konspekt", "instance"));
const outFile = resolve(positional[1] || join(REPO_ROOT, "ROADMAP.md"));
const FILENAME_RULE = process.env.KONSPEKT_FILENAME_RULE || "strict";

// ---- load the graph ----

const personas = await loadActivePersonas(instanceDir, join(REPO_ROOT, "spec", "personas"), {
  warn: (m) => console.error(`warning: ${m}`),
});
const g = loadInstance(instanceDir, { filenameRule: FILENAME_RULE, personas });

const byId = g.byId;
const goals = g.nodes.filter((n) => n.type === "goal");

// decomposes children, indexed by parent id. A goal decomposes into
// investigations and/or tasks; an investigation decomposes into tasks. Only the
// decomposes edge kind builds the vertical spine (as the visual explorer does).
const children = new Map();
for (const e of g.edges) {
  if (e.kind !== "decomposes") continue;
  if (!children.has(e.from.id)) children.set(e.from.id, []);
  children.get(e.from.id).push(e.to.id);
}

// Tasks reachable from a goal through decomposes (transitively via
// investigations). A task can sit under more than one goal; it then appears
// under each, which is faithful to the graph.
function reachableTasks(goalId) {
  const seen = new Set();
  const tasks = new Set();
  const stack = [...(children.get(goalId) || [])];
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    const node = byId.get(id);
    if (node && node.type === "task") tasks.add(id);
    for (const c of children.get(id) || []) stack.push(c);
  }
  return [...tasks].map((id) => byId.get(id)).filter(Boolean);
}

// Horizon buckets. Derived purely from graph fields so the file stays fresh by
// regeneration rather than hand-editing. abandoned tasks are omitted.
//   Now     — status active            (in progress)
//   Next    — status open, accepted    (committed and planned)
//   Later   — review proposed          (candidate direction, not yet committed)
//   Shipped — status resolved          (done)
// NOTE: this mapping is a first cut; the buckets are the open design point
// flagged with this task. Change only here.
function bucketOf(task) {
  if (task.review === "proposed") return "Later";
  if (task.status === "active") return "Now";
  if (task.status === "open") return "Next";
  if (task.status === "resolved") return "Shipped";
  return null; // abandoned or unknown → omitted
}
const BUCKET_ORDER = ["Now", "Next", "Later", "Shipped"];
const BUCKET_NOTE = {
  Now: "in progress",
  Next: "accepted and planned",
  Later: "proposed, not yet committed",
  Shipped: "resolved",
};

// First prose paragraph of a node body — the "why" for a goal. The stored body
// leads with its own "# Goal: …" heading, so skip any heading paragraphs and
// take the first that is real prose.
function firstParagraph(body) {
  if (!body) return "";
  for (const para of body.split(/\n\s*\n/)) {
    const text = para.replace(/\s+/g, " ").trim();
    if (text && !text.startsWith("#")) return text;
  }
  return "";
}

// Goals: accepted first, then proposed, each group by id, for a stable order.
const rank = (n) => (n.review === "accepted" ? 0 : 1);
const orderedGoals = goals
  .slice()
  .sort((a, b) => rank(a) - rank(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

// ---- render ----

const lines = [];
lines.push("# konspekt roadmap");
lines.push("");
lines.push(
  "konspekt's direction lives in its own graph: every goal and task below is a " +
  "node in `.konspekt/instance/`, and this file is a regenerated projection of " +
  "that graph — the project's roadmap is a query over its own record. Per-item " +
  "work status lives in the graph and in GitHub issues, not here."
);
lines.push("");
lines.push(
  "Horizon: **Now** — in progress · **Next** — accepted and planned · " +
  "**Later** — proposed, not yet committed · **Shipped** — resolved."
);
lines.push("");

let taskCount = 0;
for (const goal of orderedGoals) {
  const suffix = goal.review === "accepted" ? "" : " _(proposed)_";
  lines.push(`## ${goal.title || goal.id}${suffix}`);
  lines.push("");
  const why = firstParagraph(goal.body);
  if (why) {
    lines.push(why);
    lines.push("");
  }

  const tasks = reachableTasks(goal.id);
  const buckets = new Map(BUCKET_ORDER.map((b) => [b, []]));
  for (const t of tasks) {
    const b = bucketOf(t);
    if (b) buckets.get(b).push(t);
  }
  let any = false;
  for (const b of BUCKET_ORDER) {
    const items = buckets.get(b).sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
    if (!items.length) continue;
    any = true;
    lines.push(`**${b}** — _${BUCKET_NOTE[b]}_`);
    lines.push("");
    for (const t of items) {
      taskCount++;
      lines.push(`- ${t.title || t.id}`);
    }
    lines.push("");
  }
  if (!any) {
    lines.push("_No tasks decomposed yet._");
    lines.push("");
  }
}

lines.push("---");
lines.push("");
lines.push(
  `Generated from ${orderedGoals.length} goal(s) and ${taskCount} task-listing(s) ` +
  "over the instance graph."
);
lines.push("");

const bodyText = lines.join("\n");
const contentHash =
  "sha256:" + createHash("sha256").update(bodyText).digest("hex").slice(0, 16);

const banner =
  "<!-- AUTOGENERATED by tools/roadmap.mjs — do not edit by hand.\n" +
  "     Regenerate with:      node tools/roadmap.mjs\n" +
  "     Check freshness with: node tools/roadmap.mjs --check\n" +
  "     This file is a pure function of .konspekt/instance/ (no timestamps baked in).\n" +
  "     Goals and tasks are graph nodes; the horizon is derived from node status/review.\n" +
  `     contentHash: ${contentHash} -->\n`;

const fileText = banner + "\n" + bodyText;

// ---- write or check ----

if (check) {
  if (!existsSync(outFile)) {
    console.error(`roadmap --check: ${outFile} does not exist. Run: node tools/roadmap.mjs`);
    process.exit(1);
  }
  const committed = readFileSync(outFile, "utf8");
  if (committed === fileText) {
    console.log(`roadmap --check: ${outFile} is up to date (${contentHash}).`);
    process.exit(0);
  }
  console.error(
    `roadmap --check: ${outFile} is stale — it does not match the current graph.\n` +
    "Regenerate and commit it:  node tools/roadmap.mjs"
  );
  process.exit(1);
}

writeFileSync(outFile, fileText);
console.log(`wrote ${outFile}`);
console.log(`  goals: ${orderedGoals.length}  task-listings: ${taskCount}  ${contentHash}`);
