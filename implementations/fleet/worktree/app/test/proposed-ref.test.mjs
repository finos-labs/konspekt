import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupFleet } from "../worktrees.mjs";
import { assembleProposal, renderEdgesBlock, proposeToOutbox } from "../outbox.mjs";
import { foldPass } from "../committer.mjs";
import { commitAll } from "../git.mjs";
import {
  buildIndex, rebuildIndex, materializeIndex, readMaterializedIndex, readFoldLog, FLEET_DIR,
} from "../proposed-ref.mjs";

const IDENTITY = { name: "Test", email: "test@konspekt.local" };

function writeSeed(dir) {
  const w = (rel, text) => {
    const p = join(dir, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, text, "utf8");
  };
  w("project.md", "```yaml\nid: project-demo\ncreatedAt: 2026-10-01T00:00:00Z\nupdatedAt: 2026-10-01T00:00:00Z\n```\n# Demo\n\nSeed.\n");
  w("nodes/task/task-demo.md",
    "```yaml\nid: task-demo\ntype: task\ntitle: Demo target\nstatus: open\nreview: accepted\nprovenance:\n  timestamp: 2026-10-01T00:00:00Z\ncreatedAt: 2026-10-01T00:00:00Z\nupdatedAt: 2026-10-01T00:00:00Z\n```\n# Task: Demo target\n\nTarget.\n");
  w("edges/edges.md",
    "```yaml\nprovenance:\n  conversationId: seed\n  timestamp: 2026-10-01T00:00:00Z\nreview: accepted\n```\n# Edges\n\n| id | kind | from | to | weight | review |\n|----|------|------|----|--------|--------|\n");
  w("transitions/transitions.md",
    "# Transitions\n\n| ref | field | from | to | timestamp | source | by |\n|-----|-------|------|----|-----------|--------|----|\n| node:task-demo | review |  | accepted | 2026-10-01T00:00:00Z |  |  |\n| node:task-demo | status |  | open | 2026-10-01T00:00:00Z |  |  |\n");
}

function conceptProposal({ agent = "agent-a", id = "concept-foo", edgeId = "e-foo", created = "2026-10-10T16:00:00Z" } = {}) {
  const body = [
    "```yaml",
    `id: ${id}`,
    "label: Foo",
    `createdAt: ${created}`,
    `updatedAt: ${created}`,
    "```",
    "# Concept: Foo",
    "",
    "A demo concept.",
    "",
    renderEdgesBlock([{ id: edgeId, kind: "mentions", from: "node:task-demo", to: `concept:${id}`, review: "proposed" }]).trimEnd(),
  ].join("\n");
  return assembleProposal({
    origin: { agent, model: "m", session: "demo-conv" },
    scope: { entity_type: "Concept", atom_state: "proposed" },
    confidence: 0.8, binding: "task-demo", created, body, source: `excerpt for ${id}\n`,
  });
}

// Stand up a fleet, seed canonical, fold one proposal, return the fleet and the
// fold result.
function foldOne(root) {
  const fleet = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
  writeSeed(fleet.canonicalPath);
  commitAll(fleet.canonicalPath, "seed instance", { ...IDENTITY });
  const p = conceptProposal();
  proposeToOutbox(fleet.proposerFor("agent-a").path, p, { identity: IDENTITY });
  const res = foldPass(fleet, { identity: IDENTITY });
  return { fleet, res, proposalId: p.proposalId };
}

let root;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "konspekt-index-")); });
afterEach(() => { try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ } });

test("fold writes a fold-log row linking proposal_id to the atom, in the fold commit", () => {
  const { fleet, proposalId } = foldOne(root);
  const log = readFoldLog(fleet.canonicalPath);
  assert.equal(log.length, 1);
  assert.equal(log[0].proposalId, proposalId);
  assert.equal(log[0].ref, "concept:concept-foo");
  assert.equal(log[0].agent, "agent-a");
  // The log lives outside the validated instance tree.
  assert.ok(existsSync(join(fleet.canonicalPath, FLEET_DIR, "folded.md")));
});

test("buildIndex classifies a folded proposal as pending with its canonical-commit pointer", () => {
  const { fleet, res, proposalId } = foldOne(root);
  const index = buildIndex(fleet.canonicalPath);
  assert.equal(index.counts.total, 1);
  assert.equal(index.counts.pending, 1);
  const e = index.entries[0];
  assert.equal(e.proposalId, proposalId);
  assert.equal(e.state, "pending");
  assert.equal(e.review, "proposed");
  assert.equal(e.file, "concepts/concept-foo.md");
  assert.equal(e.commit, res.commit, "pointer is the fold commit");
});

test("rebuild from canonical after a crash (index never materialized) is correct", () => {
  const { fleet } = foldOne(root);
  // Simulate a crash between the fold commit and the index update: no index file.
  assert.equal(readMaterializedIndex(fleet.canonicalPath), null);

  const rebuilt = rebuildIndex(fleet.canonicalPath);
  const fresh = buildIndex(fleet.canonicalPath);
  assert.deepEqual(rebuilt, fresh, "rebuild equals a fresh build — canonical is the only input");
  assert.equal(rebuilt.counts.pending, 1);
  // The recovery entry point also persisted the cache.
  assert.deepEqual(readMaterializedIndex(fleet.canonicalPath), rebuilt);
});

test("a stale materialized index is overwritten from canonical on rebuild", () => {
  const { fleet, proposalId } = foldOne(root);
  // Hand-write a lie: claim the pending proposal is accepted.
  materializeIndex(fleet.canonicalPath, {
    entries: [{ proposalId, ref: "concept:concept-foo", state: "accepted", review: "accepted", agent: "agent-a", file: "concepts/concept-foo.md", commit: null }],
    counts: { pending: 0, accepted: 1, rejected: 0, missing: 0, unknown: 0, total: 1 },
  });
  const rebuilt = rebuildIndex(fleet.canonicalPath);
  assert.equal(rebuilt.counts.accepted, 0);
  assert.equal(rebuilt.counts.pending, 1, "canonical says proposed, so the truth is pending");
});

test("index follows the atom's review field: accepted and rejected are derived, not stored separately", () => {
  const { fleet } = foldOne(root);
  const file = join(fleet.canonicalPath, "concepts", "concept-foo.md");

  // Simulate bless: flip review to accepted on canonical and commit.
  writeFileSync(file, readFileSync(file, "utf8").replace("review: proposed", "review: accepted"), "utf8");
  commitAll(fleet.canonicalPath, "bless concept-foo", { ...IDENTITY });
  assert.equal(buildIndex(fleet.canonicalPath).counts.accepted, 1);

  // Simulate reject: flip to rejected.
  writeFileSync(file, readFileSync(file, "utf8").replace("review: accepted", "review: rejected"), "utf8");
  commitAll(fleet.canonicalPath, "reject concept-foo", { ...IDENTITY });
  const idx = buildIndex(fleet.canonicalPath);
  assert.equal(idx.counts.rejected, 1);
  assert.equal(idx.counts.accepted, 0);
});
