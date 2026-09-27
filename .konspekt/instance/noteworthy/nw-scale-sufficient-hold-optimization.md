```yaml
id: nw-scale-sufficient-hold-optimization
kind: statement
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
# Noteworthy: At current scale the record is sufficient; hold edge-layer optimization until scale rises

The two-arm re-establishment run (240 trials, native memory versus konspekt)
established konspekt's compounding advantage at current scale; it is recorded in
[[concept-compounding-advantage]] and [[nw-native-restore-stale-on-live-state]].
At this scale (~357 edges, one dogfooded project) the record is already
sufficient, and further structural optimization of the edge layer is not worth
building.

The sharded-edges A/B (pin 3536326, no native arm — it compared the graph's own
restore cost in two edge layouts) measured sharding neutral-to-negative: medians
differed by under 5%, correctness was 117 versus 116.5 of 120, and sharding added
Grep noise because each edge row then appears three times (shard, backlink,
projection). The same reasoning covers an in-memory adjacency index: its benefit
is a bet on scale, and at ~357 edges a whole-table read is cheap, so structure
optimization has little to bite on. The larger, earlier-scaling cost is
entry-point search, which neither sharding nor an adjacency index addresses.

Revisit only when scale rises materially — teams of agents, or multi-project /
collaborative instances ([[goal-collaboration]]) — where whole-table reads begin
to dominate (estimated crossover ~1-2k edges).

Scope: this holds [[task-edge-traversal-layout]] and the sharding layout explored
on the `sharded-edges-advantage-compounding-test` branch. It does not hold
[[task-subgraph-first-retrieval]], which targets a live gap the same A/B showed —
reads ran two-to-eight times the evidence floor — and is accepted alongside
[[goal-bounded-cost]].
