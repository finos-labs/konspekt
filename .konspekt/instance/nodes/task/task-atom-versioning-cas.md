```yaml
id: task-atom-versioning-cas
type: task
title: Per-atom compare-and-swap and a store cursor
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-14T16:00:00Z
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  conversationId: app-design-101
  timestamp: 2026-09-14T16:00:00Z
  confidence: 0.7
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Task: Per-atom compare-and-swap and a store cursor

With two writers over one instance — an agent in a chat session and a human in
the app — the coordination mechanism is versioning rather than partitioned write
scope. Every write through the konspekt R/W API carries the version the caller
read; the API rejects the write if the atom has changed since and returns the
current content so the caller can merge and retry in the same turn. Granularity
is per atom.

Alongside it, the store returns an opaque cursor and answers a changes-since
query over it, so a session that has been away can catch up without being pushed
to. Whether the agent checks every turn, only before writing, or only after a
rejection is a config option.

On rejection the app raises a flag that requires an action from the human rather
than merging silently.

Success: a stale write is always rejected rather than silently applied, and a
session can discover what changed since a known point in one call.
