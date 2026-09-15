# UI architecture (non-normative)

Design background for the konspekt UI application. This is not part of the
specification and nothing here is normative: `spec/` governs on any conflict.
Snapshot of the design session of 2026-09-14, recorded so the component names
and the reasons behind them survive outside the conversation.

Diagram: `ui-architecture.svg` in this directory. Today's flows are solid,
the target is dotted.

## Components

**Store layer.** The logical store. Its git implementation holds a working tree
and a remote kept in sync by push and pull; a database implementation holds
collections or tables. Callers address the layer, not a location.

**Storage interface.** What every backend must satisfy: read an entity, write it
under compare and swap, return an opaque cursor, answer a changes-since query.
Git is the reference implementation, MongoDB the enterprise option, Postgres the
open-source one.

**Konspekt R/W API.** The neutral read and write layer over the storage
interface. Every binding sits on it; it holds no transport concerns.

**Push interface.** An optional accelerator over the store: a filesystem watcher,
a change stream, a trigger. Never required, since polling the cursor is the
mandated floor.

**Konspekt MCP server.** The LLM-facing binding. Answers tools and serves the
view as a `ui://` resource. On a hosted chat surface it is reached by the
vendor's backend; in an IDE it is reached directly.

**LLM native UI.** The host chat surface: a browser, an IDE panel, a mobile app.
Not ours, not replaceable, and not worth rebuilding.

**Konspekt UI app.** The local shell that owns a window and serves the view.

**Konspekt HTML UI.** The view itself, identical in both deployments, holding the
goal picker, the queue, the visual channels and the verbs.

**Konspekt HTML renderer.** The context that runs the view: a browser page, or a
sandboxed `ui://` iframe inside a host.

**Agent runtime.** The model with its tools and session. Its own component
because it is a writer we do not control.

**Handoff composer.** The part of the view that turns what the human just did
into a sentence for their next turn in chat. This substitutes for the push
channel the protocol forbids.

## Links that exist, and why

- The human reaches three surfaces: the app, a chat surface, an IDE panel.
- Chat surfaces reach the agent runtime; the runtime reaches the konspekt MCP
  server. On the web path that hop originates in the vendor backend, which is
  also what fetches `ui://` and hands the HTML down to the browser. The page
  never connects to our server.
- The app and the MCP server both reach the konspekt R/W API. Neither is
  privileged; both write under compare and swap.
- The R/W API reaches the store layer through the storage interface.
- The push interface reaches the app only. Nothing reaches a chat session.
- Today's git CLI and GitHub connector reach locations inside the git backend
  directly, bypassing the R/W API. Those paths have no equivalent on a database
  backend.

## Deliberately absent

- **No channel into a chat session.** MCP requires server-initiated requests to
  be tied to an originating client request, so nothing can wake a session.
- **No write-scope split.** Callers are not partitioned by field; per-entity
  compare and swap is the coordination mechanism.
- **No mandated push.** Backends may offer subscriptions; polling a cursor is the
  floor.
- **No vendor mobile target.** A phone browser running the view is the mobile
  surface; the vendor's mobile app stays a chat client.
- **No second view.** One HTML view behind a transport adapter, so disposition
  semantics cannot drift between surfaces.

## Status

Every decision recorded here is `review: proposed` in the instance. See the
noteworthy entries for the reasoning, and the tasks `task-konspekt-ui-app`,
`task-mcp-app-surface` and `task-atom-versioning-cas` for the work.
