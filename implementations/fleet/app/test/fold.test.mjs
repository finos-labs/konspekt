import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { foldProposal, foldProposals, parseEdgeRows } from "../fold.mjs";
import { assembleProposal, proposeToOutbox } from "../outbox.mjs";
import { setupFleet } from "../worktrees.mjs";
import { foldPass } from "../committer.mjs";
import { commitAll } from "../git.mjs";
import { loadInstance } from "../../../../lib/conformance.mjs";
import { writeSeed, conceptProposal, commitCount, IDENTITY } from "./_fixtures.mjs";

const errorsOf = (dir) =>
  loadInstance(dir, { personas: [] }).problems.filter((p) => p.severity === "error");

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "konspekt-fold-")); });
afterEach(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ } });

test("parseEdgeRows reads the table body and skips the header", () => {
  const rows = parseEdgeRows(conceptProposal().edgesMd);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].kind, "mentions");
  assert.equal(rows[0].review, "proposed");
});

test("a folded concept yields a tree that passes lib/validate.mjs", () => {
  writeSeed(dir);
  const p = conceptProposal();
  const r = foldProposal(dir, p, {});

  assert.equal(r.entityId, "concept-foo");
  assert.equal(r.file, "concepts/concept-foo.md");
  assert.ok(existsSync(join(dir, "concepts/concept-foo.md")));
  assert.ok(existsSync(join(dir, "sources", `${r.sourceRef}.md`)));

  const errs = errorsOf(dir);
  assert.equal(errs.length, 0, JSON.stringify(errs, null, 2));
});

test("the folded entity is the proposer's atom verbatim and addresses back to the proposal id", () => {
  writeSeed(dir);
  const p = conceptProposal();
  const r = foldProposal(dir, p, {});
  const text = readFileSync(join(dir, "concepts/concept-foo.md"), "utf8");
  // The committer copies entity.md byte for byte — no translation, one review.
  assert.equal(text, p.entityMd);
  assert.equal((text.match(/review:/g) || []).length, 1);
  assert.match(text, /review: proposed/);
  assert.match(text, new RegExp(`sourceRef: ${r.sourceRef}`));
  assert.match(text, new RegExp(`contentHash: ${r.sourceRef}`));
  assert.match(text, /confidence: 0.8/);
});

test("fold records the proposing agent in the transition `by` column", () => {
  writeSeed(dir);
  foldProposal(dir, conceptProposal({ agent: "agent-a" }), {});
  const tx = readFileSync(join(dir, "transitions/transitions.md"), "utf8");
  assert.match(tx, /\| concept:concept-foo \| review \|  \| proposed \|[^|]*\|  \| agent-a \|/);
});

test("folding two concepts in one batch keeps the tree valid", () => {
  writeSeed(dir);
  const a = conceptProposal({ id: "concept-foo", edgeId: "e-foo", created: "2026-10-10T16:00:00Z" });
  const b = conceptProposal({ id: "concept-bar", edgeId: "e-bar", created: "2026-10-10T16:05:00Z" });
  const { folded, setAside } = foldProposals(dir, [a, b], {});
  assert.equal(folded.length, 2);
  assert.equal(setAside.length, 0);
  assert.equal(errorsOf(dir).length, 0, JSON.stringify(errorsOf(dir), null, 2));
});

test("a proposal with no wiring edge is set aside, not folded", () => {
  writeSeed(dir);
  const p = assembleProposal({
    entityType: "concept",
    fence: "id: concept-lonely\nlabel: Lonely\ncreatedAt: 2026-10-10T16:00:00Z\nupdatedAt: 2026-10-10T16:00:00Z",
    prose: "# Concept: Lonely\n\nNo edge wires this.",
    confidence: 0.5, conversationId: "s", timestamp: "2026-10-10T16:00:00Z",
    origin: { agent: "agent-a", model: "m", session: "s" }, binding: "none:exploratory",
    edges: [], source: "x\n",
  });
  const { folded, setAside } = foldProposals(dir, [p], {});
  assert.equal(folded.length, 0);
  assert.equal(setAside.length, 1);
  assert.match(setAside[0].reason, /must land wired/);
});

