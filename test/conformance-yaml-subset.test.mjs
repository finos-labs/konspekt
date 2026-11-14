// The front-matter parser in lib/conformance.mjs: nested maps at any depth,
// block sequences of maps, and no silent loss of lines it cannot place.
// The migrated provenance shape (investigation-source-uris) is the case that
// motivated the change: the old one-level parser flattened
// provenance.deprecated.sourceRef over provenance.sourceRef.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseYamlSubset, parseYamlSubsetWithIssues, splitEntityFile, loadInstance } from "../lib/conformance.mjs";

const NI = "ni:///sha-256;APNFY7KHdLOOFaMj1MTEsYvBDHqC9Ab_SMP3qqqBTsw";
const OLD = "1c521cd2996ebec25d03424a298bf146305e2c58";

const MIGRATED = `id: wp-links-edge-kind
kind: decision
review: accepted
provenance:
  sourceRef: ${NI}
  timestamp: 2026-09-12T14:30:00Z
  confidence: 0.9
  deprecated:
    migratedAt: 2026-11-14T00:06:00Z
    sourceRef: ${OLD}
    contentHash: ${OLD}
  locators:
    - uri: https://github.com/finos-labs/konspekt/blob/abc/spec/x.md#L1-L2
      kind: git-permalink
      retrievedAt: 2026-11-13T23:55:00Z
    - uri: https://claude.ai/chat/xyz
      kind: conversation
createdAt: 2026-09-12T14:30:00Z
updatedAt: 2026-09-12T14:30:00Z`;

test("a nested deprecated block does not overwrite the current sourceRef", () => {
  const { value, issues } = parseYamlSubsetWithIssues(MIGRATED);
  assert.deepEqual(issues, []);
  assert.equal(value.provenance.sourceRef, NI);
  assert.equal(value.provenance.timestamp, "2026-09-12T14:30:00Z");
  assert.equal(value.provenance.confidence, 0.9);
  assert.deepEqual(value.provenance.deprecated, {
    migratedAt: "2026-11-14T00:06:00Z", sourceRef: OLD, contentHash: OLD,
  });
  assert.equal(value.updatedAt, "2026-09-12T14:30:00Z");
});

test("locators parse as a list of maps", () => {
  const { value } = parseYamlSubsetWithIssues(MIGRATED);
  assert.deepEqual(value.provenance.locators, [
    { uri: "https://github.com/finos-labs/konspekt/blob/abc/spec/x.md#L1-L2",
      kind: "git-permalink", retrievedAt: "2026-11-13T23:55:00Z" },
    { uri: "https://claude.ai/chat/xyz", kind: "conversation" },
  ]);
});

test("the store block in project.md parses three levels deep", () => {
  const v = parseYamlSubset(`id: project-x
store:
  kind: git
  ref: main
  resolve:
    source: https://github.com/o/r/blob/{ref}/.konspekt/instance/sources/sha-256/{hex}.md
    entity: https://github.com/o/r/blob/{ref}/.konspekt/instance/{path}
locators:
  allow: [github.com, claude.ai]`);
  assert.equal(v.store.kind, "git");
  assert.equal(v.store.resolve.entity, "https://github.com/o/r/blob/{ref}/.konspekt/instance/{path}");
  assert.deepEqual(v.locators.allow, ["github.com", "claude.ai"]);
});

test("scalar sequences, sequences at the key's indent, and nested block scalars", () => {
  const v = parseYamlSubset(`a:
  - one
  - 2
b:
- x
- y
c:
  note: >
    folded
    text
  raw: |
    line 1
    line 2
d: plain`);
  assert.deepEqual(v.a, ["one", 2]);
  assert.deepEqual(v.b, ["x", "y"]);
  assert.equal(v.c.note, "folded text");
  assert.equal(v.c.raw, "line 1\nline 2");
  assert.equal(v.d, "plain");
});

test("existing one-level shapes parse as before", () => {
  const v = parseYamlSubset(`id: task-x
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-08-28T11:49:13Z
personas: [engineer]
goal: >-
  A portable,
  human-readable record.`);
  assert.deepEqual(v.summary, { origin: "machine", pinned: false, updatedAt: "2026-08-28T11:49:13Z" });
  assert.deepEqual(v.personas, ["engineer"]);
  assert.equal(v.goal, "A portable, human-readable record.");
});

test("a line the parser cannot place is reported, not dropped", () => {
  const { value, issues } = parseYamlSubsetWithIssues(`id: x
provenance:
  sourceRef: abc
    stray: deeper than any key
not a key line
review: accepted`);
  assert.equal(value.provenance.sourceRef, "abc");
  assert.equal(value.review, "accepted");
  assert.deepEqual(issues.map((i) => i.line), [4, 5]);
});

test("loadInstance reports an unparsable front-matter line as an error", () => {
  const dir = mkdtempSync(join(tmpdir(), "konspekt-yaml-"));
  mkdirSync(join(dir, "noteworthy"));
  writeFileSync(join(dir, "project.md"), "```yaml\nid: project-x\n```\n# x\n");
  writeFileSync(join(dir, "noteworthy", "nw-x.md"),
    "```yaml\nid: nw-x\nkind: decision\nreview: proposed\n  stray: line\n```\n# Noteworthy: x\n\nText.\n");
  const g = loadInstance(dir, { checkSources: false });
  const hits = g.problems.filter((p) => p.code === "frontmatter-unparsed");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].severity, "error");
});

test("splitEntityFile returns the issues alongside front and body", () => {
  const r = splitEntityFile("```yaml\nid: a\n  bad: indent\n```\nBody\n");
  assert.equal(r.front.id, "a");
  assert.equal(r.body, "Body");
  assert.equal(r.frontIssues.length, 1);
});
