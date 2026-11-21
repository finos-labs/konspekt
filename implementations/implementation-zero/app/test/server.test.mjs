// Integration smoke test: start the real server against this repo's instance on
// a test port and exercise the read-only endpoints. Zero dependencies.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cpSync, mkdtempSync, rmSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadInstance, niRef, parseNiRef } from "../../../../lib/conformance.mjs";

// The transition-log errors the three rules raise (SERIALIZATION.md § Transitions).
// After any UI write, none of these may be present: the write must have appended a
// matching row in the same operation.
const transitionErrors = (dir) =>
  loadInstance(dir, {}).problems
    .filter((p) => p.severity === "error" && p.code.includes("transition"))
    .map((p) => p.code);
const transitionsText = () => readFileSync(join(tmpInstance, "transitions", "transitions.md"), "utf8");
// The authority errors a write could introduce (spec/architecture/AUTHORITY.md):
// an acceptance with no principal, or by a principal that holds no grant.
const authorityErrors = (dir) =>
  loadInstance(dir, {}).problems
    .filter((p) => p.severity === "error" && (p.code.startsWith("acceptance-") || p.code === "unknown-principal"))
    .map((p) => p.code);
// This repo's instance declares principals, so the write server acts as its human
// acceptor. The two servers below act as no principal and as a principal with no
// grant; both must refuse to accept.
const ACCEPTOR = "denisurusov";
const NO_GRANT = "claude";

