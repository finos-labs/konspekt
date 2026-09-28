```yaml
id: nw-fleet-serialized-committer
kind: decision
review: accepted
provenance:
  sourceRef: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  contentHash: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  conversationId: fleet-implementation
  timestamp: 2026-09-28T23:07:00Z
  confidence: 0.95
createdAt: 2026-09-28T23:07:00Z
updatedAt: 2026-09-28T23:07:00Z
```
# Noteworthy: the git fleet cut runs on a serialized single-writer committer

The first git fleet cut uses a **serialized single-writer committer**, not
parallel committers. Agents are **proposal producers**, never git committers to
canonical. The layout is **N+1 worktrees off one object store**: one worktree
per proposer agent on its own outbox branch, plus one committer worktree holding
the canonical branch. A linked worktree binds to one branch, so one worktree per
agent yields one outbox branch per agent by construction.

Propose is grow-only and content-addressed, so N concurrent proposers are
near-free at the data layer and all pressure moves to acceptance. The committer
appends to a durable `proposed` ref in arrival order with rebase-append on
residual contention. Agents **read canonical and never write it**, so there is
no per-agent local graph to reconcile: sync is one-directional, outbox to
committer to canonical.

This **decouples the edge-table shard from fleet**: serialized committing does
not need [[task-edge-traversal-layout]]'s split, whose real payoff is traversal
cost. Per-agent-branch parallel commit is deferred until a measured throughput
reason exists, since a single committer absorbs a high append rate.

Scopes [[task-agent-fleet]]; relates to [[task-edge-traversal-layout]].
