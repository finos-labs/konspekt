```yaml
id: task-subgraph-first-retrieval
type: task
title: Subgraph-first retrieval as the default read path
status: open
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
# Task: Subgraph-first retrieval as the default read path

Restoring agents read two-to-eight times the bytes a question's answer actually
rests on. The sharded-edges A/B (240 trials, pin 3536326) measured this gap and
showed it is not a file-layout problem: 92-94% of bytes in both layouts came from
Grep, whole-entity reads and Glob, and agents rarely traversed typed edges at
all. The distance between what agents read and what answers need is the cost
[[goal-bounded-cost]] targets, and changing how agents read is the lever that
moves it.

Make subgraph-first reading the default retrieval procedure rather than
keyword-search-and-read-whatever-matches: resolve the entry entity, expand along
its typed edges hop by hop, and read only the entities the answer rests on. This
is a retrieval-behavior change (prompt, skill, and — where a store offers it —
the `neighbors(ref, direction)` query on the storage interface from
[[task-enterprise-persistence]]), not a serialization change.

The A/B's own follow-up is the first step: put the traversal procedure in the
agent prompt and re-run, measuring whether reads move toward the evidence floor.
Success is median read bytes approaching the per-question evidence subgraph, at
correctness held or better.
