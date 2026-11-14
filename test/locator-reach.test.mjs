#!/usr/bin/env node
// Test for lib/locator-reach.mjs, the network check behind
// `lib/validate.mjs --check-locators` (task-ni-references;
// SERIALIZATION.md § Sources: an unreachable locator is a warning).
//
// Runs against a local HTTP server on 127.0.0.1, so it needs no outside
// network: a reachable URI, a 404, a server that rejects HEAD, a slow response
// past the timeout, and a refused connection. It also checks which locators are
// requested at all (only well-formed ones on an allowed host, each URI once)
// and runs validate.mjs end to end over a temporary instance.
//
// Run:  node test/locator-reach.test.mjs   (exit 0 = pass, 1 = fail)

import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const R = await import(pathToFileURL(join(HERE, "..", "lib", "locator-reach.mjs")));
const { collectLocators, probe, checkLocatorReach } = R;

const failures = [];
const check = (name, ok, detail = "") => {
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}${!ok && detail ? ` (${detail})` : ""}`);
};

// ----- local server -----

const requests = [];
const server = createServer((req, res) => {
  requests.push(`${req.method} ${req.url}`);
  if (req.url === "/ok") { res.writeHead(200); res.end("ok"); return; }
  if (req.url === "/moved") { res.writeHead(302, { location: "/ok" }); res.end(); return; }
  if (req.url === "/no-head") {
    if (req.method === "HEAD") { res.writeHead(405); res.end(); return; }
    res.writeHead(200); res.end("body"); return;
  }
  if (req.url === "/slow") { setTimeout(() => { res.writeHead(200); res.end(); }, 1500); return; }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// A port with nothing listening: bind, read the port, close.
const closed = createServer();
await new Promise((r) => closed.listen(0, "127.0.0.1", r));
const DEAD = `http://127.0.0.1:${closed.address().port}`;
await new Promise((r) => closed.close(r));

// ----- probe -----

check("a 200 is reachable", (await probe(`${BASE}/ok`)).ok);
check("a redirect to a 200 is reachable", (await probe(`${BASE}/moved`)).ok);
const nf = await probe(`${BASE}/missing`);
check("a 404 is unreachable and names the status", !nf.ok && nf.detail === "HTTP 404", nf.detail);
requests.length = 0;
const nh = await probe(`${BASE}/no-head`);
check("a server that rejects HEAD is asked again with GET",
  nh.ok && requests.join(",") === "HEAD /no-head,GET /no-head", requests.join(","));
const slow = await probe(`${BASE}/slow`, { timeoutMs: 200 });
check("no response within the timeout is unreachable", !slow.ok && /within 200 ms/.test(slow.detail), slow.detail);
const dead = await probe(`${DEAD}/x`);
check("a refused connection is unreachable", !dead.ok && dead.detail.length > 0, dead.detail);

// ----- collectLocators -----

const loc = (uri) => ({ uri, kind: "web", retrievedAt: "2026-11-14T00:00:00Z" });
const fake = {
  project: { locators: { allow: ["127.0.0.1"] } },
  nodes: [
    { entityType: "node", id: "task-a", provenance: { locators: [loc(`${BASE}/ok`), loc("https://elsewhere.example/x")] } },
    { entityType: "node", id: "task-b", provenance: { locators: [loc(`${BASE}/ok`), loc("not a url"), loc("ftp://127.0.0.1/x")] } },
  ],
  concepts: [{ entityType: "concept", id: "c-a", provenance: { locators: [loc(`${BASE}/missing`)] } }],
  noteworthy: [], artifacts: [], waypoints: [{ entityType: "waypoint", id: "wp-a", provenance: {} }],
};
const targets = collectLocators(fake);
check("only allowed http(s) locators are collected, each URI once",
  JSON.stringify(targets.map((t) => t.uri)) === JSON.stringify([`${BASE}/ok`, `${BASE}/missing`]),
  JSON.stringify(targets.map((t) => t.uri)));
check("a shared URI keeps every citing entity",
  JSON.stringify(targets[0].refs.map((r) => r.id)) === JSON.stringify(["task-a", "task-b"]));
check("no allow-list collects nothing", collectLocators({ ...fake, project: {} }).length === 0);

// ----- checkLocatorReach -----

const reach = await checkLocatorReach(fake);
check("checkLocatorReach requests each collected URI", reach.checked === 2);
check("only the unreachable URI is reported, as a warning on its entity",
  reach.problems.length === 1 &&
  reach.problems[0].severity === "warning" &&
  reach.problems[0].code === "locator-unreachable" &&
  reach.problems[0].ref === "c-a" &&
  /locator 1 at .*\/missing is unreachable \(HTTP 404\)/.test(reach.problems[0].message),
  JSON.stringify(reach.problems));

// ----- validate.mjs end to end -----

const dir = mkdtempSync(join(tmpdir(), "konspekt-locreach-"));
try {
  mkdirSync(join(dir, "nodes", "task"), { recursive: true });
  writeFileSync(join(dir, "project.md"), [
    "```yaml", "id: proj", "goal: test", "createdAt: 2026-11-14T00:00:00Z", "updatedAt: 2026-11-14T00:00:00Z",
    "locators:", "  allow: [127.0.0.1]", "```", "# Project", "",
  ].join("\n"));
  writeFileSync(join(dir, "nodes", "task", "task-x.md"), [
    "```yaml", "id: task-x", "type: task", "title: X", "status: open", "review: proposed",
    "provenance:", "  timestamp: 2026-11-14T00:00:00Z", "  confidence: 0.5",
    "  locators:", `    - uri: ${BASE}/missing`, "      kind: web", "      retrievedAt: 2026-11-14T00:00:00Z",
    "createdAt: 2026-11-14T00:00:00Z", "updatedAt: 2026-11-14T00:00:00Z", "```", "# Task: X", "",
  ].join("\n"));
  const validate = join(HERE, "..", "lib", "validate.mjs");
  // The fixture has unrelated errors (no edges), so validate exits 1; read the
  // JSON from stdout whatever the exit code. Asynchronous, so this process's
  // server can answer the child's requests.
  const run = (extra) => new Promise((res, rej) =>
    execFile(process.execPath, [validate, dir, "--json", "--no-sources", ...extra], { encoding: "utf8" },
      (err, stdout) => (stdout ? res(JSON.parse(stdout)) : rej(err))));
  const codes = (out) => out.problems.map((p) => p.code);
  requests.length = 0;
  const off = await run([]);
  check("without --check-locators no request is made",
    !codes(off).includes("locator-unreachable") && requests.length === 0, requests.join(","));
  const on = await run(["--check-locators"]);
  check("--check-locators adds locator-unreachable to the report",
    codes(on).includes("locator-unreachable"), JSON.stringify(codes(on)));
} finally {
  rmSync(dir, { recursive: true, force: true });
  server.close();
}

if (failures.length) {
  console.log(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nall passed");
