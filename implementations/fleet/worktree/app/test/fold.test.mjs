import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { foldProposal, foldProposals, parseEntityBody } from "../fold.mjs";
import { parseProposal } from "../payload.mjs";
import { assembleProposal, renderEdgesBlock, proposeToOutbox } from "../outbox.mjs";
import { setupFleet } from "../worktrees.mjs";
import { foldPass } from "../committer.mjs";
import { commitAll, git } from "../git.mjs";
import { loadInstance } from "../../../../../lib/conformance.mjs";

const IDENTITY = { name: "Test", email: "test@konspekt.local" };

// A minimal but conformant konspekt instance: a project, one accepted target
// node to wire proposals into, an empty edge table, and the transition birth
// rows for the target. Fold appends to edges/ and transitions/ and drops the
// entity and source files; the result must pass loadInstance with zero errors.
function writeSeed(dir) {
  const w = (rel, text) => {
    const p = join(dir, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, text, "utf8");
  };
  w("project.md", [
    "```yaml",
    "id: project-demo",
    "createdAt: 2026-10-01T00:00:00Z",
    "updatedAt: 2026-10-01T00:00:00Z",
    "```",
    "# Demo",
    "",
    "A seed instance for fold tests.",
    "",
  ].join("\n"));
  w("nodes/task/task-demo.md", [
    "```yaml",
    "id: task-demo",
    "type: task",
    "title: Demo target",
    "status: open",
    "review: accepted",
    "provenance:",
    "  timestamp: 2026-10-01T00:00:00Z",
    "createdAt: 2026-10-01T00:00:00Z",
    "updatedAt: 2026-10-01T00:00:00Z",
    "```",
    "# Task: Demo target",
    "",
    "A target to wire proposals into.",
    "",
  ].join("\n"));
  w("edges/edges.md", [
    "```yaml",
    "provenance:",
    "  conversationId: seed",
    "  timestamp: 2026-10-01T00:00:00Z",
    "review: accepted",
    "```",
    "# Edges",
    "",
    "| id | kind | from | to | weight | review |",
    "|----|------|------|----|--------|--------|",
    "",
  ].join("\n"));
  w("transitions/transitions.md", [
    "# Transitions",
    "",
    "| ref | field | from | to | timestamp | source | by |",
    "|-----|-------|------|----|-----------|--------|----|",
    "| node:task-demo | review |  | accepted | 2026-10-01T00:00:00Z |  |  |",
    "| node:task-demo | status |  | open | 2026-10-01T00:00:00Z |  |  |",
    "",
  ].join("\n"));
}

// Build a proposal whose body is a konspekt concept plus the edge that wires it.
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
    "Foo is a demo concept folded by the committer.",
    "",
    renderEdgesBlock([{ id: edgeId, kind: "mentions", from: "node:task-demo", to: `concept:${id}`, review: "proposed" }]).trimEnd(),
  ].join("\n");
  return assembleProposal({
    origin: { agent, model: "m", session: "demo-conv" },
    scope: { entity_type: "Concept", atom_state: "proposed" },
    confidence: 0.8,
    binding: "task-demo",
    created,
    body,
    source: `verbatim excerpt for ${id}\n`,
  });
}

const errorsOf = (dir) =>
  loadInstance(dir, { personas: [] }).problems.filter((p) => p.severity === "error");

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "konspekt-fold-")); });
afterEach(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ } });

