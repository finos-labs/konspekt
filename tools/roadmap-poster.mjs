#!/usr/bin/env node
// konspekt roadmap poster — docs/visuals/posters/konspekt-roadmap-poster.html builder
//
// Emits the roadmap poster as a generated projection of the konspekt instance
// graph. Unlike tools/roadmap.mjs (which lists every goal and task), this poster
// is a CURATED SUBSET: a hand-composed selection of goals and representative
// tasks, with bespoke SVG placement and editorial prose. A full projection would
// bloat the poster, so the generator is a pure function of
//   (graph)  ×  (the EDITORIAL map defined below).
//
// What makes it "generated from the graph" is the binding + freshness guard:
// every goal id and every selected task id in the EDITORIAL map is resolved
// against loadInstance(); a selected task must exist, be a task, not be
// abandoned, and be reachable from its goal through decomposes edges (the same
// transitive walk tools/roadmap.mjs uses). If a curated task is renamed, removed,
// abandoned, or detached from its goal in the graph, generation FAILS — that is
// the drift the freshness gate catches. New graph tasks do NOT auto-appear here;
// the selection stays curated by design.
//
// The poster's short goal labels ("Collaboration") are editorial display names,
// intentionally distinct from the graph goal titles (which are full sentences,
// e.g. "Share authorship across a team"). The generator therefore validates goal
// id EXISTENCE rather than splicing the long title into the masthead, which would
// break the layout.
//
// Design commitments (mirroring tools/roadmap.mjs and visual/build/snapshot.mjs):
//   - Zero dependencies. Node only.
//   - Pure function of the instance and the editorial map. No wall-clock and no
//     source commit are baked in, so re-running over an unchanged instance yields
//     a byte-identical file — which is what makes the --check gate a meaningful
//     regenerate-and-diff.
//
// Usage:
//   node tools/roadmap-poster.mjs [instanceDir] [outFile]   write the poster
//   node tools/roadmap-poster.mjs --check [instanceDir] [outFile]
//                                                    regenerate in memory and
//                                                    diff against the committed
//                                                    file; exit 1 if stale.
//
//   defaults: instanceDir = ../.konspekt/instance (resolved from repo root)
//             outFile     = ../docs/visuals/posters/konspekt-roadmap-poster.html

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
const outFile = resolve(
  positional[1] || join(REPO_ROOT, "docs", "visuals", "posters", "konspekt-roadmap-poster.html")
);
const FILENAME_RULE = process.env.KONSPEKT_FILENAME_RULE || "strict";

// ---- editorial map ----
// The curated poster content. Rendering is driven entirely by this map; the
// graph is the authority the map is validated against (see checkAgainstGraph).
// Goals are listed in the theme-section reading order (collab, observ, portab,
// account); the SVG hubs iterate the same array.

