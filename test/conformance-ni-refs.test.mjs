#!/usr/bin/env node
// Conformance test for `ni:` source references (task-ni-references,
// docs/design/source-addressing.md).
//
// Covers the helpers (SHA-256 over raw bytes, the hex and base64url round trip,
// strict `ni:` parsing) against the design document's worked example, then
// builds minimal instances in a temporary directory and checks the entity
// provenance rules: an `ni:` sourceRef resolves to sources/sha-256/<hex>.md and
// must hash to it, contentHash is derived and not stored beside it, a malformed
// reference is an error, and an instance may mix migrated and unmigrated atoms.
//
// Run:  node test/conformance-ni-refs.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const C = await import(pathToFileURL(join(HERE, "..", "lib", "conformance.mjs")));
const { loadInstance, gitBlobSha, sha256Hex, niRef, parseNiRef, hexToBase64url, base64urlToHex, resolveContentRef } = C;

const failures = [];
const check = (name, ok, detail = "") => {
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
};

// ----- helpers -----

// Worked example from docs/design/source-addressing.md.
const EX_HEX = "00f34563b28774b38e15a323d4c4c4b18bc10c7a82f406ff48c3f7aaaa814ecc";
const EX_B64 = "APNFY7KHdLOOFaMj1MTEsYvBDHqC9Ab_SMP3qqqBTsw";
check("hex -> base64url matches the worked example", hexToBase64url(EX_HEX) === EX_B64);
check("base64url -> hex matches the worked example", base64urlToHex(EX_B64) === EX_HEX);
check("parseNiRef reads the worked example",
  JSON.stringify(parseNiRef(`ni:///sha-256;${EX_B64}`)) === JSON.stringify({ alg: "sha-256", hex: EX_HEX, b64: EX_B64 }));

const BYTES = Buffer.from("# Source excerpt\n\n**User:**\n\nhello\n");
check("niRef hashes raw bytes, without the git blob header",
  niRef(BYTES) === `ni:///sha-256;${hexToBase64url(sha256Hex(BYTES))}` &&
  parseNiRef(niRef(BYTES)).hex !== gitBlobSha(BYTES));

for (const [label, ref] of [
  ["a padded digest", `ni:///sha-256;${EX_B64}=`],
  ["a standard-base64 digest", `ni:///sha-256;${EX_B64.replace("_", "/")}`],
  ["a short digest", `ni:///sha-256;${EX_B64.slice(1)}`],
  ["another algorithm", `ni:///sha-512;${EX_B64}`],
  ["an authority part", `ni://example.com/sha-256;${EX_B64}`],
  ["a git blob SHA", gitBlobSha(BYTES)],
]) check(`parseNiRef rejects ${label}`, parseNiRef(ref) === null);

{
  const ni = resolveContentRef("/s", niRef(BYTES));
  const legacy = resolveContentRef("/s", gitBlobSha(BYTES));
  check("resolveContentRef maps ni: to sha-256/<hex>.md and verifies by SHA-256",
    ni.form === "ni" && ni.rel === `sha-256/${sha256Hex(BYTES)}.md` && ni.verify(BYTES) && !ni.verify(Buffer.from("x")));
  check("resolveContentRef maps a git blob SHA to <sha>.md and verifies by blob SHA",
    legacy.form === "git-blob-sha1" && legacy.rel === `${gitBlobSha(BYTES)}.md` && legacy.verify(BYTES));
  check("resolveContentRef returns null for an unknown form", resolveContentRef("/s", "md5:abc") === null);
}

// ----- entity provenance -----

const TS = "2026-01-01T00:00:00Z";
const entity = (fields, body) => "```yaml\n" + fields + "\n```\n" + body + "\n";
const OLD = Buffer.from("# Source excerpt — unmigrated\n");
const NEW = Buffer.from("# Source excerpt — migrated\n");

