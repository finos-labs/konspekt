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
import { rowsFrom, statsFrom, goalsFrom } from "./projections.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const VIEW_DIR = join(__dirname, "view");

const instanceDir = resolve(
  process.argv[2] || process.env.KONSPEKT_INSTANCE || join(REPO_ROOT, ".konspekt", "instance")
);
const personasDir = join(REPO_ROOT, "spec", "personas");
const PORT = Number(process.env.KONSPEKT_PORT || 4319);
const FILENAME_RULE = process.env.KONSPEKT_FILENAME_RULE || "strict";

// Personas are static config; load once. The graph reloads on file change.
const personas = await loadActivePersonas(instanceDir, personasDir, {
  warn: (m) => console.error(`warning: ${m}`),
});

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
  // One entity's raw markdown file, plus its provenance source pointer (null when
  // the entity predates content-addressed provenance). The path comes from the
  // loader's _file, so this cannot read outside the instance.
  if (path === "/api/entity") {
    if (!graph) return sendJson(res, { error: snapshot.error || "not loaded" }, 503);
    const e = graph.byId.get(url.searchParams.get("id") || "");
    if (!e || !e._file) return sendJson(res, { error: "no such entity" }, 404);
    const abs = join(instanceDir, e._file);
    if (!abs.startsWith(instanceDir) || !existsSync(abs)) return sendJson(res, { error: "file missing" }, 404);
    const p = e.provenance || {};
    return sendJson(res, { id: e.id, file: e._file, markdown: readFileSync(abs, "utf8"),
      sourceRef: p.sourceRef || null, contentHash: p.contentHash || null });
  }
  // One provenance source excerpt by its content hash (git blob SHA). Confined to
  // sources/ and gated on a hex ref, so no path traversal.
  if (path === "/api/source") {
    const ref = url.searchParams.get("ref") || "";
    if (!/^[0-9a-f]{7,64}$/.test(ref)) return sendJson(res, { error: "bad ref" }, 400);
    const base = join(instanceDir, "sources");
    const abs = join(base, ref + ".md");
    if (!abs.startsWith(base) || !existsSync(abs)) return sendJson(res, { error: "no such source" }, 404);
    return sendJson(res, { ref, markdown: readFileSync(abs, "utf8") });
  }
  // Related commands for an entity: the commands/executed.md rows whose entity is
  // this one, in execution order, each resolved to its verbatim text. Empty when
  // the entity has no recorded commands.
  if (path === "/api/commands") {
    const id = url.searchParams.get("entity") || "";
    const logPath = join(instanceDir, "commands", "executed.md");
    const out = [];
    if (existsSync(logPath)) {
      for (const line of readFileSync(logPath, "utf8").split("\n")) {
        const t = line.trim();
        if (!t.startsWith("|")) continue;
        const cells = t.split("|").slice(1, -1).map((c) => c.trim());
        if (cells.length < 2 || cells[0] === "entity" || /^-+$/.test(cells[0]) || cells[0] !== id) continue;
        const hash = cells[1];
        const cf = join(instanceDir, "commands", hash + ".md");
        out.push({ command: hash, markdown: existsSync(cf) ? readFileSync(cf, "utf8") : "(command text missing)" });
      }
    }
    return sendJson(res, { entity: id, commands: out });
  }
  // Related code changes for an entity: the changes/changed.md rows whose entity
  // is this one, in commit order, grouped by commit. `commit` is an opaque
  // revision token (nw-commit-is-opaque-revision) — never resolved against git —
  // so this stays VCS-neutral. Empty when the entity has no recorded changes.
  if (path === "/api/changes") {
    const id = url.searchParams.get("entity") || "";
    const logPath = join(instanceDir, "changes", "changed.md");
    const groups = []; const byCommit = new Map();
    if (existsSync(logPath)) {
      for (const line of readFileSync(logPath, "utf8").split("\n")) {
        const t = line.trim();
        if (!t.startsWith("|")) continue;
        const cells = t.split("|").slice(1, -1).map((c) => c.trim());
        if (cells.length < 3 || cells[0] === "entity" || /^-+$/.test(cells[0]) || cells[0] !== id) continue;
        const [, commit, file] = cells;
        let g = byCommit.get(commit);
        if (!g) { g = { commit, files: [] }; byCommit.set(commit, g); groups.push(g); }
        g.files.push(file);
      }
    }
    return sendJson(res, { entity: id, changes: groups });
  }
  // ASRs (concepts subtype asr) with the ADRs each drives (waypoints subtype adr,
  // via drives edges). `count` is all ASRs+ADRs, for data-presence tab gating.
  if (path === "/api/asradr") {
    if (!graph) return sendJson(res, { error: snapshot.error || "not loaded" }, 503);
    const drives = graph.edges.filter((e) => e.kind === "drives");
    const asrs = graph.concepts.filter((c) => c.subtype === "asr").map((a) => {
      const adrs = drives.filter((e) => e.from.id === a.id).map((e) => graph.byId.get(e.to.id)).filter(Boolean)
        .map((w) => ({ id: w.id, review: w.review || null }));
      return { id: a.id, label: a.label || a.id, review: a.review || null, adrs };
    });
    const adrCount = graph.waypoints.filter((w) => w.subtype === "adr").length;
    return sendJson(res, { count: asrs.length + adrCount, asrs });
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
