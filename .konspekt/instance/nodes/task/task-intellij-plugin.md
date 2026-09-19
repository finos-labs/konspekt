```yaml
id: task-intellij-plugin
type: task
title: Build the IntelliJ plugin shell over the one view
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-19T12:00:00Z
review: accepted
provenance:
  sourceRef: db06867ee38876760cf3b6f2ab565ebb688a3cfd
  contentHash: db06867ee38876760cf3b6f2ab565ebb688a3cfd
  conversationId: app-design-101
  timestamp: 2026-09-19T12:00:00Z
  confidence: 0.7
createdAt: 2026-09-19T12:00:00Z
updatedAt: 2026-09-19T12:00:00Z
```
# Task: Build the IntelliJ plugin shell over the one view

The second local layer ([[nw-implementation-layering]]): a JetBrains plugin that
renders the one HTML view of [[task-konspekt-ui-app]] inside an IDE tool window
via JCEF (the bundled Chromium). A third shell behind the same transport adapter
([[nw-one-view-two-transports]]), so disposition semantics do not drift across
surfaces.

Two properties distinguish it from the other shells. Its change source is
IDE-native: the plugin observes the project tree through the IntelliJ virtual
file system rather than a raw filesystem watcher, filling the same push role as
[[task-implementation-zero]]'s watcher. And it runs in-process with local
filesystem access, so it can call the write path directly and offer disposition
and the authority verbs ([[task-task-workthrough-ui]]) earlier than the web path
can, while keeping `propose→accept`.

This is a first-party surface, distinct from the MCP Apps `ui://` card
([[task-mcp-app-surface]]): JetBrains is absent from the MCP Apps client matrix,
so Claude's in-IDE `ui://` render falls back to text. The plugin owns its own
tool window and renders the view directly rather than depending on that
negotiation, which is the reason to build it.

Success: the same view renders in an IntelliJ tool window, refreshes on a project
change, and records dispositions in-process without breaking `propose→accept`.