const GOALS = [
  {
    id: "goal-collaboration", cls: "c-collab", color: "#f2b45c", display: "Collaboration",
    hub: { x: 300, y: 140 }, labelY: 112, subY: 128,
    aim: "Work a project as a team, people and agents together, without weakening the propose→accept rule.",
    boundary: null,
    tasks: [
      { id: "task-multi-author-review", label: "Multi-author review", anchor: "end", node: { x: 165, y: 95 },
        desc: "Several people propose on one project. Who can accept is named in the project config, so authority stays put when the host changes." },
      { id: "task-agent-fleet", label: "Agent fleet", anchor: "end", node: { x: 165, y: 205 },
        desc: "One reviewer over many proposing agents, each proposal tagged with the model that produced it." },
    ],
  },
  {
    id: "goal-observability", cls: "c-observ", color: "#54c7d8", display: "Observability",
    hub: { x: 700, y: 140 }, labelY: 112, subY: 128,
    aim: "See the state and history of a project through queries over the graph, run as projections that add nothing back.",
    boundary: null,
    tasks: [
      { id: "task-graph-analytics", label: "Graph analytics", anchor: "start", node: { x: 835, y: 95 },
        desc: "Measure the record: how connected it is, how deep its sources run, how many proposals never landed." },
      { id: "task-realtime-monitoring", label: "Real-time monitoring", anchor: "start", node: { x: 835, y: 205 },
        desc: "Watch decisions change as they happen, a standing view rather than an on-demand report." },
    ],
  },
  {
    id: "goal-portability", cls: "c-portab", color: "#87d7a3", display: "Portability",
    hub: { x: 700, y: 430 }, labelY: 462, subY: 478,
    aim: "Move between tools without lock-in. The record is the same wherever it lives.",
    boundary: null,
    tasks: [
      { id: "task-enterprise-persistence", label: "Enterprise persistence", anchor: "start", node: { x: 835, y: 470 },
        desc: "Run on a database or object store instead of git, behind one storage interface, with identical content addresses so migration is a re-hash check." },
    ],
  },
  {
    id: "goal-accountability", cls: "c-account", color: "#e78cb2", display: "Accountability",
    hub: { x: 300, y: 430 }, labelY: 462, subY: 478,
    aim: "Answer who is responsible. The law decides responsibility; konspekt makes the underlying facts answerable with evidence.",
    boundary: '<div class="boundary"><b>Boundary.</b> konspekt records what a handle did, unaltered. Tying a handle to a real person, and any AI output that never enters the graph, are out of scope, with the signing key named as the plug-in point.</div>',
    tasks: [
      { id: "task-accountability-report", label: "Responsibility report", anchor: "end", node: { x: 165, y: 348 },
        desc: "For any accepted decision, the full chain: what was proposed, by which AI, who accepted, and when." },
      { id: "task-signed-accepts", label: "Signed accepts", anchor: "end", node: { x: 165, y: 412 },
        desc: "Optionally require a maintainer's acceptance to be signed. Off by default, on where the legally-bound role is assigned." },
      { id: "task-persona-change-gate", label: "Protected role change", anchor: "end", node: { x: 165, y: 476 },
        desc: "Changing who carries legal weight is the most guarded action, gated by the bound maintainers themselves." },
      { id: "task-authority-mechanism", label: "Richer authority model", anchor: "end", node: { x: 180, y: 540 },
        desc: "Richer authority for more than one acceptor: designated approver, consensus syndicate, or non-human acceptor." },
    ],
  },
];

// ---- load the graph ----

const personas = await loadActivePersonas(instanceDir, join(REPO_ROOT, "spec", "personas"), {
  warn: (m) => console.error(`warning: ${m}`),
});
const g = loadInstance(instanceDir, { filenameRule: FILENAME_RULE, personas });
const byId = g.byId;

// decomposes children, indexed by parent id (goal -> investigation/task -> task).
const children = new Map();
for (const e of g.edges) {
  if (e.kind !== "decomposes") continue;
  if (!children.has(e.from.id)) children.set(e.from.id, []);
  children.get(e.from.id).push(e.to.id);
}
function reachableTaskIds(goalId) {
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
  return tasks;
}

// ---- freshness guard: the editorial map must still fit the graph ----

function checkAgainstGraph() {
  const errs = [];
  for (const goal of GOALS) {
    const gnode = byId.get(goal.id);
    if (!gnode || gnode.type !== "goal") {
      errs.push(`goal "${goal.id}" is not a goal node in the graph`);
      continue;
    }
    const reach = reachableTaskIds(goal.id);
    for (const t of goal.tasks) {
      const n = byId.get(t.id);
      if (!n) { errs.push(`task "${t.id}" (under ${goal.id}) does not exist in the graph`); continue; }
      if (n.type !== "task") { errs.push(`"${t.id}" is a ${n.type}, not a task`); continue; }
      if (n.status === "abandoned") { errs.push(`task "${t.id}" is abandoned; remove it from the poster`); continue; }
      if (!reach.has(t.id)) { errs.push(`task "${t.id}" is not reachable from ${goal.id} via decomposes`); continue; }
    }
  }
  if (errs.length) {
    console.error("roadmap-poster: the poster no longer matches the graph:\n  - " + errs.join("\n  - "));
    console.error("Update the editorial map in tools/roadmap-poster.mjs, then regenerate.");
    process.exit(1);
  }
}
checkAgainstGraph();

