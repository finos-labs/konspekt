# implementations

Local and hosted implementations of the konspekt UI application. Each is one
shell over the shared HTML view described by `task-konspekt-ui-app` in
`.konspekt/instance/`; the build order across them is `nw-implementation-layering`.

This directory holds implementation code and its design docs. It is not the
standard — `spec/` owns the data model and transport contract, and nothing here
constrains another implementer.

## Convention

One directory per implementation, each with:

- `docs/` — design docs and diagrams for that implementation.
- `app/` — its implementation code.

## Implementations

- `implementation-zero/` — a local, zero-dependency Node watcher plus an
  always-on-top floating window, read-only over the working tree. The first
  layer. Tracked as `task-implementation-zero`.

Planned as sibling directories under the same convention:

- the IntelliJ plugin (`task-intellij-plugin`) — the next local layer, read/write
  in an IDE tool window.
- enterprise persistence (`task-enterprise-persistence`) — a document or
  relational backend and a hosted server, last.
