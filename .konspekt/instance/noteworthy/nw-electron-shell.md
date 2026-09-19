```yaml
id: nw-electron-shell
kind: decision
review: accepted
provenance:
  sourceRef: 89c1fe40a5fc1128b55e98e1dd712aac0b7441df
  contentHash: 89c1fe40a5fc1128b55e98e1dd712aac0b7441df
  timestamp: 2026-09-19T13:00:00Z
  conversationId: app-design-101
  confidence: 0.7
createdAt: 2026-09-19T13:00:00Z
updatedAt: 2026-09-19T13:00:00Z
```
# Noteworthy: implementation_zero's always-on-top shell is Electron

The always-on-top window of [[task-implementation-zero]] is packaged with
Electron. Electron is pure JavaScript, ships Node and Chromium as one artifact,
and makes always-on-top a single window flag, which is the lowest adoption
friction for a first local build. The cost is binary size; Tauri (OS webview, no
bundled Chromium) is the smaller-footprint alternative if size later matters.

This decision binds the shell only. The watcher and localhost server core stay
Electron-agnostic and run in any browser, so the next local layer
([[task-intellij-plugin]], which renders through JCEF, not Electron) reuses the
core unchanged.