// ---- render ----

const labelX = (t) => (t.anchor === "end" ? t.node.x - 13 : t.node.x + 13);
const labelY = (t) => t.node.y + 4;

const svgEdges = GOALS.map((goal) => {
  const paths = goal.tasks
    .map((t) => `        <path d="M${goal.hub.x},${goal.hub.y} L${t.node.x},${t.node.y}" stroke="${goal.color}"/>`)
    .join("\n");
  return `        <!-- ${goal.display.toLowerCase()} -->\n${paths}`;
}).join("\n");

const svgNodes = GOALS.map((goal) => {
  const circles = goal.tasks
    .map((t) => `        <circle cx="${t.node.x}" cy="${t.node.y}" r="4.5" fill="#0b1424" stroke="${goal.color}" stroke-width="1.6"/>`)
    .join("\n");
  const labels = goal.tasks
    .map((t) => `        <text x="${labelX(t)}" y="${labelY(t)}"${t.anchor === "end" ? ' text-anchor="end"' : ""} class="gsub" fill="#c9d4e8">${t.label}</text>`)
    .join("\n");
  return `        <!-- ${goal.display.toLowerCase()} tasks -->\n${circles}\n${labels}`;
}).join("\n");

const svgHubs = GOALS.map((goal) =>
  `        <circle cx="${goal.hub.x}" cy="${goal.hub.y}" r="9" fill="${goal.color}"/>\n` +
  `        <text x="${goal.hub.x}" y="${goal.labelY}" text-anchor="middle" class="glabel" font-size="19">${goal.display}</text>\n` +
  `        <text x="${goal.hub.x}" y="${goal.subY}" text-anchor="middle" class="gsub">${goal.id}</text>`
).join("\n\n");

const themeSections = GOALS.map((goal) => {
  const items = goal.tasks
    .map((t) => `      <div class="item"><span class="tick">task</span><div><div class="t-title">${t.label}</div><div class="t-desc">${t.desc}</div></div></div>`)
    .join("\n");
  const boundary = goal.boundary ? `\n      ${goal.boundary}` : "";
  return (
    `    <div class="theme ${goal.cls}">\n` +
    `      <div class="theme-head"><span class="node"></span><h2>${goal.display}</h2><span class="goal-id">${goal.id}</span></div>\n` +
    `      <p class="aim">${goal.aim}</p>\n` +
    `${items}${boundary}\n` +
    `    </div>`
  );
}).join("\n\n");

