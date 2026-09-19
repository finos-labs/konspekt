# implementation_zero — app

The local, read-only konspekt view. The design is in `../docs/DESIGN.md`; the
graph tracks the work as `task-implementation-zero`.

## Parts

- **Core (zero-dependency Node).** `server.mjs` — a filesystem watcher over the
  instance plus a localhost server. It reuses `loadInstance()` from
  `lib/conformance.mjs`, reloads on change (debounced), and serves the view at
  `GET /`, the entities at `GET /api/entities`, and a change signal over SSE at
  `GET /events`. Shell-agnostic, so the IntelliJ plugin can reuse it.
- **View.** `view/index.html` — the Changes tab: a 10-row window over the whole
  entity population with kind / status / review filters, fed by `/api/entities`
  and refreshed over `/events`.
- **Shell.** `electron-main.mjs` + `package.json` — the always-on-top window
  (`nw-electron-shell`). It spawns the core and loads the localhost view.

## Run

Core only (any browser, no install):

```
node server.mjs                 # serves this repo's instance on http://127.0.0.1:4319
node server.mjs <instanceDir>   # a different instance
KONSPEKT_PORT=5000 node server.mjs
```

Always-on-top shell (needs one install):

```
npm install
npm run shell
```

## Scope

Read-only: no write endpoint, so nothing here affects `propose→accept`. Local
only: the watcher sees local edits, not remote commits. Writes and the authority
verbs are a later layer (`task-task-workthrough-ui`).