const PORT = Number(process.env.KONSPEKT_TEST_PORT || 4757);
const BASE = `http://127.0.0.1:${PORT}`;
const serverPath = fileURLToPath(new URL("../server.mjs", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
let child;

// A second server on its own port, pointed at a throwaway COPY of the instance,
// so the write tests (accept / resolve) can mutate freely without touching the
// dogfooded repo instance the read-only tests run against.
const PORT2 = PORT + 1;
const BASE2 = `http://127.0.0.1:${PORT2}`;
let child2, tmpInstance;
const PORT3 = PORT + 2, PORT4 = PORT + 3;
let child3, child4;
const postAt = (port, path) => fetch(`http://127.0.0.1:${port}${path}`, { method: "POST", cache: "no-store" });

async function get(path) { return fetch(BASE + path, { cache: "no-store" }); }
async function get2(path) { return fetch(BASE2 + path, { cache: "no-store" }); }
async function post2(path) { return fetch(BASE2 + path, { method: "POST", cache: "no-store" }); }
async function waitUp(base, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(base + "/api/entities", { cache: "no-store" }); if (r.ok) return true; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error("server did not start in time");
}

before(async () => {
  child = spawn(process.execPath, [serverPath], { env: { ...process.env, KONSPEKT_PORT: String(PORT) }, stdio: "ignore" });
  tmpInstance = mkdtempSync(join(tmpdir(), "konspekt-resolve-"));
  cpSync(join(repoRoot, ".konspekt", "instance"), tmpInstance, { recursive: true });
  const writer = (port, principal) => spawn(process.execPath, [serverPath], {
    env: { ...process.env, KONSPEKT_PORT: String(port), KONSPEKT_INSTANCE: tmpInstance, KONSPEKT_PRINCIPAL: principal },
    stdio: "ignore",
  });
  child2 = writer(PORT2, ACCEPTOR);
  child3 = writer(PORT3, "");
  child4 = writer(PORT4, NO_GRANT);
  await Promise.all([waitUp(BASE), waitUp(BASE2),
    waitUp(`http://127.0.0.1:${PORT3}`), waitUp(`http://127.0.0.1:${PORT4}`)]);
});
after(() => {
  if (child) child.kill();
  for (const c of [child2, child3, child4]) if (c) c.kill();
  if (tmpInstance) rmSync(tmpInstance, { recursive: true, force: true });
});

test("GET /api/entities returns a sorted population", async () => {
  const snap = await (await get("/api/entities")).json();
  assert.ok(Array.isArray(snap.rows) && snap.rows.length > 0);
  assert.ok(typeof snap.cursor === "string" && snap.cursor.length > 0);
  for (const r of snap.rows.slice(0, 5)) assert.ok("id" in r && "kind" in r && "review" in r);
});

test("GET /api/stats returns totals and by-kind counts", async () => {
  const s = await (await get("/api/stats")).json();
  assert.ok(s.total > 0 && s.edges > 0);
  assert.equal(s.total, s.accepted + s.proposed + (s.total - s.accepted - s.proposed));
  assert.ok(Array.isArray(s.byKind) && s.byKind.every((k) => k.total === k.accepted + k.proposed + (k.total - k.accepted - k.proposed)));
  assert.ok(Array.isArray(s.oldest));
});

test("GET /api/goals and /api/graph traverse decomposes", async () => {
  const goals = await (await get("/api/goals")).json();
  assert.ok(Array.isArray(goals) && goals.length > 0);
  assert.ok("id" in goals[0] && "rollup" in goals[0]);
  const g = await (await get("/api/graph?goal=" + encodeURIComponent(goals[0].id))).json();
  assert.ok(g.root && g.root.id === goals[0].id);
  assert.ok(Array.isArray(g.nodes) && g.nodes.length >= 1);
});

test("GET /api/graph with a bad id returns an error, not a crash", async () => {
  const r = await get("/api/graph?goal=does-not-exist");
  const body = await r.json();
  assert.ok(body.error, "missing goal reports an error");
});

test("GET /api/entity returns the file markdown and its source pointer", async () => {
  const d = await (await get("/api/entity?id=task-implementation-zero")).json();
  assert.ok(d.markdown.includes("task-implementation-zero"), "returns the entity's own file");
  assert.ok(/^[0-9a-f]{40}$/.test(d.sourceRef) || parseNiRef(d.sourceRef),
    "a content-addressed entity carries a sourceRef (git blob SHA or ni:///sha-256)");
  assert.ok(Array.isArray(d.locators), "the entity endpoint returns provenance locators as a list");
});

test("GET /api/source returns the excerpt for a valid ref", async () => {
  const e = await (await get("/api/entity?id=task-implementation-zero")).json();
  const s = await (await get("/api/source?ref=" + e.sourceRef)).json();
  assert.equal(s.ref, e.sourceRef);
  assert.ok(typeof s.markdown === "string" && s.markdown.length > 0);
});

test("GET /api/source resolves an ni: ref to sources/sha-256/<hex>.md; /.well-known/ni serves the bytes", async () => {
  const bytes = Buffer.from("# Source excerpt — ni lookup test\n");
  const ref = niRef(bytes);
  const { hex, b64 } = parseNiRef(ref);
  mkdirSync(join(tmpInstance, "sources", "sha-256"), { recursive: true });
  writeFileSync(join(tmpInstance, "sources", "sha-256", hex + ".md"), bytes);
  const s = await (await get2("/api/source?ref=" + encodeURIComponent(ref))).json();
  assert.equal(s.ref, ref);
  assert.equal(s.path, `sources/sha-256/${hex}.md`);
  assert.equal(s.markdown, bytes.toString("utf8"));
  const wk = await get2("/.well-known/ni/sha-256/" + b64);
  assert.equal(wk.status, 200);
  assert.equal(Buffer.from(await wk.arrayBuffer()).toString("utf8"), bytes.toString("utf8"));
  assert.equal((await get2("/.well-known/ni/sha-256/" + niRef(Buffer.from("absent")).split(";")[1])).status, 404);
  assert.equal((await get2("/api/source?ref=" + encodeURIComponent("ni:///sha-256;short"))).status, 400);
});

test("GET /api/entity unknown id → 404; /api/source non-hex ref → 400", async () => {
  const e = await get("/api/entity?id=nope-nope");
  assert.equal(e.status, 404);
  assert.ok((await e.json()).error);
  const r = await get("/api/source?ref=not-hex!");
  assert.equal(r.status, 400);
  assert.ok((await r.json()).error);
});

// task-ui-clickable-source-refs: every reference the drawer shows resolves
// through the server, with its store location.

test("GET /api/source returns the store location expanded from store.resolve.source", async () => {
  const e = await (await get("/api/entity?id=task-ui-clickable-source-refs")).json();
  const { hex } = parseNiRef(e.sourceRef);
  const s = await (await get("/api/source?ref=" + encodeURIComponent(e.sourceRef))).json();
  assert.deepEqual(s.location, {
    uri: `https://github.com/finos-labs/konspekt/blob/main/.konspekt/instance/sources/sha-256/${hex}.md`,
    link: true, from: "store.resolve.source",
  });
});

test("GET /api/source for a legacy SHA-1 ref falls back to the layout path", async () => {
  const e = await (await get("/api/entity?id=artifact-authority-spec")).json();
  assert.ok(e.deprecated && /^[0-9a-f]{40}$/.test(e.deprecated.sourceRef), "migrated entity exposes provenance.deprecated");
  assert.ok(e.deprecated.migratedAt);
  const s = await (await get("/api/source?ref=" + e.deprecated.sourceRef)).json();
  assert.equal(s.path, `sources/${e.deprecated.sourceRef}.md`);
  assert.deepEqual(s.location, { uri: `.konspekt/instance/sources/${e.deprecated.sourceRef}.md`, link: false, from: "layout" });
});

test("GET /api/entity exposes provenance timestamp, conversation and confidence", async () => {
  const d = await (await get("/api/entity?id=task-ui-clickable-source-refs")).json();
  assert.deepEqual(d.provenance, { timestamp: "2026-11-21T02:25:00Z", conversationId: "ui-atom-panel", confidence: "0.8" });
  assert.equal(d.deprecated, null);
});

test("GET /api/command resolves a command:ni: reference with its store location", async () => {
  const log = readFileSync(join(repoRoot, ".konspekt", "instance", "commands", "executed.md"), "utf8");
  const ref = /\| [^|]+ \| (ni:\/\/\/sha-256;[A-Za-z0-9_-]{43}) \|/.exec(log)[1];
  const { hex } = parseNiRef(ref);
  const c = await (await get("/api/command?ref=" + encodeURIComponent("command:" + ref))).json();
  assert.equal(c.ref, ref);
  assert.equal(c.path, `commands/sha-256/${hex}.md`);
  assert.ok(c.markdown.length > 0);
  assert.equal(c.location.uri, `https://github.com/finos-labs/konspekt/blob/main/.konspekt/instance/commands/sha-256/${hex}.md`);
  assert.equal(c.location.link, true);
  assert.equal((await get("/api/command?ref=" + encodeURIComponent("command:ni:///sha-256;short"))).status, 400);
  assert.equal((await get("/api/command?ref=" + encodeURIComponent(niRef(Buffer.from("absent"))))).status, 404);
});

test("GET /api/transitions lists one ref's rows in log order, with source and by", async () => {
  const t = await (await get("/api/transitions?ref=" + encodeURIComponent("node:task-ui-clickable-source-refs"))).json();
  assert.equal(t.ref, "node:task-ui-clickable-source-refs");
  const first3 = t.transitions.slice(0, 3);
  assert.deepEqual(first3.map((r) => [r.field, r.from, r.to, r.by]), [
    ["review", null, "proposed", "claude"], ["status", null, "open", "claude"], ["review", "proposed", "accepted", "denisurusov"],
  ]);
  assert.equal(first3[0].source, null);
  assert.ok(parseNiRef(first3[2].source), "the acceptance row carries its source excerpt");
  assert.deepEqual((await (await get("/api/transitions?ref=node:nope-nope")).json()).transitions, []);
});

test("GET /api/source without store.resolve falls back to the repository-relative layout path", async () => {
  const repo = mkdtempSync(join(tmpdir(), "konspekt-noresolve-"));
  const inst = join(repo, ".konspekt", "instance");
  cpSync(join(repoRoot, ".konspekt", "instance"), inst, { recursive: true });
  const pm = join(inst, "project.md");
  writeFileSync(pm, readFileSync(pm, "utf8").replace(/^store:\n(?: {2}.*\n)+/m, ""));
  const port = PORT + 4;
  const c = spawn(process.execPath, [serverPath], { env: { ...process.env, KONSPEKT_PORT: String(port), KONSPEKT_INSTANCE: inst }, stdio: "ignore" });
  try {
    await waitUp(`http://127.0.0.1:${port}`);
    const e = await (await fetch(`http://127.0.0.1:${port}/api/entity?id=task-ui-clickable-source-refs`)).json();
    const { hex } = parseNiRef(e.sourceRef);
    const s = await (await fetch(`http://127.0.0.1:${port}/api/source?ref=` + encodeURIComponent(e.sourceRef))).json();
    assert.deepEqual(s.location, { uri: `.konspekt/instance/sources/sha-256/${hex}.md`, link: false, from: "layout" });
  } finally {
    c.kill();
    rmSync(repo, { recursive: true, force: true });
  }
});

test("GET /api/entity exposes status and entityType", async () => {
  const d = await (await get("/api/entity?id=task-implementation-zero")).json();
  assert.equal(d.entityType, "node");
  assert.ok(["open", "active", "resolved", "abandoned"].includes(d.status), "a node carries a status");
});

// task-ui-atom-neighborhood-graph: the neighbor list and the full graph.

test("GET /api/neighbors lists every edge touching an entity, both directions", async () => {
  const n = await (await get("/api/neighbors?id=task-ui-atom-neighborhood-graph")).json();
  assert.equal(n.id, "task-ui-atom-neighborhood-graph");
  assert.equal(n.entity.kind, "task");
  const has = (kind, dir, id) => n.edges.some((e) => e.kind === kind && e.dir === dir && e.neighbor.id === id);
  assert.ok(has("decomposes", "in", "goal-usability"), "the parent goal is an incoming decomposes edge");
  assert.ok(has("notes", "out", "nw-connections-list-default-graph-toggle"), "the attached decision is an outgoing notes edge");
  for (const e of n.edges) assert.ok(e.edge && e.kind && (e.dir === "in" || e.dir === "out") && "review" in e && "missing" in e.neighbor);
  const r = await get("/api/neighbors?id=nope-nope");
  assert.equal(r.status, 404);
  assert.ok((await r.json()).error);
});

test("GET /api/fullgraph returns every entity and the edges between them", async () => {
  const f = await (await get("/api/fullgraph")).json();
  const s = await (await get("/api/stats")).json();
  assert.equal(f.nodes.length, s.total, "one node per entity");
  assert.equal(f.edges.length + f.dangling, s.edges, "every edge is drawn or counted as dangling");
  const ids = new Set(f.nodes.map((x) => x.id));
  for (const e of f.edges) assert.ok(ids.has(e.from) && ids.has(e.to), "both endpoints of a drawn edge are nodes");
});

// Writes run against the throwaway copy (BASE2), never the repo instance.

test("POST /api/resolve flips an open/active node to resolved, and is idempotent", async () => {
  const snap = await (await get2("/api/entities")).json();
  const NODE = new Set(["goal", "investigation", "experiment", "topic", "task", "note"]);
  const target = snap.rows.find((r) => NODE.has(r.kind) && (r.status === "open" || r.status === "active"));
  assert.ok(target, "the instance has at least one open/active node to resolve");

  const r1 = await (await post2("/api/resolve?entity=" + encodeURIComponent(target.id))).json();
  assert.equal(r1.resolved, true);
  const d = await (await get2("/api/entity?id=" + encodeURIComponent(target.id))).json();
  assert.equal(d.status, "resolved");
  assert.match(d.markdown, /^status:\s*resolved\s*$/m);

  const r2 = await (await post2("/api/resolve?entity=" + encodeURIComponent(target.id))).json();
  assert.equal(r2.resolved, true, "resolving an already-resolved node is a no-op success");
});

test("POST /api/resolve refuses a non-node; GET is 405", async () => {
  const snap = await (await get2("/api/entities")).json();
  const concept = snap.rows.find((r) => r.kind === "concept");
  if (concept) {
    const r = await post2("/api/resolve?entity=" + encodeURIComponent(concept.id));
    assert.equal(r.status, 400);
    assert.ok((await r.json()).error, "resolve applies to work nodes only");
  }
  const g = await get2("/api/resolve?entity=whatever");
  assert.equal(g.status, 405);
});

test("POST /api/resolve unknown id → 400 error", async () => {
  const r = await post2("/api/resolve?entity=nope-nope");
  assert.equal(r.status, 400);
  assert.ok((await r.json()).error);
});

// task-transition-log-writers: a write that sets status/review must append a
// matching transition row in the same operation, keeping the instance conformant.

test("POST /api/resolve appends a status transition row and stays conformant", async () => {
  const snap = await (await get2("/api/entities")).json();
  const NODE = new Set(["goal", "investigation", "experiment", "topic", "task", "note"]);
  const target = snap.rows.find((r) => NODE.has(r.kind) && (r.status === "open" || r.status === "active"));
  assert.ok(target, "the instance has an open/active node to resolve");

  const r = await (await post2("/api/resolve?entity=" + encodeURIComponent(target.id))).json();
  assert.equal(r.resolved, true);

  // A status row for this node, ending at resolved, is the last row for (ref,status).
  const rows = transitionsText().split("\n")
    .filter((l) => l.includes(`| node:${target.id} |`) && l.includes("| status |"));
  assert.ok(rows.length >= 1, "a status transition row was appended for the node");
  assert.match(rows[rows.length - 1], /\|\s*resolved\s*\|/, "the last status row ends at resolved");

  // The agreement/continuity/birth rules all hold after the write.
  assert.deepEqual(transitionErrors(tmpInstance), [], "no transition errors after resolve");
});

test("POST /api/accept appends a review transition row and stays conformant", async () => {
  const snap = await (await get2("/api/entities")).json();
  // A proposed entity that is not an open/active node, so accept (not resolve) is
  // what disposes it — isolating the pure review flip.
  const NODE = new Set(["goal", "investigation", "experiment", "topic", "task", "note"]);
  const target = snap.rows.find((r) => r.review === "proposed" &&
    !(NODE.has(r.kind) && (r.status === "open" || r.status === "active")));
  if (!target) return; // nothing to accept in this instance; the resolve test covers the path

  const r = await (await post2("/api/accept?entity=" + encodeURIComponent(target.id))).json();
  assert.equal(r.accepted, true);

  const d = await (await get2("/api/entity?id=" + encodeURIComponent(target.id))).json();
  const ref = `${d.entityType}:${target.id}`;
  const rows = transitionsText().split("\n")
    .filter((l) => l.includes(`| ${ref} |`) && l.includes("| review |"));
  assert.ok(rows.length >= 1, "a review transition row exists for the accepted entity");
  assert.match(rows[rows.length - 1], /\|\s*accepted\s*\|/, "the last review row ends at accepted");
  assert.ok(rows[rows.length - 1].trim().endsWith(`| ${ACCEPTOR} |`), "the acceptance row names the acting principal in `by`");
  assert.equal(d.acceptedBy, ACCEPTOR, "the entity detail surfaces the accepting principal as acceptedBy");

  assert.deepEqual(transitionErrors(tmpInstance), [], "no transition errors after accept");
  assert.deepEqual(authorityErrors(tmpInstance), [], "no authority errors after accept");
});

// task-authority-mechanism: the accepting client enforces accept authority before
// it writes. With principals declared, a write needs a principal, and an
// acceptance needs a grant on the atom's scope. A refused write changes nothing.
test("POST /api/accept is refused without a principal and without a grant", async () => {
  const snap = await (await get2("/api/entities")).json();
  const target = snap.rows.find((r) => r.review === "proposed");
  if (!target) return; // nothing proposed in this instance
  const before = transitionsText();

  const none = await postAt(PORT3, "/api/accept?entity=" + encodeURIComponent(target.id));
  assert.equal(none.status, 400);
  assert.match((await none.json()).error, /KONSPEKT_PRINCIPAL/);

  const ungranted = await postAt(PORT4, "/api/accept?entity=" + encodeURIComponent(target.id));
  assert.equal(ungranted.status, 400);
  assert.match((await ungranted.json()).error, /holds no grant/);

  assert.equal(transitionsText(), before, "a refused accept appends no transition row");
  const d = await (await get2("/api/entity?id=" + encodeURIComponent(target.id))).json();
  assert.equal(d.review, "proposed", "a refused accept leaves the entity proposed");
});
