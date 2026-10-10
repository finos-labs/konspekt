import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalizeProposal,
  computeProposalId,
  computeSourceHash,
  parseProposal,
  verifyProposalId,
  verifySourceHash,
} from "../payload.mjs";
import { gitBlobSha } from "../../../../../lib/conformance.mjs";

const SOURCE = `konspekt source excerpt — conversation: demo
(a verbatim excerpt)
2026-10-10

Denis: a proposed concept, please.
`;

// Build a proposal.md body (frontmatter without proposal_id yet, so a caller can
// compute the id and then sign it in). `extra` lets a test inject field order or
// whitespace variants.
function unsigned({ sourceHash, idLinePlaceholder = "" } = {}) {
  return `---
${idLinePlaceholder}kind: entity
origin:
  agent: agent-a
  model: claude-opus-4-8
  session: fleet-demo-1
scope:
  entity_type: Concept
  atom_state: proposed
target:
  node: new
depends_on: []
provenance:
  confidence: 0.8
binding: task-fleet-worktree-committer
source:
  hash: ${sourceHash}
  path: sources/${sourceHash}.md
created: 2026-10-10T16:00:00Z
---
# Concept: demo

A demonstration concept folded by the committer.

edges:
| id | kind | from | to | weight | review |
|----|------|------|----|--------|--------|
| e-rel-demo-x | relates | concept:concept-demo | concept:concept-x | 0.4 | proposed |
`;
}

// A signed payload carries the proposal_id that the canonical bytes hash to.
function signed(opts = {}) {
  const sourceHash = opts.sourceHash ?? computeSourceHash(Buffer.from(SOURCE, "utf8"));
  const base = unsigned({ sourceHash });
  const id = computeProposalId(base);
  return { text: unsigned({ sourceHash, idLinePlaceholder: `proposal_id: ${id}\n` }), id, sourceHash };
}

test("canonicalization drops the proposal_id line", () => {
  const { sourceHash } = signed();
  const withId = unsigned({ sourceHash, idLinePlaceholder: "proposal_id: deadbeef\n" });
  const withoutId = unsigned({ sourceHash });
  assert.equal(
    canonicalizeProposal(withId).toString("utf8"),
    canonicalizeProposal(withoutId).toString("utf8"),
  );
});

test("proposal_id is independent of the claimed id value", () => {
  const { sourceHash } = signed();
  const a = unsigned({ sourceHash, idLinePlaceholder: "proposal_id: aaaa\n" });
  const b = unsigned({ sourceHash, idLinePlaceholder: "proposal_id: bbbb\n" });
  assert.equal(computeProposalId(a), computeProposalId(b));
});

test("proposal_id is independent of line endings", () => {
  const { text } = signed();
  const crlf = text.replace(/\n/g, "\r\n");
  assert.equal(computeProposalId(crlf), computeProposalId(text));
});

test("canonical bytes end in exactly one newline", () => {
  const { text } = signed();
  const padded = text + "\n\n\n";
  const buf = canonicalizeProposal(padded).toString("utf8");
  assert.ok(buf.endsWith("\n"));
  assert.ok(!buf.endsWith("\n\n"));
});

test("proposal_id is the git blob SHA of the canonical bytes", () => {
  const { text } = signed();
  assert.equal(computeProposalId(text), gitBlobSha(canonicalizeProposal(text)));
});

test("a signed proposal verifies", () => {
  const { text, id } = signed();
  const v = verifyProposalId(text);
  assert.equal(v.ok, true);
  assert.equal(v.claimed, id);
  assert.equal(v.expected, id);
});

test("a tampered body fails id verification", () => {
  const { text } = signed();
  const tampered = text.replace("A demonstration concept", "A TAMPERED concept");
  const v = verifyProposalId(tampered);
  assert.equal(v.ok, false);
  assert.notEqual(v.claimed, v.expected);
});

test("source hash matches git blob SHA and verifies", () => {
  const { text, sourceHash } = signed();
  assert.equal(sourceHash, gitBlobSha(Buffer.from(SOURCE, "utf8")));
  const v = verifySourceHash(text, Buffer.from(SOURCE, "utf8"));
  assert.equal(v.ok, true);
  assert.equal(v.claimed, sourceHash);
});

test("a swapped source fails source verification", () => {
  const { text } = signed();
  const v = verifySourceHash(text, Buffer.from(SOURCE + "tampered\n", "utf8"));
  assert.equal(v.ok, false);
});

test("parseProposal extracts frontmatter and body", () => {
  const { text, id, sourceHash } = signed();
  const { front, body } = parseProposal(text);
  assert.equal(front.proposal_id, id);
  assert.equal(front.kind, "entity");
  assert.equal(front.origin.agent, "agent-a");
  assert.equal(front.scope.entity_type, "Concept");
  assert.equal(front.source.hash, sourceHash);
  assert.deepEqual(front.depends_on, []);
  assert.ok(body.startsWith("# Concept: demo"));
  assert.ok(body.includes("e-rel-demo-x"));
});

test("a payload without frontmatter is rejected", () => {
  assert.throws(() => parseProposal("# just a body\n"), /no `---` frontmatter/);
});