test("re-folding the same proposal is an idempotent no-op (already folded)", () => {
  writeSeed(dir);
  const p = conceptProposal();
  const r1 = foldProposal(dir, p, {});
  assert.equal(r1.status, "folded");

  const entity = readFileSync(join(dir, "concepts/concept-foo.md"), "utf8");
  const edges = readFileSync(join(dir, "edges/edges.md"), "utf8");
  const tx = readFileSync(join(dir, "transitions/transitions.md"), "utf8");

  const r2 = foldProposal(dir, p, {});
  assert.equal(r2.status, "already-folded");
  // Nothing rewritten: entity, edges, and transitions are byte-for-byte unchanged.
  assert.equal(readFileSync(join(dir, "concepts/concept-foo.md"), "utf8"), entity);
  assert.equal(readFileSync(join(dir, "edges/edges.md"), "utf8"), edges);
  assert.equal(readFileSync(join(dir, "transitions/transitions.md"), "utf8"), tx);
  assert.equal(errorsOf(dir).length, 0);
});

test("a re-fold cannot clobber a blessed review back to proposed", () => {
  writeSeed(dir);
  const p = conceptProposal();
  foldProposal(dir, p, {});
  // Simulate a human bless: flip the folded atom's review to accepted.
  const file = join(dir, "concepts/concept-foo.md");
  writeFileSync(file, readFileSync(file, "utf8").replace("review: proposed", "review: accepted"), "utf8");

  const r = foldProposal(dir, p, {});
  assert.equal(r.status, "already-folded");
  assert.match(readFileSync(file, "utf8"), /review: accepted/);
  assert.doesNotMatch(readFileSync(file, "utf8"), /review: proposed/);
});

test("a same-id proposal with a different source hash is an id collision, set aside", () => {
  writeSeed(dir);
  foldProposal(dir, conceptProposal(), {});
  const collider = assembleProposal({
    entityType: "concept",
    fence: ["id: concept-foo", "label: Foo Two", "createdAt: 2026-10-10T16:00:00Z", "updatedAt: 2026-10-10T16:00:00Z"].join("\n"),
    prose: "# Concept: Foo Two\n\nSame id, different content and source.",
    confidence: 0.8, conversationId: "demo-conv", timestamp: "2026-10-10T16:00:00Z",
    origin: { agent: "agent-a", model: "m", session: "demo-conv" }, binding: "task-demo",
    edges: [{ id: "e-foo2", kind: "mentions", from: "node:task-demo", to: "concept:concept-foo", review: "proposed" }],
    source: "a DIFFERENT excerpt for concept-foo\n",
  });
  const { folded, alreadyFolded, setAside } = foldProposals(dir, [collider], {});
  assert.equal(folded.length, 0);
  assert.equal(alreadyFolded.length, 0);
  assert.equal(setAside.length, 1);
  assert.match(setAside[0].reason, /id collision/);
});

