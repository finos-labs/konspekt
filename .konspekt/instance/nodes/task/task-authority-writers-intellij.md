```yaml
id: task-authority-writers-intellij
type: task
title: Accept authority in the IntelliJ plugin
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-07T12:33:57Z
review: proposed
provenance:
  sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  conversationId: accept-authority-design
  timestamp: 2026-10-07T12:20:00Z
  confidence: 0.85
createdAt: 2026-10-07T12:33:57Z
updatedAt: 2026-10-07T12:33:57Z
```
# Task: Accept authority in the IntelliJ plugin

The IntelliJ plugin has its own Kotlin writer for accept and resolve
([[task-intellij-plugin]]). After [[task-authority-mechanism]], an instance that
declares principals requires every acceptance row to name the acting principal
in `by`, and requires that principal to hold a grant on the atom's scope. The
standalone server does both. The plugin does neither, so an accept from the
plugin in such an instance produces an `acceptance-unattributed` conformance
error.

Scope: the plugin learns which principal is acting, checks the grant before it
writes, leaves an edge proposed when the principal holds no grant for it, and
writes `by` on each row.

Planned for an IDE session, because the plugin cannot be built in a session
without the IntelliJ SDK.

Success is that an accept and a resolve from the plugin, in an instance that
declares principals, produce rows that pass conformance, and that the plugin
refuses an accept when the acting principal holds no grant.
