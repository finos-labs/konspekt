```yaml
id: task-fleet-adjustments
type: task
title: Fleet adjustments (ongoing)
status: active
summary:
  origin: human
  pinned: false
  updatedAt: 2026-10-25T14:10:00Z
review: accepted
provenance:
  sourceRef: d61ec0b88a72ed3c0401e5c552e6ef0e4afaedce
  contentHash: d61ec0b88a72ed3c0401e5c552e6ef0e4afaedce
  conversationId: fleet-resolve-and-adjustments-2026-10-25
  timestamp: 2026-10-25T14:10:00Z
  confidence: 0.9
createdAt: 2026-10-25T14:10:00Z
updatedAt: 2026-10-25T14:10:00Z
```
# Task: Fleet adjustments (ongoing)

The standing bucket for ongoing tuning of the agent fleet now that its discrete
build tasks are resolved: the worktree-outbox committer, config-driven setup,
idempotent fold, startup outbox scan, file-carrying proposals, and the Cursor
runtime are all in place (`[[task-agent-fleet]]` and its subtree resolved
2026-10-25).

Unlike those tasks, this one does not resolve as a whole. It carries the small,
continuous adjustments the fleet needs in operation — committer and proposer
skill fixes, fold or outbox-lifecycle corrections, config and setup tweaks,
follow-ons surfaced by adopters (for example the `cdm-collateral-fleet`
dogfood) — that are too small to warrant their own task and have no natural
close. When an adjustment is large enough to merit its own tracked unit, raise a
separate task decomposing from `[[task-agent-fleet]]` rather than folding it
here; keep this task for the running maintenance stream.

It stays `active` so operational fleet work has an accepted entity to bind to
under `basis: accepted`.

Decomposes [[task-agent-fleet]].
