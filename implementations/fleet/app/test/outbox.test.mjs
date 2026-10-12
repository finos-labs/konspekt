import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import {
  assembleProposal,
  renderEdgesBlock,
  proposeToOutbox,
} from "../outbox.mjs";
import { computeEntityId, verifySourceHash } from "../payload.mjs";
import { splitEntityFile } from "../../../../lib/conformance.mjs";
import { setupFleet } from "../worktrees.mjs";

const IDENTITY = { name: "Test Committer", email: "test@konspekt.local" };

const SOURCE = `konspekt source excerpt — conversation: demo
2026-10-10

Denis: a proposed concept, please.
`;

function sampleProposal(overrides = {}) {
  return assembleProposal({
    entityType: "concept",
    fence: "id: concept-demo\nlabel: demo\ncreatedAt: 2026-10-10T16:00:00Z\nupdatedAt: 2026-10-10T16:00:00Z",
    prose: "# Concept: demo\n\nA demonstration concept.",
    confidence: 0.8,
    conversationId: "fleet-demo-1",
    timestamp: "2026-10-10T16:00:00Z",
    origin: { agent: "agent-a", model: "claude-opus-4-8", session: "fleet-demo-1" },
    binding: "task-fleet-worktree-committer",
    edges: [
      { id: "e-rel-demo-x", kind: "relates", from: "concept:concept-demo", to: "concept:concept-x", weight: 0.4, review: "proposed" },
    ],
    source: SOURCE,
    ...overrides,
  });
}

test("an assembled proposal is a stored-form atom addressed by its own content", () => {
  const a = sampleProposal();
  // The id is the content address of entity.md.
  assert.equal(a.proposalId, computeEntityId(a.entityMd));
  // The proposer owns review and provenance; they are in the fence.
  const { front } = splitEntityFile(a.entityMd);
  assert.equal(front.id, "concept-demo");
  assert.equal(front.review, "proposed");
  assert.equal(front.provenance.confidence, 0.8);
  assert.equal(front.provenance.sourceRef, front.provenance.contentHash);
  // contentHash addresses the source excerpt.
  assert.equal(verifySourceHash(a.entityMd, Buffer.from(a.sourceMd, "utf8")).ok, true);
  // The fleet envelope carries origin, binding, entity_type — not the atom.
  assert.equal(a.meta.origin.agent, "agent-a");
  assert.equal(a.meta.binding, "task-fleet-worktree-committer");
  assert.equal(a.meta.entity_type, "concept");
});

test("missing required fields are rejected at assembly", () => {
  assert.throws(() => sampleProposal({ origin: { model: "m", session: "s" } }), /origin\.agent/);
  assert.throws(() => sampleProposal({ confidence: null }), /confidence/);
  assert.throws(() => sampleProposal({ binding: "" }), /binding/);
  assert.throws(() => sampleProposal({ entityType: "" }), /entityType/);
  assert.throws(() => sampleProposal({ fence: "" }), /fence/);
});

test("renderEdgesBlock formats rows and emits a header-only table for none", () => {
  assert.ok(renderEdgesBlock([]).includes("| id | kind | from | to | weight | review |"));
  const block = renderEdgesBlock([
    { id: "e1", kind: "relates", from: "concept:a", to: "concept:b", weight: 0.5, review: "proposed" },
  ]);
  assert.ok(block.includes("| e1 | relates | concept:a | concept:b | 0.5 | proposed |"));
});

test("proposeToOutbox writes proposals/<id>/ into the proposer worktree only", () => {
  const root = mkdtempSync(join(tmpdir(), "konspekt-outbox-"));
  try {
    const f = setupFleet({ root, proposers: ["agent-a", "agent-b"], identity: IDENTITY });
    const a = f.proposerFor("agent-a");
    const b = f.proposerFor("agent-b");

    const assembled = sampleProposal();
    const { proposalId, dir, commit } = proposeToOutbox(a.path, assembled, { identity: IDENTITY });

    // The directory is named by the proposal id (the entity content address).
    assert.equal(basename(dir), proposalId);
    assert.equal(proposalId, computeEntityId(assembled.entityMd));
    assert.ok(/^[0-9a-f]{40}$/.test(commit));

    // The four files landed in agent-a's worktree.
    const base = join(a.path, "proposals", proposalId);
    assert.equal(computeEntityId(readFileSync(join(base, "entity.md"), "utf8")), proposalId);
    assert.ok(existsSync(join(base, "source.md")));
    assert.ok(existsSync(join(base, "edges.md")));
    assert.ok(existsSync(join(base, "meta.json")));

    // Nowhere else.
    assert.ok(!existsSync(join(b.path, "proposals", proposalId)));
    assert.ok(!existsSync(join(f.canonicalPath, "proposals", proposalId)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
