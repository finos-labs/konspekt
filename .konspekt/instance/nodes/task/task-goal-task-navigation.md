```yaml
id: task-goal-task-navigation
type: task
title: Navigate from a goal to its open tasks
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-11T19:00:00Z
review: accepted
provenance:
  sourceRef: edb20fa06fbb6ca03cf4fc84b0a3dbe19b3b9b89
  contentHash: edb20fa06fbb6ca03cf4fc84b0a3dbe19b3b9b89
  conversationId: roadmap-plan
  timestamp: 2026-09-11T19:00:00Z
  confidence: 0.8
createdAt: 2026-09-11T19:00:00Z
updatedAt: 2026-09-11T19:00:00Z
```
# Task: Navigate from a goal to its open tasks

A task-centric view over the graph: select a goal and see its open tasks — the
tasks reachable from it through `decomposes` — so a human can pick a goal and
work its queue. This is the "select a goal, see open tasks" of [[goal-usability]],
and it reuses the same reachability walk `tools/roadmap.mjs` already computes.
Builds on the explorer [[artifact-visual-explorer]].

Success: from a chosen goal the interface lists its open tasks (filtered by
status and review), giving the human an entry point into the work rather than the
whole DAG at once.
