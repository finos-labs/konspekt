```yaml
id: task-ui-footer-write-actions
type: task
title: Correct the UI footer text to name both write actions
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-29T02:30:00Z
review: accepted
provenance:
  sourceRef: 63f1250644ed1210ca5f3b625eb0b1b9f8864e4b
  contentHash: 63f1250644ed1210ca5f3b625eb0b1b9f8864e4b
  conversationId: walkthrough-video
  timestamp: 2026-10-29T02:30:00Z
  confidence: 0.9
createdAt: 2026-10-29T02:30:00Z
updatedAt: 2026-10-29T02:30:00Z
```
# Task: Correct the UI footer text to name both write actions

The shared view's footer note (`implementations/implementation-zero/app/view/index.html`)
says "The only write is Accept on a proposed entity", but the view also offers
Resolve on a work node ([[task-ui-resolve-action]]). Observed in the IntelliJ
plugin on `task-e2e-wiring`. Update the note to name both writes. A minor UI fix.

Decomposes [[goal-usability]].
