# implementation_zero — app

The local, read-only konspekt view. The design is in `../docs/DESIGN.md`; the
graph tracks the work as `task-implementation-zero` and the app as
`artifact-implementation-zero-app`.

## Parts

- **Core** (`server.mjs`, `projections.mjs`): a filesystem watcher over the
  instance plus a localhost server. It reuses `loadInstance()` from
  `lib/conformance.mjs` and `goalState()` from `lib/views.mjs`, reloads on change
  (debounced), and serves `GET /` (view), `GET /api/entities`, `GET /api/stats`,
  `GET /api/goals`, `GET /api/graph?goal=<id>`, and a change signal over SSE at
  `GET /events`. `projections.mjs` holds the pure `rowsFrom` / `statsFrom` /
  `goalsFrom` functions the endpoints and the tests share.
- **View** (`view/`): `index.html` + `app.css` + `app.js` — three read-only tabs:
  Changes (a 10-row window over the population with kind / status / review
  filters), Stats (counts by kind, accepted vs proposed, oldest unaccepted
  proposals), and Goals (goals list + `decomposes` subgraph as a layered SVG DAG).
- **Shell** (`electron-main.mjs`, `package.json`): the always-on-top window
  (`nw-electron-shell`). It spawns the core and loads the localhost view.

## Requirements

- **Node.js 20 or newer** (the watcher uses `fs.watch({ recursive: true })`,
  which is supported on Linux only from Node 20; Windows and macOS support it
  earlier). Check with `node --version`.
- **The core needs no install** — it is zero-dependency Node.
- **The shell needs one install** — Electron, declared as a dev dependency
  (`npm install` fetches it).

## Install

Only the always-on-top shell needs this:

```
cd implementations/implementation-zero/app
npm install
```

## Start

Core only, in any browser (no install):

```
node server.mjs                 # serves this repo's instance on http://127.0.0.1:4319
node server.mjs <instanceDir>   # point at a different instance
KONSPEKT_PORT=5000 node server.mjs
```

Then open `http://127.0.0.1:4319`.

Always-on-top shell (after `npm install`):

```
npm run shell
```

## Stop

- **Core** (`node server.mjs`): press `Ctrl+C` in its terminal.
- **Shell** (`npm run shell`): close the window — that quits Electron, which
  stops the core it spawned. If a process is orphaned, stop the one holding the
  port, e.g. on Windows:
  `for /f "tokens=5" %p in ('netstat -ano ^| findstr :4319') do taskkill /F /PID %p`
  (POSIX: `kill $(lsof -t -i:4319)`).

## Test

Zero-dependency tests using the built-in Node test runner:

```
npm test        # runs node --test over test/
```

- `test/projections.test.mjs` — unit tests for the pure projections against a
  synthetic graph (no server, no filesystem).
- `test/server.test.mjs` — an integration smoke test that starts the server on a
  test port against this repo's instance and exercises the read-only endpoints.

## Scope

Read-only: no write endpoint, so nothing here affects `propose→accept`. Local
only: the watcher sees local edits, not remote commits. Writes and the authority
verbs are a later layer (`task-task-workthrough-ui`).
