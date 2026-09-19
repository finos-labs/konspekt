# implementation_zero — app

Implementation code for `implementation_zero`. Not yet built. The design is in
`../docs/DESIGN.md`; the graph tracks the work as `task-implementation-zero` in
`.konspekt/instance/`.

Intended contents:

- **Core (zero-dependency Node).** The filesystem watcher over
  `.konspekt/instance/` and the localhost server (`GET /view`, `GET /api`,
  SSE `GET /events`), reusing `loadInstance()` from `lib/conformance.mjs`. This
  stays shell-agnostic so the IntelliJ plugin can reuse it.
- **Shell.** The always-on-top window wrapping the localhost view, packaged with
  Electron (see `../docs/DESIGN.md` → Decision — Electron shell).
