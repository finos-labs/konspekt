// Shared test fixtures: a minimal conformant instance, a concept proposal, and
// a stand-up-and-fold helper. Not a *.test.mjs file, so the runner does not
// execute it directly.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setupFleet } from "../worktrees.mjs";
import { assembleProposal, renderEdgesBlock, proposeToOutbox } from "../outbox.mjs";
import { foldPass } from "../committer.mjs";
import { commitAll, git } from "../git.mjs";

export const IDENTITY = { name: "Test", email: "test@konspekt.local" };

// A minimal but conformant konspekt instance: a project, one accepted target
// node to wire proposals into, an empty edge table, and the target's transition
// birth rows.
export function writeSeed(dir) {
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

// A concept proposal whose body is a konspekt concept plus the edge wiring it.
export function conceptProposal({ agent = "agent-a", id = "concept-foo", edgeId = "e-foo", created = "2026-10-10T16:00:00Z" } = {}) {
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

// Stand up a one-proposer fleet, seed and commit canonical, propose each spec on
// agent-a, and fold them in one pass. Returns { fleet, res, proposals }.
export function standUpAndFold(root, specs = [{}]) {
  const fleet = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
  writeSeed(fleet.canonicalPath);
  commitAll(fleet.canonicalPath, "seed instance", { ...IDENTITY });
  const proposals = specs.map((s) => conceptProposal(s));
  for (const p of proposals) proposeToOutbox(fleet.proposerFor("agent-a").path, p, { identity: IDENTITY });
  const res = foldPass(fleet, { identity: IDENTITY });
  return { fleet, res, proposals };
}

export function commitCount(cwd) {
  return Number(git(cwd, ["rev-list", "--count", "HEAD"]));
}
