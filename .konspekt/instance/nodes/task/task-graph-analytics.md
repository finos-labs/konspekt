```yaml
id: task-graph-analytics
type: task
title: Analytics and mining over the graph
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-08-28T11:49:13Z
review: proposed
provenance:
  sourceRef: 59f0929da44315acea7393b38a6a9db554f5d523
  contentHash: 59f0929da44315acea7393b38a6a9db554f5d523
  timestamp: 2026-08-28T11:49:13Z
  confidence: 0.9
createdAt: 2026-08-28T11:49:13Z
updatedAt: 2026-08-28T11:49:13Z
```
# Task: Analytics and mining over the graph

Queries over nodes and edges that surface structure and history, run outside
the store as projections the way inventories already are.

Open questions, roughly in dependency order:

**What is measured.** Edge density, provenance depth, proposal and acceptance
counts, and the age of proposals that never landed.

**Overlap with the effectiveness research.** These are the same measures
`investigation-validation` needs. The capability is general and the research is
its first consumer, rather than the reverse.

**Where results live.** Output is derived and regenerable, so it is a
projection and is never written back into the graph as nodes.

Success is a projection reporting edge density and unaccepted-proposal age for
an instance without adding anything to the graph.
