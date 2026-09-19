#!/usr/bin/env node
// konspekt implementation_zero — local watcher + read-only server
//
// The shell-agnostic core of implementation_zero (see ../docs/DESIGN.md). A
// zero-dependency Node process that:
//   - loads the instance through loadInstance() in lib/conformance.mjs (the one
//     shared reader; no second parser),
//   - watches the instance directory and reloads on change, debounced,
//   - serves the HTML view and the entities over localhost, and pushes a change
//     signal over Server-Sent Events.
//
// Read-only: there is no write endpoint, so nothing here can affect propose to
// accept. Local only: fs.watch sees local edits, not remote commits.
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const VIEW_DIR = join(__dirname, "view");

const instanceDir = resolve(
  process.argv[2] || process.env.KONSPEKT_INSTANCE || join(REPO_ROOT, ".konspekt", "instance")
);
const personasDir = join(REPO_ROOT, "spec", "personas");
const PORT = Number(process.env.KONSPEKT_PORT || 4319);
const FILENAME_RULE = process.env.KONSPEKT_FILENAME_RULE || "strict";

// ---------- graph -> change-feed rows ----------

// Personas are static config; load once. The graph reloads on file change.
const personas = await loadActivePersonas(instanceDir, personasDir, {
  warn: (m) => console.error(`warning: ${m}`),
});

// One flat row per entity for the change feed. "kind" is the display kind
// (node.type for nodes, the entityType otherwise); "status" is the node status
// where one exists (nodes always, noteworthy for assumption/constraint) and null
// otherwise, which is what distinguishes an entity from a node in the feed.
function rowsFrom(g) {
  const out = [];
  const push = (e, kind, status) => {
    const updatedAt = e.updatedAt || (e.summary && e.summary.updatedAt) ||
      e.createdAt || (e.provenance && e.provenance.timestamp) || null;
    out.push({ id: e.id, kind, status: status ?? null, review: e.review ?? null, updatedAt });
  };
  for (const e of g.nodes) push(e, e.type || "node", e.status ?? null);
  for (const e of g.concepts) push(e, "concept", null);
  for (const e of g.noteworthy) push(e, "noteworthy", e.status ?? null);
  for (const e of g.artifacts) push(e, "artifact", null);
  for (const e of g.waypoints) push(e, "waypoint", null);
  const ts = (r) => (r.updatedAt ? Date.parse(r.updatedAt) || 0 : 0);
  out.sort((a, b) => ts(b) - ts(a) || (a.id < b.id ? -1 : 1));
  return out;
}

let snapshot = { cursor: "", rows: [], counts: null, error: null };
let seq = 0;

function reload(reason) {
  try {
    const g = loadInstance(instanceDir, { filenameRule: FILENAME_RULE, personas });
    snapshot = { cursor: `${Date.now()}-${++seq}`, rows: rowsFrom(g), counts: g.meta.counts, error: null };
    console.error(`reloaded (${reason}): ${snapshot.rows.length} entities, cursor ${snapshot.cursor}`);
  } catch (err) {
    // A read mid-write can throw; keep the last good snapshot and report.
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

// ---------- static files ----------

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json" };

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

  if (path === "/api/entities") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    return res.end(JSON.stringify(snapshot));
  }

  if (path === "/events") {
    res.writeHead(200, {
      "content-type": "text/event-stream", "cache-control": "no-cache",
      connection: "keep-alive",
    });
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
