```yaml
id: nw-fleet-committer-bless-queue-status-line
kind: decision
review: proposed
provenance:
  sourceRef: 22ad8247c37c705af7655fe84293621798294898
  contentHash: 22ad8247c37c705af7655fe84293621798294898
  conversationId: fleet-resolve-and-adjustments-2026-10-25
  timestamp: 2026-10-25T17:30:00Z
  confidence: 0.8
createdAt: 2026-10-25T17:30:00Z
updatedAt: 2026-10-25T17:30:00Z
```
# Noteworthy: the committer's bless queue is surfaced by a Claude Code status line

The fold watcher (`[[nw-fleet-committer-watch-on-session-start]]`) folds outbox
proposals in the background with no console, so a human committer has no visible
signal that proposals have arrived. The watcher never needs that signal — it
folds proposals to `review: proposed` on its own. The human needs the bless
queue: the atoms folded onto canonical at `review: proposed` and not yet blessed
or rejected. The decision: show that count in the committer's own terminal with
a Claude Code command status line (`implementations/fleet/app/committer-statusline.mjs`),
rather than a separate OS window.

The script reads the status-line JSON on stdin, takes the project directory from
`workspace.project_dir`, and prints one line: the model name, the current
directory, the context-window percentage, and the bless-queue depth. The depth
is `buildIndex(canonicalPath, { instanceSubdir, withCommits: false }).counts.pending`,
the same number `cli.mjs review` prints as "Fleet review queue: N pending". It
reads `instanceSubdir` from the fleet config, defaulting to `.konspekt/instance`.

Properties that make it safe to register and cheap to run:

- It makes no git subprocess (`withCommits: false` skips the per-atom
  `git log`), so it is fast enough for `refreshInterval: 5`, which re-runs it
  every 5 seconds so the count rises as the watcher folds and drops as the human
  blesses.
- It prints nothing when the repo carries no `.konspekt/fleet/config/fleet.json`.
  Empty output leaves a non-committer repo's default status line in place, so it
  is registered only in a committer repo's `.claude/settings.json` (the
  `cdm-collateral` dogfood committer), not in konspekt.
- `main()` runs only as the entry point, so importing the module for the unit
  test does not read stdin or write stdout (`[[nw-fleet-committer-watch-on-session-start]]`
  carries the same import-safety guard).
- A command status line replaces Claude Code's default readout, so the line
  carries the model, directory, and context percent alongside the queue count to
  keep that readout.

`CLAUDE_PROJECT_DIR` is not part of the Claude Code status-line contract; the
registration locates the script with a `${CLAUDE_PROJECT_DIR:-.}` fallback, and
the script reads the project directory from the stdin JSON regardless.

Notes [[task-fleet-adjustments]].
