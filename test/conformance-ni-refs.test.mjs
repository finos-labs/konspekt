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

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