test("parseEntityBody splits the fence, prose, and edge rows", () => {
  const p = conceptProposal();
  const { fenceText, prose, edgeRows } = parseEntityBody(parseProposal(p.proposalMd).body);
  assert.match(fenceText, /id: concept-foo/);
  assert.match(prose, /# Concept: Foo/);
  assert.equal(edgeRows.length, 1);
  assert.equal(edgeRows[0].kind, "mentions");
});

test("a folded concept yields a tree that passes lib/validate.mjs", () => {
  writeSeed(dir);
  const p = conceptProposal();
  const r = foldProposal(dir, { proposalMd: p.proposalMd, sourceMd: p.sourceMd }, {});

  assert.equal(r.entityId, "concept-foo");
  assert.equal(r.file, "concepts/concept-foo.md");
  assert.ok(existsSync(join(dir, "concepts/concept-foo.md")));
  assert.ok(existsSync(join(dir, "sources", `${r.sourceRef}.md`)));

  const errs = errorsOf(dir);
  assert.equal(errs.length, 0, JSON.stringify(errs, null, 2));
});

test("the folded entity carries review: proposed and the provenance link", () => {
  writeSeed(dir);
  const p = conceptProposal();
  const r = foldProposal(dir, { proposalMd: p.proposalMd, sourceMd: p.sourceMd }, {});
  const text = readFileSync(join(dir, "concepts/concept-foo.md"), "utf8");
  assert.match(text, /review: proposed/);
  assert.match(text, new RegExp(`sourceRef: ${r.sourceRef}`));
  assert.match(text, new RegExp(`contentHash: ${r.sourceRef}`));
  assert.match(text, /confidence: 0.8/);
  // The committer injects, so a proposer-supplied review/provenance is replaced.
  assert.equal((text.match(/review:/g) || []).length, 1);
});

test("folding two concepts in one batch keeps the tree valid", () => {
  writeSeed(dir);
  const a = conceptProposal({ id: "concept-foo", edgeId: "e-foo", created: "2026-10-10T16:00:00Z" });
  const b = conceptProposal({ id: "concept-bar", edgeId: "e-bar", created: "2026-10-10T16:05:00Z" });
  const { folded, setAside } = foldProposals(
    dir,
    [a, b].map((p) => ({ proposalId: p.proposalId, proposalMd: p.proposalMd, sourceMd: p.sourceMd })),
    {}
  );
  assert.equal(folded.length, 2);
  assert.equal(setAside.length, 0);
  assert.equal(errorsOf(dir).length, 0, JSON.stringify(errorsOf(dir), null, 2));
});

test("a proposal with no wiring edge is set aside, not folded", () => {
  writeSeed(dir);
  const body = [
    "```yaml",
    "id: concept-lonely",
    "label: Lonely",
    "createdAt: 2026-10-10T16:00:00Z",
    "updatedAt: 2026-10-10T16:00:00Z",
    "```",
    "# Concept: Lonely",
    "",
    "No edge wires this.",
    "",
  ].join("\n");
  const p = assembleProposal({
    origin: { agent: "agent-a", model: "m", session: "s" },
    scope: { entity_type: "Concept", atom_state: "proposed" },
    confidence: 0.5, binding: "none:exploratory", created: "2026-10-10T16:00:00Z",
    body, source: "x\n",
  });
  const { folded, setAside } = foldProposals(dir, [{ proposalId: p.proposalId, proposalMd: p.proposalMd, sourceMd: p.sourceMd }], {});
  assert.equal(folded.length, 0);
  assert.equal(setAside.length, 1);
  assert.match(setAside[0].reason, /must land wired/);
});

test("foldPass folds the verified batch onto canonical in one commit", () => {
  const root = mkdtempSync(join(tmpdir(), "konspekt-foldpass-"));
  try {
    const fleet = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
    // Seed the canonical worktree with the instance, then commit the seed.
    writeSeed(fleet.canonicalPath);
    commitAll(fleet.canonicalPath, "seed instance", { ...IDENTITY });

    const before = commitCount(fleet.canonicalPath);
    const p = conceptProposal();
    proposeToOutbox(fleet.proposerFor("agent-a").path, p, { identity: IDENTITY });

    const res = foldPass(fleet, { identity: IDENTITY });
    assert.equal(res.folded.length, 1);
    assert.ok(res.commit);
    assert.equal(commitCount(fleet.canonicalPath), before + 1, "fold is exactly one commit");
    assert.equal(errorsOf(fleet.canonicalPath).length, 0, JSON.stringify(errorsOf(fleet.canonicalPath), null, 2));
  } finally {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

function commitCount(cwd) {
  return Number(git(cwd, ["rev-list", "--count", "HEAD"]));
}
