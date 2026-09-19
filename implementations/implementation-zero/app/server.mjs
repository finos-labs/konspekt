#!/usr/bin/env node
// konspekt implementation_zero — local watcher + read-only server
//
// The shell-agnostic core of implementation_zero (see ../docs/DESIGN.md). A
// zero-dependency Node process that:
//   - loads the instance through loadInstance() in lib/conformance.mjs (the one
//     shared reader; no second parser),
//   - watches the instance directory and reloads on change, debounced,
//   - serves the HTML view and derived views over localhost, and pushes a change
//     signal over Server-Sent Events.
//
// Derived views reuse the shared query layer (lib/views.mjs) so semantics live
// once, in the standard's shape (nw-derive-not-copy). Read-only: there is no
// write endpoint, so nothing here can affect propose to accept. Local only:
// fs.watch sees local edits, not remote commits.
//
// Usage:
//   node server.mjs [instanceDir]
//   KONSPEKT_PORT=4319 node server.mjs
//
// Defaults: this repo's instance at <repo>/.konspekt/instance, port 4319.

import { createServer } from "node:http";
import { readFileSync, existsSync, watch } from "node:fs";
import { join, resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadInstance } from "../../../lib/conformance.mjs";
import { loadActivePersonas } from "../../../lib/load-personas.mjs";
import { goalState } from "../../../lib/views.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const VIEW_DIR = join(__dirname, "view");

const instanceDir = resolve(
  process.argv[2] || process.env.KONSPEKT_INSTANCE || join(REPO_ROOT, ".konspekt", "instance")
);
const personasDir = join(REPO_ROOT, "spec", "personas");
const PORT = Number(process.env.KONSPEKT_PORT || 4319);
const FILENAME_RULE = process.env.KONSPEKT_FILENAME_RULE || "strict";

// Fixed entity-kind order for the change feed and the stats view.
const KIND_ORDER = ["goal", "investigation", "experiment", "topic", "task", "note",
  "concept", "noteworthy", "artifact", "waypoint"];

// Personas are static config; load once. The graph reloads on file change.
const personas = await loadActivePersonas(instanceDir, personasDir, {
  warn: (m) => console.error(`warning: ${m}`),
});

// ---------- flatten the graph ----------

// "kind" is the display kind (node.type for nodes, the entityType otherwise);
// "status" is the node status where one exists (nodes always, noteworthy for
// assumption/constraint) and null otherwise, which distinguishes an entity from
// a node. "ts" is the best timestamp for recency and proposal age.
function eachEntity(g, fn) {
  for (const e of g.nodes) fn(e, e.type || "node", e.status ?? null);
  for (const e of g.concepts) fn(e, "concept", null);
  for (const e of g.noteworthy) fn(e, "noteworthy", e.status ?? null);
  for (const e of g.artifacts) fn(e, "artifact", null);
  for (const e of g.waypoints) fn(e, "waypoint", null);
}
const bestTs = (e) => e.updatedAt || (e.summary && e.summary.updatedAt) ||
  e.createdAt || (e.provenance && e.provenance.timestamp) || null;

function rowsFrom(g) {
  const out = [];
  eachEntity(g, (e, kind, status) =>
    out.push({ id: e.id, kind, status: status ?? null, review: e.review ?? null, updatedAt: bestTs(e) }));
  const ts = (r) => (r.updatedAt ? Date.parse(r.updatedAt) || 0 : 0);
  out.sort((a, b) => ts(b) - ts(a) || (a.id < b.id ? -1 : 1));
  return out;
}

// Counts by kind (total / proposed / accepted), totals, and the oldest
// unaccepted proposals by age — the measures task-graph-analytics names.
function statsFrom(g) {
  const groups = {};
  const all = [];
  eachEntity(g, (e, kind) => {
    const x = groups[kind] || (groups[kind] = { total: 0, proposed: 0, accepted: 0 });
    x.total++;
    if (e.review === "accepted") x.accepted++;
    else if (e.review === "proposed") x.proposed++;
    const tsRaw = (e.provenance && e.provenance.timestamp) || e.createdAt || null;
    all.push({ id: e.id, kind, review: e.review ?? null, ts: tsRaw });
  });
  const now = Date.now();
  const oldest = all
    .filter((x) => x.review === "proposed" && x.ts)
    .map((x) => ({ id: x.id, kind: x.kind, ageDays: Math.max(0, Math.floor((now - Date.parse(x.ts)) / 86400000)) }))
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 10);
  return {
    total: all.length,
    edges: g.edges.length,
    accepted: all.filter((x) => x.review === "accepted").length,
    proposed: all.filter((x) => x.review === "proposed").length,
    byKind: KIND_ORDER.filter((k) => groups[k]).map((k) => ({ kind: k, ...groups[k] })),
    oldest,
  };
}

