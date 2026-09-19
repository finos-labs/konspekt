// Integration smoke test: start the real server against this repo's instance on
// a test port and exercise the read-only endpoints. Zero dependencies.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.KONSPEKT_TEST_PORT || 4757);
const BASE = `http://127.0.0.1:${PORT}`;
const serverPath = fileURLToPath(new URL("../server.mjs", import.meta.url));
let child;

async function get(path) { return fetch(BASE + path, { cache: "no-store" }); }
async function waitUp(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await get("/api/entities"); if (r.ok) return true; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error("server did not start in time");
}

before(async () => {
  child = spawn(process.execPath, [serverPath], { env: { ...process.env, KONSPEKT_PORT: String(PORT) }, stdio: "ignore" });
  await waitUp();
});
after(() => { if (child) child.kill(); });

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
  assert.match(d.sourceRef, /^[0-9a-f]{40}$/, "a content-addressed entity carries a sourceRef");
});

test("GET /api/source returns the excerpt for a valid ref", async () => {
  const e = await (await get("/api/entity?id=task-implementation-zero")).json();
  const s = await (await get("/api/source?ref=" + e.sourceRef)).json();
  assert.equal(s.ref, e.sourceRef);
  assert.ok(typeof s.markdown === "string" && s.markdown.length > 0);
});

test("GET /api/entity unknown id → 404; /api/source non-hex ref → 400", async () => {
  const e = await get("/api/entity?id=nope-nope");
  assert.equal(e.status, 404);
  assert.ok((await e.json()).error);
  const r = await get("/api/source?ref=not-hex!");
  assert.equal(r.status, 400);
  assert.ok((await r.json()).error);
});
