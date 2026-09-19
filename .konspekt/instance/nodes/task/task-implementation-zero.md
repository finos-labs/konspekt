```yaml
id: task-implementation-zero
type: task
title: Build implementation_zero — a local watcher and floating read-only view
status: active
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
# Task: Build implementation_zero — a local watcher and floating read-only view

The first real build of the [[task-konspekt-ui-app]] view: a standalone process
that runs beside the IDE, watches `.konspekt/instance/` on the local filesystem,
and renders the one HTML view in an always-on-top window. Read-only — it reflects
the working tree as the agent and human write to it and takes no disposition, so
`propose→accept` stays intact because nothing writes.

Structure in two parts:

- **Core (zero-dependency Node).** A filesystem watcher over the working tree —
  the push variant [[nw-poll-is-the-floor-push-is-optional]] names — that
  debounces a burst of writes (a `sync` touches many files; a rename arrives as
  create+delete per [[nw-rename-fires-as-creation]]) and re-runs `loadInstance()`
  from `lib/conformance.mjs`, the one shared reader, so there is no second
  parser. It serves the view and the entities over localhost and pushes a change
  signal over Server-Sent Events; the payload carries the fact of change and the
  page re-reads. This core is shell-agnostic and reused by later shells
  ([[nw-one-view-two-transports]]).
- **Always-on-top shell.** A native window wrapping the same localhost view, kept
  above other windows, chosen as part of this layer for adoption. Packaged with
  Electron ([[nw-electron-shell]]); the core above does not depend on it.

Scope boundary: local `fs.watch` sees local edits, not remote commits
([[nw-poll-is-the-floor-push-is-optional]]); remote fetch is out of scope. Writes
and the authority verbs are [[task-task-workthrough-ui]], a later layer
([[nw-implementation-layering]]). The `ui://` card is the separate web surface
[[task-mcp-app-surface]].

Success: running the process beside the IDE opens an always-on-top window that
shows the live instance and updates within seconds of a local write, with no
write leaving the view.
