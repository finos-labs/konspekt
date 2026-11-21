// Unit tests for the pure projections. No server, no filesystem — a synthetic
// graph shaped like loadInstance()'s return value.

import { test } from "node:test";
import assert from "node:assert/strict";
import { rowsFrom, statsFrom, goalsFrom, neighborsFrom, fullGraphFrom } from "../projections.mjs";

function makeGraph() {
  const nodes = [
    { entityType: "node", type: "goal", id: "goal-a", status: "open", review: "accepted", updatedAt: "2026-01-03T00:00:00Z", title: "Goal A" },
    { entityType: "node", type: "task", id: "task-1", status: "open", review: "proposed", updatedAt: "2026-01-02T00:00:00Z", provenance: { timestamp: "2025-11-01T00:00:00Z" } },
    { entityType: "node", type: "task", id: "task-2", status: "resolved", review: "accepted", updatedAt: "2026-01-01T00:00:00Z" },
  ];
  const noteworthy = [
    { entityType: "noteworthy", type: undefined, id: "nw-x", kind: "decision", review: "accepted", updatedAt: "2026-01-04T00:00:00Z" },
  ];
  const concepts = [], artifacts = [], waypoints = [];
  const edges = [
    { kind: "decomposes", from: { id: "goal-a" }, to: { id: "task-1" } },
    { kind: "decomposes", from: { id: "goal-a" }, to: { id: "task-2" } },
  ];
  const byId = new Map([...nodes, ...noteworthy].map((e) => [e.id, e]));
  return { nodes, concepts, noteworthy, artifacts, waypoints, edges, byId, meta: { counts: { edges: edges.length } } };
}

test("rowsFrom: newest change first, kind and status mapped", () => {
  const rows = rowsFrom(makeGraph());
  assert.equal(rows.length, 4);
  assert.equal(rows[0].id, "nw-x"); // 2026-01-04 is the most recent
  const t1 = rows.find((r) => r.id === "task-1");
  assert.deepEqual({ kind: t1.kind, status: t1.status, review: t1.review }, { kind: "task", status: "open", review: "proposed" });
  const nw = rows.find((r) => r.id === "nw-x");
  assert.equal(nw.kind, "noteworthy");
  assert.equal(nw.status, null); // a decision noteworthy has no node status
});

test("statsFrom: totals, per-kind split, oldest proposal", () => {
  const s = statsFrom(makeGraph(), Date.parse("2026-01-10T00:00:00Z"));
  assert.equal(s.total, 4);
  assert.equal(s.edges, 2);
  assert.equal(s.accepted, 3);
  assert.equal(s.proposed, 1);
  const task = s.byKind.find((k) => k.kind === "task");
  assert.deepEqual({ total: task.total, accepted: task.accepted, proposed: task.proposed }, { total: 2, accepted: 1, proposed: 1 });
  assert.equal(s.oldest.length, 1);
  assert.equal(s.oldest[0].id, "task-1");
  assert.ok(s.oldest[0].ageDays > 0, "proposed task-1 has a positive age");
});

test("goalsFrom: one goal with its decomposes roll-up", () => {
  const goals = goalsFrom(makeGraph());
  assert.equal(goals.length, 1);
  assert.equal(goals[0].id, "goal-a");
  assert.equal(goals[0].rollup.total, 2); // task-1 and task-2 reachable
  assert.deepEqual(goals[0].rollup.byStatus, { open: 1, resolved: 1 });
  assert.equal(goals[0].rollup.proposed, 1);
});

// task-ui-atom-neighborhood-graph: the neighbor list and the full graph.
function makeEdgeGraph() {
  const g = makeGraph();
  g.edges = [
    { id: "e1", kind: "decomposes", from: { type: "node", id: "goal-a" }, to: { type: "node", id: "task-1" }, review: "accepted" },
    { id: "e2", kind: "notes", from: { type: "node", id: "task-1" }, to: { type: "noteworthy", id: "nw-x" }, review: "proposed" },
    { id: "e3", kind: "links", from: { type: "node", id: "task-2" }, to: { type: "node", id: "task-1" }, review: "accepted" },
    { id: "e4", kind: "notes", from: { type: "node", id: "task-1" }, to: { type: "noteworthy", id: "nw-gone" }, review: "accepted" },
  ];
  return g;
}

test("neighborsFrom: both directions, all kinds, sorted by kind then direction", () => {
  const n = neighborsFrom(makeEdgeGraph(), "task-1");
  assert.equal(n.id, "task-1");
  assert.deepEqual(n.edges.map((e) => [e.kind, e.dir, e.neighbor.id]), [
    ["decomposes", "in", "goal-a"], ["links", "in", "task-2"], ["notes", "out", "nw-gone"], ["notes", "out", "nw-x"],
  ]);
  const nw = n.edges.find((e) => e.neighbor.id === "nw-x");
  assert.equal(nw.review, "proposed", "the edge's own review is carried");
  assert.deepEqual({ kind: nw.neighbor.kind, missing: nw.neighbor.missing }, { kind: "noteworthy", missing: false });
  assert.equal(n.edges.find((e) => e.neighbor.id === "nw-gone").neighbor.missing, true, "a dangling endpoint is marked missing");
  assert.equal(n.edges.find((e) => e.neighbor.id === "goal-a").neighbor.title, "Goal A");
  assert.equal(neighborsFrom(makeEdgeGraph(), "nope"), null);
});

test("fullGraphFrom: every entity, and only edges between entities", () => {
  const f = fullGraphFrom(makeEdgeGraph());
  assert.equal(f.nodes.length, 4);
  assert.deepEqual(f.edges.map((e) => e.id), ["e1", "e2", "e3"]);
  assert.equal(f.dangling, 1);
  assert.deepEqual(f.edges[1], { id: "e2", kind: "notes", from: "task-1", to: "nw-x", review: "proposed" });
});
