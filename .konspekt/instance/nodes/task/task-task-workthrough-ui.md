```yaml
id: task-task-workthrough-ui
type: task
title: Work through and disposition tasks in the interface
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
  confidence: 0.7
createdAt: 2026-09-11T19:00:00Z
updatedAt: 2026-09-11T19:00:00Z
```
# Task: Work through and disposition tasks in the interface

A write-capable surface that lets a human go through tasks and disposition them
from the interface — apply the authority verbs (`resolve` / `abandon` /
`validate` / `refute` / `pin` / `lift`) and accept or reject proposals — instead
of hand-editing files. The "go through them" half of [[goal-usability]].

Two constraints bound this. First, it is the **review surface**, which
`spec/architecture/REVIEW.md` holds as host policy, out of the standard and free
to differ per binding; this task is one such surface, not a change to the
standard. Second, it **writes to the instance**, so it must keep propose→accept
intact: a human originates every acceptance, the model never does. Larger and
later than the read-side tasks; it depends on a write path to the store, which
the current snapshot explorer does not have.

Success: a human can move through a goal's tasks and record accept/reject and
authority-verb dispositions from the interface, with every write honoring the
propose→accept invariant.
