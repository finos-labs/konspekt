```yaml
id: task-binding-operating-behavior
type: task
title: Ask-at-open binding behavior in the operating loop
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-26T18:16:00Z
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.7
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Task: Ask-at-open binding behavior in the operating loop

The host-policy half of `task-conversation-binding`, in `.konspekt/OPERATING.md`
-- out of the portable standard by konspekt's own rule that *when the human is
prompted* is host discretion.

- A session-start binding step in the Operating loop: the maintainer asks the
  human whether the conversation attaches to an existing entity (by id) or a new
  one (of a stated type), with `investigation` proposed as the default for an
  exploratory start (`nw-binding-cold-start`).
- A third item under "Triggers -- how the loop fires": the maintainer proposes an
  active-entity switch when the topic moves to a different entity; the human
  confirms, same accept discipline as any venture (`nw-binding-active-switch`).
- Records this instance's `binding` value (set in `project.md`) and, under
  `optional`, that a declined binding is written as a waypoint so the absence is
  itself on the record (`nw-binding-configurable`).

Related to `nw-venturing-must-be-forced` and `task-review-ergonomics` (the
readiness/venturing discipline this extends). Produces the operating-envelope
change, not a portable artifact.