const doc = `<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>konspekt — product roadmap</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#0b1424;
    --ink-2:#111e35;
    --line:#26395c;
    --line-soft:#182740;
    --paper:#eef3fb;
    --paper-dim:#c6d2e6;
    --paper-faint:#96a7c5;
    --collab:#f2b45c;
    --observ:#54c7d8;
    --portab:#87d7a3;
    --account:#e78cb2;
    --steel:#c2cfe6;
    --sans:"IBM Plex Sans",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%;font-size:18px}
  body{
    margin:0;
    background:var(--ink);
    color:var(--paper);
    font-family:var(--sans);
    line-height:1.5;
    -webkit-font-smoothing:antialiased;
  }
  .poster{
    max-width:1040px;
    margin:0 auto;
    padding:56px 52px 40px;
    background:
      radial-gradient(1200px 700px at 78% -8%, rgba(84,199,216,.10), transparent 60%),
      radial-gradient(900px 620px at 8% 108%, rgba(231,140,178,.08), transparent 62%),
      linear-gradient(180deg,#0b1424,#0c1730 60%,#0b1526);
    position:relative;
    overflow:hidden;
  }
  /* faint blueprint grid */
  .poster::before{
    content:"";
    position:absolute;inset:0;
    background-image:
      linear-gradient(var(--line-soft) 1px,transparent 1px),
      linear-gradient(90deg,var(--line-soft) 1px,transparent 1px);
    background-size:34px 34px;
    opacity:.34;
    pointer-events:none;
    mask-image:radial-gradient(120% 100% at 50% 30%,#000 55%,transparent 100%);
  }
  .poster > *{position:relative;z-index:1}

  /* masthead */
  header{
    display:flex;justify-content:space-between;align-items:flex-end;
    gap:24px;border-bottom:1px solid var(--line);padding-bottom:22px;
  }
  .brand .mark{
    font-family:var(--mono);font-weight:500;font-size:1.05rem;letter-spacing:.02em;
    color:var(--steel);
  }
  .brand .mark b{color:var(--paper)}
  h1{
    font-weight:700;
    font-size:clamp(2.9rem,7vw,4.6rem);
    line-height:.94;letter-spacing:-.02em;margin:.18em 0 .28em;
  }
  .lede{
    font-size:clamp(1rem,2.1vw,1.18rem);color:var(--paper-dim);
    max-width:34ch;font-weight:400;
  }
  .status{
    flex:none;text-align:right;font-family:var(--mono);font-size:.72rem;
    color:var(--paper-dim);line-height:1.7;
  }
  .status .dot{
    display:inline-block;width:8px;height:8px;border-radius:50%;
    background:var(--collab);margin-right:7px;vertical-align:middle;
    box-shadow:0 0 0 4px rgba(242,180,92,.16);
  }
  .status b{color:var(--paper);font-weight:500}

  /* hero schematic */
  .hero{margin:30px 0 6px}
  .hero svg{display:block;width:100%;height:auto}
  .glabel{font-family:var(--sans);font-weight:600;fill:var(--paper)}
  .gsub{font-family:var(--mono);font-size:13px;fill:var(--paper-faint)}
  .corelabel{font-family:var(--mono);font-size:13px;fill:var(--steel)}
  .hero-cap{
    font-family:var(--mono);font-size:.72rem;color:var(--paper-faint);
    text-align:center;margin-top:2px;
  }

  /* theme sections */
  .themes{
    display:grid;grid-template-columns:1fr 1fr;gap:2px 40px;margin-top:26px;
  }
  .theme{padding:22px 0 18px;border-top:1px solid var(--line)}
  .theme-head{display:flex;align-items:baseline;gap:12px;margin-bottom:2px}
  .theme-head .node{
    width:12px;height:12px;border-radius:50%;flex:none;transform:translateY(1px);
  }
  .theme h2{font-size:1.32rem;font-weight:700;margin:0;letter-spacing:-.01em}
  .theme .goal-id{font-family:var(--mono);font-size:.7rem;color:var(--paper-faint);margin-left:auto}
  .theme .aim{color:var(--paper-dim);font-size:.92rem;margin:.35em 0 1.1em;max-width:44ch}
  .item{display:grid;grid-template-columns:auto 1fr;gap:0 14px;margin:0 0 .95em}
  .item .tick{
    font-family:var(--mono);font-size:.7rem;color:var(--paper-faint);
    padding-top:.28em;white-space:nowrap;
  }
  .item .t-title{font-weight:600;font-size:.98rem}
  .item .t-desc{color:var(--paper-dim);font-size:.87rem;line-height:1.45}
  .boundary{
    margin-top:.4em;padding:11px 14px;border:1px dashed var(--line);
    border-radius:2px;background:rgba(231,140,178,.05);
    font-size:.82rem;color:var(--paper-dim);
  }
  .boundary b{color:var(--account);font-weight:600}

  .c-collab .node{background:var(--collab)} .c-collab h2{color:var(--collab)} .c-collab .t-title{color:var(--collab)}
  .c-observ .node{background:var(--observ)} .c-observ h2{color:var(--observ)} .c-observ .t-title{color:var(--observ)}
  .c-portab .node{background:var(--portab)} .c-portab h2{color:var(--portab)} .c-portab .t-title{color:var(--portab)}
  .c-account .node{background:var(--account)} .c-account h2{color:var(--account)} .c-account .t-title{color:var(--account)}

  /* cross-cutting band */
  .band{
    margin-top:8px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);
    padding:20px 0;display:grid;grid-template-columns:auto 1fr;gap:0 26px;align-items:start;
  }
  .band .tag{
    font-family:var(--mono);font-size:.74rem;color:var(--steel);
    writing-mode:horizontal-tb;padding-top:2px;max-width:15ch;
  }
  .band .tag b{display:block;color:var(--paper);font-size:.98rem;font-family:var(--sans);font-weight:700;margin-bottom:.3em}
  .band ul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:14px 34px}
  .band li{font-size:.87rem;color:var(--paper-dim);position:relative;padding-left:16px}
  .band li::before{content:"";position:absolute;left:0;top:.55em;width:7px;height:7px;border:1px solid var(--steel);border-radius:50%}
  .band li b{color:var(--paper);font-weight:600}

  /* footer */
  footer{
    margin-top:26px;padding-top:18px;border-top:1px solid var(--line);
    display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;
  }
  .legend{display:flex;gap:22px;flex-wrap:wrap;font-family:var(--mono);font-size:.72rem;color:var(--paper-dim)}
  .legend span{display:inline-flex;align-items:center;gap:8px}
  .legend i{width:22px;height:0;border-top:2px solid var(--paper-dim);display:inline-block}
  .legend i.dash{border-top:2px dashed var(--steel)}
  .legend i.dot{width:9px;height:9px;border:0;border-radius:50%;background:var(--paper-dim)}
  .colophon{font-family:var(--mono);font-size:.72rem;color:var(--paper-faint);text-align:right;line-height:1.7}
  .colophon b{color:var(--paper-dim);font-weight:500}

  @media (max-width:720px){
    .poster{padding:34px 22px}
    .themes{grid-template-columns:1fr;gap:0}
    .band{grid-template-columns:1fr;gap:14px}
    .band ul{grid-template-columns:1fr}
    header{flex-direction:column;align-items:flex-start;gap:16px}
    .status{text-align:left}
  }
  @media (prefers-reduced-motion:no-preference){
    .pulse{animation:pulse 4.5s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
  }
  @media print{
    @page{size:A2 portrait;margin:14mm}
    body{background:#fff}
    .poster{max-width:none;padding:0}
    .poster::before{opacity:.5}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .theme,.band{break-inside:avoid}
  }
</style>
</head>
<body>
<div class="poster">

  <header>
    <div class="brand">
      <div class="mark"><b>konspekt</b> · typed knowledge graph for AI project state</div>
      <h1>Product roadmap</h1>
      <p class="lede">Where a portable, human-readable record of AI work goes next.</p>
    </div>
    <div class="status">
      <div><span class="dot pulse"></span><b>Proposed</b></div>
      <div>open for review</div>
      <div>at FINOS Labs</div>
    </div>
  </header>

  <!-- HERO: roadmap as a schematic graph -->
  <section class="hero" aria-label="Roadmap as a graph of goals and tasks">
    <svg viewBox="0 0 1000 560" role="img" aria-label="Four goals, each decomposing into tasks, with a shared concurrency primitive at the centre.">
      <defs>
        <marker id="dotend" markerWidth="6" markerHeight="6" refX="3" refY="3">
          <circle cx="3" cy="3" r="2" fill="#96a7c5"/>
        </marker>
      </defs>

      <!-- decomposes edges (goal -> task), themed -->
      <g stroke-width="1.4" fill="none" opacity="0.85">
${svgEdges}
      </g>

      <!-- cross-cutting shared primitive (dashed, steel) -->
      <g stroke="#c2cfe6" stroke-width="1.5" fill="none" stroke-dasharray="3 5" opacity="0.9">
        <path d="M500,300 C610,360 720,420 835,470"/>   <!-- to enterprise persistence -->
        <path d="M500,300 C420,250 340,190 300,145"/>   <!-- to collaboration hub -->
      </g>

      <!-- task nodes -->
      <g>
${svgNodes}
      </g>

      <!-- central shared primitive -->
      <circle cx="500" cy="300" r="15" fill="#0b1424" stroke="#c2cfe6" stroke-width="1.6" stroke-dasharray="2 3"/>
      <circle cx="500" cy="300" r="4" fill="#c2cfe6"/>
      <text x="500" y="336" text-anchor="middle" class="corelabel">pointer-swap</text>
      <text x="500" y="351" text-anchor="middle" class="corelabel" fill="#96a7c5">one primitive · two uses</text>

      <!-- goal hubs -->
      <g>
${svgHubs}
      </g>
    </svg>
    <p class="hero-cap">goals decompose into tasks · dashed line = the one commit primitive shared by storage and collaboration</p>
  </section>

  <!-- THEME DETAIL -->
  <section class="themes">

${themeSections}

  </section>

  <!-- CROSS-CUTTING -->
  <section class="band">
    <div class="tag"><b>Concurrency &amp; control</b>runs under every goal above</div>
    <ul>
      <li><b>Sharded edge table.</b> Edges shard by their owning node, so independent proposals never collide; a rebase-append retry covers the rare overlap.</li>
      <li><b>One primitive, two uses.</b> Stage objects, then swap a single pointer. The same commit mechanism gives object-store atomicity and multi-writer safety.</li>
      <li><b>Propose, never accept.</b> Any number of agents can propose at once; only a named maintainer accepts, so the responsible position is always human.</li>
      <li><b>Whole-table checks move out.</b> When no writer sees the full table, duplicate and dangling-edge checks run in the conformance checker, keeping the store dumb.</li>
    </ul>
  </section>

  <!-- FOOTER -->
  <footer>
    <div class="legend">
      <span><i class="dot"></i>goal</span>
      <span><i></i>decomposes</span>
      <span><i class="dash"></i>shared primitive</span>
      <span><span style="width:8px;height:8px;border-radius:50%;background:var(--collab);display:inline-block"></span>proposed, awaiting acceptance</span>
    </div>
    <div class="colophon">
      <div><b>FINOS Labs</b> · Apache-2.0 · github.com/finos-labs/konspekt</div>
      <div>dogfooded against its own development</div>
    </div>
  </footer>

</div>
</body>
</html>
`;

