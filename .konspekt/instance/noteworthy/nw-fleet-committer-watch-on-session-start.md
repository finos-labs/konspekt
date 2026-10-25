```yaml
id: nw-fleet-committer-watch-on-session-start
kind: decision
review: accepted
provenance:
  sourceRef: ceb072d676b19ac68f58395baf4bc28f761bb41f
  contentHash: ceb072d676b19ac68f58395baf4bc28f761bb41f
  conversationId: fleet-resolve-and-adjustments-2026-10-25
  timestamp: 2026-10-25T15:30:00Z
  confidence: 0.85
createdAt: 2026-10-25T15:30:00Z
updatedAt: 2026-10-25T15:30:00Z
```
# Noteworthy: the committer fold watcher is auto-started by a SessionStart hook

The committer's fold loop (`run-pass --watch`, `committer.mjs` `watchLoop`) folds
outbox proposals only while its Node process is alive, and nothing starts that
process on its own. A committer session that does not launch it folds nothing,
which is how a round of `cdm-collateral` proposer work sat unfolded until the
watcher was started by hand. The decision: register a Claude Code `SessionStart`
hook (`implementations/fleet/app/committer-watch-hook.mjs`) in the committer's
repo so starting the watcher is the session's first action.

The hook is safe to register in any repo because it starts the watcher only when
the repo is actually a running committer, and never blocks session start:

- It reads `CLAUDE_PROJECT_DIR` and gates on two conditions. A
  `.konspekt/fleet/config/fleet.json` must exist, and `loadFromConfig` must
  succeed against it — which holds only when every configured outbox worktree is
  stood up. A repo that merely carries a config but stands up no outboxes (the
  konspekt dogfood repo) takes the `skip-not-ready` branch and spawns nothing;
  the `hasConfig`-only gate would have spawned a watcher there that errors on its
  first tick.
- It is idempotent: a live watcher pid recorded in `.konspekt-fleet/watch.pid`
  is left alone, so repeated session starts do not spawn duplicate watchers. A
  recorded-but-dead pid re-starts.
- The watcher it spawns is detached and unref'd, so it outlives the hook and the
  session, writing its output to `.konspekt-fleet/watch.log`. The hook always
  exits 0.

The watcher attaches config-driven (`run-pass --canonical <projectDir>`), so it
reads `instanceSubdir` from the committed config and needs no `--instance-subdir`
flag (`[[nw-fleet-committer-instance-subdir-from-config]]`). It folds proposals
as `review: proposed`; `bless` stays a separate human-gated pass, so the hook
never puts a model on the accept path.

The hook is registered only in a committer repo's `.claude/settings.json` (the
`cdm-collateral` dogfood committer), not in konspekt, which is not an active
committer.

Notes [[task-fleet-adjustments]].
