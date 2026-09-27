```yaml
id: goal-bounded-cost
type: goal
title: Restore cost stays bounded as the graph grows
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-27T22:50:00Z
review: accepted
provenance:
  sourceRef: bc1dc878a48b9fb0f292a721849de4953eb00448
  contentHash: bc1dc878a48b9fb0f292a721849de4953eb00448
  conversationId: edge-traversal-bounded-cost
  timestamp: 2026-09-27T22:50:00Z
  confidence: 0.8
createdAt: 2026-09-27T22:50:00Z
updatedAt: 2026-09-27T22:50:00Z
```
# Goal: Restore cost stays bounded as the graph grows

Keep the cost of restoring project context from a konspekt instance roughly flat
as the graph grows: a query reads the relevant subgraph, never the whole store.
This is the property konspekt controls, and the widening advantage over native
LLM memory (see [[concept-compounding-advantage]]) follows from it — native's
transcript corpus grows with the project while a bounded-cost graph does not.

Two levers keep retrieval bounded, and the 240-trial re-establishment run plus
the sharded-edges A/B told us which one to pull first:

- **How agents read** ([[task-subgraph-first-retrieval]]) — the live lever. The
  A/B measured reads running two-to-eight times the evidence subgraph a question
  needs; agents restore by searching, not by traversing typed edges. Closing that
  gap is where bounded cost is won at current scale.
- **How edges are laid out** ([[task-edge-traversal-layout]]) — the structural
  lever, held. Sharding the edge table measured neutral-to-negative at current
  scale (~357 edges); it is parked pending scale, per
  [[nw-scale-sufficient-hold-optimization]].

Progress is measured by the cost curve from graph analytics under
[[goal-observability]] — read bytes and retrieval tokens against the evidence
floor, tracked as the graph grows.
