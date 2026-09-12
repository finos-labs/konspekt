```yaml
id: task-visual-status-filters
type: task
title: Encode status and review as visual channels and filters
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
# Task: Encode status and review as visual channels and filters

The explorer [[artifact-visual-explorer]] currently shows all nodes with no
encoding of `status`, `review`, supersession, or time — `visual/README.md` notes
these "become filters in a later pass." Encode node `status` and `review` as
visual channels (for example color, shape, or opacity) and add filters, so a
human can show only the tasks that matter — for example open + accepted work, or
the proposed review queue.

Success: the explorer distinguishes node status and review at a glance and can be
filtered by them, and it stays a read-only projection of the instance.