// The goals list with a decomposes roll-up per goal (reuses goalState).
function goalsFrom(g) {
  const goals = g.nodes.filter((n) => n.type === "goal");
  const rank = (r) => (r.review === "accepted" ? 0 : 1);
  return goals
    .map((gl) => {
      let rollup = { total: 0, byStatus: {}, proposed: 0 };
      try { rollup = goalState(g, gl.id).rollup; } catch { /* leave empty */ }
      return { id: gl.id, title: gl.title || gl.id, status: gl.status ?? null, review: gl.review ?? null, rollup };
    })
    .sort((a, b) => rank(a) - rank(b) || (a.id < b.id ? -1 : 1));
}

// ---------- state ----------

let graph = null;
let snapshot = { cursor: "", rows: [], counts: null, error: null };
let seq = 0;

function reload(reason) {
  try {
    const g = loadInstance(instanceDir, { filenameRule: FILENAME_RULE, personas });
    graph = g;
    snapshot = { cursor: `${Date.now()}-${++seq}`, rows: rowsFrom(g), counts: g.meta.counts, error: null };
    console.error(`reloaded (${reason}): ${snapshot.rows.length} entities, cursor ${snapshot.cursor}`);
  } catch (err) {
    // A read mid-write can throw; keep the last good graph and report.
    snapshot = { ...snapshot, error: String(err && err.message || err) };
    console.error(`reload failed (${reason}): ${snapshot.error}`);
  }
  notify();
}

// ---------- SSE ----------

const clients = new Set();
function notify() {
  const line = `event: change\ndata: ${JSON.stringify({ cursor: snapshot.cursor })}\n\n`;
  for (const res of clients) res.write(line);
}

// ---------- watcher (debounced) ----------

let timer = null;
function onFsEvent() {
  if (timer) clearTimeout(timer);
  // A sync writes many files at once and a rename arrives as create+delete;
  // debounce the burst, then do one full reload rather than incremental patching.
  timer = setTimeout(() => { timer = null; reload("fs.watch"); }, 200);
}
function startWatch() {
  try {
    // recursive is supported on Windows and macOS, and on Linux under Node 20+.
    watch(instanceDir, { recursive: true }, onFsEvent);
    console.error(`watching ${instanceDir} (recursive)`);
  } catch (err) {
    console.error(`recursive watch unavailable (${err.code || err}); falling back to top-level watch`);
    watch(instanceDir, onFsEvent);
  }
}

// ---------- responses ----------

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json" };

function sendJson(res, obj, status = 200) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(obj));
}
function serveStatic(res, name) {
  const file = join(VIEW_DIR, name);
  if (!file.startsWith(VIEW_DIR) || !existsSync(file)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}

// ---------- HTTP ----------

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path === "/" || path === "/view") return serveStatic(res, "index.html");

  if (path === "/api/entities") return sendJson(res, snapshot);
  if (path === "/api/stats") {
    if (!graph) return sendJson(res, { error: snapshot.error || "not loaded" }, 503);
    return sendJson(res, statsFrom(graph));
  }
  if (path === "/api/goals") {
    if (!graph) return sendJson(res, { error: snapshot.error || "not loaded" }, 503);
    return sendJson(res, goalsFrom(graph));
  }
  if (path === "/api/graph") {
    if (!graph) return sendJson(res, { error: snapshot.error || "not loaded" }, 503);
    try { return sendJson(res, goalState(graph, url.searchParams.get("goal") || "")); }
    catch (e) { return sendJson(res, { error: String(e.message || e) }, 404); }
  }

  if (path === "/events") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
    res.write(`event: change\ndata: ${JSON.stringify({ cursor: snapshot.cursor })}\n\n`);
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  // Any other view asset (js/css) served from view/.
  if (path.startsWith("/") && !path.includes("..")) return serveStatic(res, path.slice(1));

  res.writeHead(404); res.end("not found");
});

reload("startup");
startWatch();
server.listen(PORT, "127.0.0.1", () => {
  console.error(`implementation_zero read-only view on http://127.0.0.1:${PORT}`);
  console.error(`instance: ${instanceDir}`);
});
