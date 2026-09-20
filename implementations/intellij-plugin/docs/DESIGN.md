# IntelliJ plugin — design

Design for the second local konspekt UI implementation. Non-normative: `spec/`
governs on any conflict. The graph tracks the work as `task-intellij-plugin`, the
build order as `nw-implementation-layering`, and the shared-view requirement as
the ASR "one view across all surfaces".

## What it is

A JetBrains plugin that renders the one konspekt HTML view (the same
`index.html` / `app.css` / `app.js` as `implementation-zero`) inside an IDE tool
window via JCEF, reading the open project's `.konspekt/instance` **in-process** —
no external Node process.

## Decision — Option B (in-process), transport = in-process JVM HTTP/SSE

Two options were weighed for how the tool window gets the view and its data:

- **A — JCEF loads the local `implementation-zero` Node server.** Rejected: it is
  effectively the already-built "run Node outside the IDE" path, and adds a Node
  runtime dependency to the IDE session.
- **B — in-process.** Selected. The plugin reads the instance itself and needs no
  Node, which is what actually completes the task (VFS-native change source, and
  a direct write path later).

Within B, the transport between JCEF and the plugin is an **in-process JVM
HTTP/SSE server** (`ViewServer`, built on the JDK's `com.sun.net.httpserver`,
zero extra dependencies). This reuses the shared view **byte-for-byte** (its
`fetch`/`EventSource` calls are unchanged), which is the strongest guarantee of
the one-view ASR. The alternative — a JCEF JS↔JVM bridge — would force an
`app.js` transport refactor and is deferred.

## Consequences

- The plugin carries a **Kotlin reader** of the konspekt serialization — a
  second, independent implementation of the format. This advances
  `task-second-implementer` under `goal-portability`, and the shared conformance
  target (`spec/` plus the dogfooded instance) is what keeps it from drifting
  from `lib/conformance.mjs`.
- The shared view is **copied from `implementation-zero` at build time**, never
  duplicated in the repo, so the view cannot fork.
- The write path and authority verbs can run in-process here earlier than on the
  web path, while keeping `propose→accept` (`task-task-workthrough-ui`).

## Increments

1. Tool window + JCEF + in-process server serving the shared view; data endpoints
   stubbed empty. (Proves the shell and the one-view reuse.)
2. Kotlin reader over `.konspekt/instance` backing all read endpoints, plus a VFS
   listener that pushes a fresh cursor over SSE on each change.
3. The write path and authority verbs.

## Layout

- `docs/` — this design.
- `app/` — the Gradle plugin project (`build.gradle.kts`, `src/main/kotlin`,
  `src/main/resources/META-INF/plugin.xml`).
