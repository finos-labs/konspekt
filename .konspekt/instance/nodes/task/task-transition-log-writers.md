```yaml
id: task-transition-log-writers
type: task
title: Transition-log rows from the UI and the IntelliJ plugin
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-04T16:24:34Z
review: proposed
provenance:
  sourceRef: 60b283e07d6fad5738561d91d4fc9a2345235814
  contentHash: 60b283e07d6fad5738561d91d4fc9a2345235814
  conversationId: transition-log-design
  timestamp: 2026-10-04T16:18:00Z
  confidence: 0.85
createdAt: 2026-10-04T16:24:34Z
updatedAt: 2026-10-04T16:24:34Z
```
# Task: Transition-log rows from the UI and the IntelliJ plugin

The standalone app's resolve action ([[task-ui-resolve-action]]) and the
IntelliJ plugin ([[task-intellij-plugin]]) both write `status` and `review` to
disk. When an instance contains a transition log ([[task-transition-log]]), each
of those writes must append its row in the same write. Without the row, the
agreement rule reports a conformance error.

Also in scope: the scaffolder writes an empty log into a new instance, so an
adopter records state history from the first write.

Planned for an IDE session.

Success is that a resolve from either shell produces an instance that passes
conformance, and a newly scaffolded instance contains a log.
