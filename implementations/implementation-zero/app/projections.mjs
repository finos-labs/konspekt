// implementation_zero — pure projections over a loaded graph.
//
// These take a graph object as returned by loadInstance() in lib/conformance.mjs
// and return the shapes the read-only view consumes. They are pure (no I/O, no
// wall-clock beyond Date.now for age), which is what makes them unit-testable
// without starting the server. goalsFrom reuses goalState() from the shared query
// layer so the decomposes walk lives once (nw-derive-not-copy).

import { goalState } from "../../../lib/views.mjs";

// Fixed entity-kind order for the change feed and the stats view.
export const KIND_ORDER = ["goal", "investigation", "experiment", "topic", "task", "note",
  "concept", "noteworthy", "artifact", "waypoint"];

// Visit every entity with its display kind (node.type for nodes, entityType
// otherwise) and its node status where one exists (null otherwise).
export function eachEntity(g, fn) {
  for (const e of g.nodes) fn(e, e.type || "node", e.status ?? null);
  for (const e of g.concepts) fn(e, "concept", null);
  for (const e of g.noteworthy) fn(e, "noteworthy", e.status ?? null);
  for (const e of g.artifacts) fn(e, "artifact", null);
  for (const e of g.waypoints) fn(e, "waypoint", null);
}

export const bestTs = (e) => e.updatedAt || (e.summary && e.summary.updatedAt) ||
  e.createdAt || (e.provenance && e.provenance.timestamp) || null;

// One flat row per entity for the change feed, newest change first.
export function rowsFrom(g) {
  const out = [];
  eachEntity(g, (e, kind, status) =>
    out.push({ id: e.id, kind, status: status ?? null, review: e.review ?? null, updatedAt: bestTs(e) }));
  const ts = (r) => (r.updatedAt ? Date.parse(r.updatedAt) || 0 : 0);
  out.sort((a, b) => ts(b) - ts(a) || (a.id < b.id ? -1 : 1));
  return out;
}

// Counts by kind (total / proposed / accepted), totals, and the oldest
// unaccepted proposals by age — the measures task-graph-analytics names.
export function statsFrom(g, now = Date.now()) {
  const groups = {};
  const all = [];
  eachEntity(g, (e, kind) => {
    const x = groups[kind] || (groups[kind] = { total: 0, proposed: 0, accepted: 0 });
    x.total++;
    if (e.review === "accepted") x.accepted++;
    else if (e.review === "proposed") x.proposed++;
    all.push({ id: e.id, kind, review: e.review ?? null, ts: (e.provenance && e.provenance.timestamp) || e.createdAt || null });
  });
  const oldest = all
    .filter((x) => x.review === "proposed" && x.ts)
    .map((x) => ({ id: x.id, kind: x.kind, ageDays: Math.max(0, Math.floor((now - Date.parse(x.ts)) / 86400000)) }))
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 10);
  return {
    total: all.length,
    edges: g.edges.length,
    accepted: all.filter((x) => x.review === "accepted").length,
    proposed: all.filter((x) => x.review === "proposed").length,
    byKind: KIND_ORDER.filter((k) => groups[k]).map((k) => ({ kind: k, ...groups[k] })),
    oldest,
  };
}

// The goals list with a decomposes roll-up per goal (reuses goalState).
export function goalsFrom(g) {
  const rank = (r) => (r.review === "accepted" ? 0 : 1);
  return g.nodes
    .filter((n) => n.type === "goal")
    .map((gl) => {
      let rollup = { total: 0, byStatus: {}, proposed: 0 };
      try { rollup = goalState(g, gl.id).rollup; } catch { /* leave empty */ }
      return { id: gl.id, title: gl.title || gl.id, status: gl.status ?? null, review: gl.review ?? null, rollup };
    })
    .sort((a, b) => rank(a) - rank(b) || (a.id < b.id ? -1 : 1));
}