test("foldPass folds the verified batch onto canonical in one commit", () => {
  const root = mkdtempSync(join(tmpdir(), "konspekt-foldpass-"));
  try {
    const fleet = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
    writeSeed(fleet.canonicalPath);
    commitAll(fleet.canonicalPath, "seed instance", { ...IDENTITY });

    const before = commitCount(fleet.canonicalPath);
    proposeToOutbox(fleet.proposerFor("agent-a").path, conceptProposal(), { identity: IDENTITY });

    const res = foldPass(fleet, { identity: IDENTITY });
    assert.equal(res.folded.length, 1);
    assert.ok(res.commit);
    assert.equal(commitCount(fleet.canonicalPath), before + 1, "fold is exactly one commit");
    assert.equal(errorsOf(fleet.canonicalPath).length, 0, JSON.stringify(errorsOf(fleet.canonicalPath), null, 2));
  } finally {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

test("a second foldPass over an un-consumed outbox folds nothing and makes no commit", () => {
  const root = mkdtempSync(join(tmpdir(), "konspekt-foldpass-"));
  try {
    const fleet = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
    writeSeed(fleet.canonicalPath);
    commitAll(fleet.canonicalPath, "seed instance", { ...IDENTITY });
    proposeToOutbox(fleet.proposerFor("agent-a").path, conceptProposal(), { identity: IDENTITY });

    const first = foldPass(fleet, { identity: IDENTITY });
    assert.equal(first.folded.length, 1);
    const afterFirst = commitCount(fleet.canonicalPath);
    const entity = readFileSync(join(fleet.canonicalPath, "concepts/concept-foo.md"), "utf8");

    // The proposer has NOT consumed its outbox; the proposal is still present.
    const second = foldPass(fleet, { identity: IDENTITY });
    assert.equal(second.folded.length, 0);
    assert.equal(second.alreadyFolded.length, 1);
    assert.equal(second.commit, null, "no commit when nothing new is folded");
    assert.equal(commitCount(fleet.canonicalPath), afterFirst, "canonical gains no commit");
    assert.equal(readFileSync(join(fleet.canonicalPath, "concepts/concept-foo.md"), "utf8"), entity);
  } finally {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

// ----- carried files (task-fleet-proposal-carries-files) -----

function conceptWithFile(fileSpec) {
  return assembleProposal({
    entityType: "concept",
    fence: "id: concept-foo\nlabel: Foo\ncreatedAt: 2026-10-10T16:00:00Z\nupdatedAt: 2026-10-10T16:00:00Z",
    prose: "# Concept: Foo\n\nbody.",
    confidence: 0.8,
    conversationId: "s",
    timestamp: "2026-10-10T16:00:00Z",
    origin: { agent: "agent-a", model: "m", session: "s" },
    binding: "task-demo",
    edges: [{ id: "e-foo", kind: "mentions", from: "node:task-demo", to: "concept:concept-foo", review: "proposed" }],
    source: "excerpt\n",
    files: [fileSpec],
  });
}

test("foldProposal writes a carried file to the repo root and reports it", () => {
  writeSeed(dir);
  const p = conceptWithFile({ path: "docs/analysis/x.md", bytes: "carried body\n" });
  const r = foldProposal(dir, p, { repoRoot: dir, instanceSubdir: "" });
  assert.deepEqual(r.files, [{ path: "docs/analysis/x.md", hash: p.meta.files[0].hash }]);
  assert.equal(readFileSync(join(dir, "docs/analysis/x.md"), "utf8"), "carried body\n");
  // The atom still folded and the tree is still valid.
  assert.equal(errorsOf(dir).length, 0);
});

test("foldProposal re-checks the carried-file hash and refuses a mismatch", () => {
  writeSeed(dir);
  const p = conceptWithFile({ path: "docs/x.md", bytes: "good\n" });
  const tampered = { ...p, files: p.files.map((f) => ({ ...f, bytes: Buffer.from("evil\n") })) };
  assert.throws(() => foldProposal(dir, tampered, { repoRoot: dir }), /hash mismatch at fold/);
  assert.ok(!existsSync(join(dir, "docs/x.md")));
});

test("foldPass lands a carried file on canonical in the fold commit", () => {
  const root = mkdtempSync(join(tmpdir(), "konspekt-foldfiles-"));
  try {
    const fleet = setupFleet({ root, proposers: ["agent-a"], identity: IDENTITY });
    writeSeed(fleet.canonicalPath);
    commitAll(fleet.canonicalPath, "seed", { ...IDENTITY });
    const p = conceptWithFile({ path: "docs/x.md", bytes: "landed\n" });
    proposeToOutbox(fleet.proposerFor("agent-a").path, p, { identity: IDENTITY });
    const res = foldPass(fleet, { identity: IDENTITY });
    assert.equal(res.folded.length, 1);
    assert.deepEqual(res.folded[0].files, [{ path: "docs/x.md", hash: p.meta.files[0].hash }]);
    assert.equal(readFileSync(join(fleet.canonicalPath, "docs/x.md"), "utf8"), "landed\n");
  } finally {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});
