import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import {
  assembleProposal,
  renderEdgesBlock,
  proposeToOutbox,
} from "../outbox.mjs";
import { parseProposal, verifyProposalId, verifySourceHash } from "../payload.mjs";
import { setupFleet } from "../worktrees.mjs";

const IDENTITY = { name: "Test Committer", email: "test@konspekt.local" };

const SOURCE = `konspekt source excerpt — conversation: demo
2026-10-10

Denis: a proposed concept, please.
`;

function sampleProposal(overrides = {}) {
  return assembleProposal({
    origin: { agent: "agent-a", model: "claude-opus-4-8", session: "fleet-demo-1" },
    scope: { entity_type: "Concept", atom_state: "proposed" },
    target: { node: "new" },
    confidence: 0.8,
    binding: "task-fleet-worktree-committer",
    created: "2026-10-10T16:00:00Z",
    body:
      "# Concept: demo\n\nA demonstration concept.\n\n" +
      renderEdgesBlock([
        { id: "e-rel-demo-x", kind: "relates", from: "concept:concept-demo", to: "concept:concept-x", weight: 0.4, review: "proposed" },
      ]),
    source: SOURCE,
    ...overrides,
  });
}

test("an assembled proposal verifies against its own id and source", () => {
  const a = sampleProposal();
  assert.equal(verifyProposalId(a.proposalMd).ok, true);
  assert.equal(verifySourceHash(a.proposalMd, Buffer.from(a.sourceMd, "utf8")).ok, true);

  const { front } = parseProposal(a.proposalMd);
  assert.equal(front.proposal_id, a.proposalId);
  assert.equal(front.origin.agent, "agent-a");
  assert.equal(front.scope.entity_type, "Concept");
  assert.equal(front.binding, "task-fleet-worktree-committer");
  assert.equal(front.provenance.confidence, 0.8);
  assert.equal(front.source.path, `sources/${front.source.hash}.md`);
});

test("missing required fields are rejected at assembly", () => {
  assert.throws(() => sampleProposal({ origin: { model: "m", session: "s" } }), /origin\.agent/);
  assert.throws(() => sampleProposal({ confidence: null }), /confidence/);
  assert.throws(() => sampleProposal({ binding: "" }), /binding/);
});

test("renderEdgesBlock formats rows and is empty for none", () => {
  assert.equal(renderEdgesBlock([]), "");
  const block = renderEdgesBlock([
    { id: "e1", kind: "links", from: "node:a", to: "node:b", weight: 0.5, review: "proposed" },
  ]);
  assert.ok(block.includes("| e1 | links | node:a | node:b | 0.5 | proposed |"));
});

test("proposeToOutbox writes proposals/<id>/ into the proposer worktree only", () => {
  const root = mkdtempSync(join(tmpdir(), "konspekt-outbox-"));
  try {
    const f = setupFleet({ root, proposers: ["agent-a", "agent-b"], identity: IDENTITY });
    const a = f.proposerFor("agent-a");
    const b = f.proposerFor("agent-b");

    const assembled = sampleProposal();
    const { proposalId, dir, commit } = proposeToOutbox(a.path, assembled, { identity: IDENTITY });

    // The directory is named by the proposal id.
    assert.equal(basename(dir), proposalId);
    assert.ok(/^[0-9a-f]{40}$/.test(commit));

    // Payload landed in agent-a's worktree, verifiable from disk.
    const onDisk = readFileSync(join(a.path, "proposals", proposalId, "proposal.md"), "utf8");
    assert.equal(verifyProposalId(onDisk).ok, true);
    assert.ok(existsSync(join(a.path, "proposals", proposalId, "source.md")));

    // Nowhere else.
    assert.ok(!existsSync(join(b.path, "proposals", proposalId)));
    assert.ok(!existsSync(join(f.canonicalPath, "proposals", proposalId)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
