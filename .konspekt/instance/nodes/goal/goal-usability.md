```yaml
id: goal-usability
type: goal
title: Operate konspekt through a human interface
status: active
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
# Goal: Operate konspekt through a human interface

Make a konspekt instance operable by a human through a visual interface, not only
readable: select a goal, see its open tasks, and work through them — reviewing,
dispositioning, accepting, and resolving from the interface rather than by hand-
editing files. Where [[goal-observability]] makes the graph legible (read-only
projections and metrics), this goal makes it operable (navigate and act).

The existing read-only explorer [[artifact-visual-explorer]] under `visual/` is
the starting point: it renders the `decomposes` DAG but does not encode status or
review, does not navigate goal-to-open-tasks, and never writes. This goal
decomposes into closing that gap — status and review as visual channels and
filters, a goal-to-open-tasks view, and a work-through surface that can
disposition tasks. The write side is the review surface, which
`spec/architecture/REVIEW.md` holds as host policy (out of the standard) and
which must keep propose→accept intact: a human accepts, the model never does.