const contentHash =
  "sha256:" + createHash("sha256").update(doc).digest("hex").slice(0, 16);

const banner =
  "<!-- AUTOGENERATED by tools/roadmap-poster.mjs — do not edit by hand.\n" +
  "     Regenerate with:      node tools/roadmap-poster.mjs\n" +
  "     Check freshness with: node tools/roadmap-poster.mjs --check\n" +
  "     Curated projection of .konspekt/instance/ (no timestamps baked in): the\n" +
  "     goal/task selection lives in the editorial map in the generator and is\n" +
  "     validated against the graph (existence + decomposes-reachability) at build.\n" +
  `     contentHash: ${contentHash} -->`;

const fileText = "<!DOCTYPE html>\n" + banner + "\n" + doc;

// ---- write or check ----

if (check) {
  if (!existsSync(outFile)) {
    console.error(`roadmap-poster --check: ${outFile} does not exist. Run: node tools/roadmap-poster.mjs`);
    process.exit(1);
  }
  const committed = readFileSync(outFile, "utf8");
  if (committed === fileText) {
    console.log(`roadmap-poster --check: ${outFile} is up to date (${contentHash}).`);
    process.exit(0);
  }
  console.error(
    `roadmap-poster --check: ${outFile} is stale — it does not match the current graph/map.\n` +
    "Regenerate and commit it:  node tools/roadmap-poster.mjs"
  );
  process.exit(1);
}

writeFileSync(outFile, fileText);
const taskCount = GOALS.reduce((n, gg) => n + gg.tasks.length, 0);
console.log(`wrote ${outFile}`);
console.log(`  goals: ${GOALS.length}  tasks: ${taskCount}  ${contentHash}`);