// `tasks` maps a task id to its provenance lines; `files` lists [relPath, bytes]
// under sources/.
function build(tasks, files) {
  const dir = mkdtempSync(join(tmpdir(), "konspekt-ni-"));
  for (const d of ["nodes/task", "edges", "sources/sha-256"]) mkdirSync(join(dir, d), { recursive: true });
  writeFileSync(join(dir, "project.md"),
    entity(`id: project-t\ngoal: test\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# t"));
  for (const [id, prov] of Object.entries(tasks)) {
    writeFileSync(join(dir, `nodes/task/${id}.md`),
      entity(`id: ${id}\ntype: task\ntitle: T\nstatus: open\nreview: proposed\nprovenance:\n${prov}\n` +
        `  timestamp: ${TS}\n  confidence: 0.5\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# Task: T"));
  }
  writeFileSync(join(dir, "edges/edges.md"),
    entity(`provenance:\n  conversationId: t\n  timestamp: ${TS}\nreview: accepted`,
      "| id | kind | from | to | weight | review |\n|----|------|------|----|--------|--------|"));
  for (const [rel, bytes] of files) writeFileSync(join(dir, "sources", rel), bytes);
  return dir;
}

const SOURCE_CODES = new Set(["dangling-source", "content-hash-mismatch", "malformed-source-ref",
  "stored-content-hash", "sourceref-hash-divergence", "frontmatter-unparsed"]);
function codesFor(tasks, files) {
  const dir = build(tasks, files);
  try {
    return loadInstance(dir, {}).problems.filter((p) => SOURCE_CODES.has(p.code))
      .map((p) => `${p.severity}:${p.code}`).sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const oldSha = gitBlobSha(OLD);
const newRef = niRef(NEW);
const newFile = [`sha-256/${sha256Hex(NEW)}.md`, NEW];
const oldFile = [`${oldSha}.md`, OLD];
const legacyProv = `  sourceRef: ${oldSha}\n  contentHash: ${oldSha}`;
const niProv = `  sourceRef: ${newRef}`;
const migratedProv = `${niProv}\n  deprecated:\n    migratedAt: ${TS}\n    sourceRef: ${oldSha}\n    contentHash: ${oldSha}`;

const CASES = [
  ["an ni: sourceRef resolving to its sha-256 file passes", { "task-a": niProv }, [newFile], []],
  ["a migrated atom with a deprecated block passes", { "task-a": migratedProv }, [newFile, oldFile], []],
  ["an instance mixing migrated and unmigrated atoms passes",
    { "task-a": migratedProv, "task-b": legacyProv }, [newFile, oldFile], []],
  ["an ni: sourceRef with no sha-256 file is dangling", { "task-a": niProv }, [], ["error:dangling-source"]],
  ["an ni: sourceRef whose file holds other bytes is a mismatch",
    { "task-a": niProv }, [[newFile[0], OLD]], ["error:content-hash-mismatch"]],
  ["a stored contentHash beside an ni: sourceRef is an error",
    { "task-a": `${niProv}\n  contentHash: ${newRef}` }, [newFile], ["error:stored-content-hash"]],
  ["a malformed ni: sourceRef is an error",
    { "task-a": `  sourceRef: ni:///sha-256;notadigest` }, [], ["error:malformed-source-ref"]],
];

for (const [name, tasks, files, want] of CASES) {
  const codes = codesFor(tasks, files);
  check(name, JSON.stringify(codes) === JSON.stringify(want.slice().sort()), `wanted [${want}] got [${codes}]`);
}

// ----- table cells and channel refs -----
//
// The `source` cells of the transitions, checkpoints and grants logs, and the
// command cells of the engineer executed log, take either form. Each case
// builds one instance with task-a migrated and checks the codes the log yields.

const REG = await import(pathToFileURL(join(HERE, "..", "spec", "personas", "engineer", "registry.mjs")));
const engineer = REG.persona ? REG : null;
const CMD = Buffer.from("node tools/example.mjs\n");
const cmdRef = niRef(CMD);

function buildLogs({ transitionSource, checkpointSource, grantSource, command, edgeTo }) {
  const dir = build({ "task-a": niProv }, [newFile, oldFile]);
  mkdirSync(join(dir, "transitions"));
  writeFileSync(join(dir, "transitions/transitions.md"),
    "# Transitions\n\n| ref | field | from | to | timestamp | source | by |\n|-----|-------|------|----|-----------|--------|----|\n" +
    `| node:task-a | review |  | proposed | ${TS} | ${transitionSource} | alice |\n` +
    `| node:task-a | status |  | open | ${TS} | ${transitionSource} | alice |\n`);
  mkdirSync(join(dir, "checkpoints"));
  writeFileSync(join(dir, "checkpoints/checkpoints.md"),
    "# Checkpoints\n\n| timestamp | entity | source | venue | model | by |\n|-----------|--------|--------|-------|-------|----|\n" +
    `| 2026-01-02T00:00:00Z | task-a | ${checkpointSource} | claude-code-cli |  | alice |\n`);
  mkdirSync(join(dir, "authority"));
  writeFileSync(join(dir, "authority/principals.md"),
    "# Principals\n\n| id | kind | roles | key |\n|----|------|-------|-----|\n| alice | human | grantor |  |\n");
  writeFileSync(join(dir, "authority/grants.md"),
    "# Grants\n\n| scope | acceptor | action | grantor | timestamp | source |\n" +
    "|-------|----------|--------|---------|-----------|--------|\n" + `| * | alice | grant | alice | ${TS} | ${grantSource} |\n`);
  mkdirSync(join(dir, "commands/sha-256"), { recursive: true });
  writeFileSync(join(dir, `commands/sha-256/${sha256Hex(CMD)}.md`), CMD);
  writeFileSync(join(dir, "commands/executed.md"),
    "# Executed\n\n| entity | command |\n|--------|---------|\n" + `| task-a | ${command} |\n`);
  if (edgeTo) {
    writeFileSync(join(dir, "edges/edges.md"),
      entity(`provenance:\n  conversationId: t\n  timestamp: ${TS}\nreview: accepted`,
        "| id | kind | from | to | weight | review |\n|----|------|------|----|--------|--------|\n" +
        `| e-cmd | relates | ${edgeTo} | node:task-a |  | proposed |`));
  }
  return dir;
}

const LOG_CODES = new Set(["dangling-source", "content-hash-mismatch", "malformed-source-ref",
  "dangling-provenance-ref", "provenance-ref-hash-mismatch"]);
function logCodes(opts) {
  const dir = buildLogs(opts);
  try {
    return loadInstance(dir, { personas: engineer ? [engineer] : [] }).problems
      .filter((p) => LOG_CODES.has(p.code)).map((p) => `${p.severity}:${p.code}`).sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

check("the engineer registry loads", Boolean(engineer));
const GOOD_LOGS = { transitionSource: newRef, checkpointSource: newRef, grantSource: newRef, command: cmdRef };
const LOG_CASES = [
  ["ni: refs in every log resolve and verify", GOOD_LOGS, []],
  ["legacy git blob SHAs in every log still resolve",
    { transitionSource: oldSha, checkpointSource: oldSha, grantSource: oldSha, command: cmdRef }, []],
  ["a transition source with no sha-256 file is dangling",
    { ...GOOD_LOGS, transitionSource: niRef(Buffer.from("absent")) }, ["error:dangling-source", "error:dangling-source"]],
  ["a checkpoint source with a malformed ni: ref is an error",
    { ...GOOD_LOGS, checkpointSource: "ni:///sha-256;bad" }, ["error:malformed-source-ref"]],
  ["a grant source with a malformed ni: ref is an error",
    { ...GOOD_LOGS, grantSource: "ni:///sha-256;bad" }, ["error:malformed-source-ref"]],
  ["an executed command with no sha-256 file is dangling",
    { ...GOOD_LOGS, command: niRef(Buffer.from("absent")) }, ["error:dangling-provenance-ref"]],
  ["a command:ni: edge endpoint resolves to commands/sha-256/", { ...GOOD_LOGS, edgeTo: `command:${cmdRef}` }, []],
  ["a command:ni: edge endpoint with no file is dangling",
    { ...GOOD_LOGS, edgeTo: `command:${niRef(Buffer.from("absent"))}` }, ["error:dangling-provenance-ref"]],
];
for (const [name, opts, want] of LOG_CASES) {
  const codes = logCodes(opts);
  check(name, JSON.stringify(codes) === JSON.stringify(want.slice().sort()), `wanted [${want}] got [${codes}]`);
}

// ----- store and locators -----

const STORE = "store:\n  kind: git\n  ref: main\n  resolve:\n    source: https://h/{hex}\n    entity: https://h/{path}\n    edges: https://h/edges.md";
function projectCodes(projectExtra, prov) {
  const dir = build({ "task-a": prov }, [newFile]);
  writeFileSync(join(dir, "project.md"),
    entity(`id: project-t\ngoal: test\n${projectExtra}\ncreatedAt: ${TS}\nupdatedAt: ${TS}`, "# t"));
  try {
    return loadInstance(dir, {}).problems
      .filter((p) => /^(store-|locator|unexpected-field)/.test(p.code)).map((p) => `${p.severity}:${p.code}`).sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const loc = (uri, kind = "web", at = TS) => `${niProv}\n  locators:\n    - uri: ${uri}\n      kind: ${kind}\n      retrievedAt: ${at}`;
const PROJECT_CASES = [
  ["a complete store block and an allow-list are known fields", `${STORE}\nlocators:\n  allow: [github.com]`, niProv, []],
  ["a store block missing resolve.edges is incomplete",
    STORE.replace("\n    edges: https://h/edges.md", ""), niProv, ["warning:store-incomplete"]],
  ["a locator on an allowed host passes", "locators:\n  allow: [github.com]", loc("https://github.com/o/r/blob/c/x.md", "git-permalink"), []],
  ["a locator on a host outside the allow-list is reported", "locators:\n  allow: [github.com]", loc("https://intranet.example/x"), ["warning:locator-not-allowed"]],
  ["a locator with no allow-list declared is reported", "", loc("https://github.com/x"), ["warning:locator-not-allowed"]],
  ["a locator with an unknown kind is malformed", "locators:\n  allow: [github.com]", loc("https://github.com/x", "email"), ["warning:locator-malformed"]],
];
for (const [name, extra, prov, want] of PROJECT_CASES) {
  const codes = projectCodes(extra, prov);
  check(name, JSON.stringify(codes) === JSON.stringify(want.slice().sort()), `wanted [${want}] got [${codes}]`);
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
