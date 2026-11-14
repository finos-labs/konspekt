```yaml
id: nw-notify-events-are-creation-and-supersedes
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;jP89OKyOY1aDWLN50poVvAREdWHc6ccXM4sWOn5tup0
  timestamp: 2026-07-19T15:00:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 05f79ce4a294a4a0251a6feef26b5a1d287ea16e
    contentHash: 05f79ce4a294a4a0251a6feef26b5a1d287ea16e
createdAt: 2026-07-19T15:00:00Z
updatedAt: 2026-07-19T15:00:00Z
```
# Noteworthy: the notifiable events are creation and supersedes

The two events worth notifying on are **a new entity landing `review: accepted`**
and **an entity acquiring an inbound `supersedes` edge**. Not the authority-verb
status transitions.

This replaces an earlier design that subscribed to target states
(`resolved`, `refuted`, `lifted`, `abandoned`). Target states were the right
vocabulary for that design — they uniquely identify the verb that produced them,
so a consumer never needs a verb-to-state mapping table — but a diff of both live
instances found no occurrence of any of those states. Every entity examined
carries `status: active`. The transitions being designed for had never happened.

Consequences: a watcher needs only the directory, `id`, `review`, and the
`supersedes` rows in `edges.md`. It needs no `kind` field and no status
vocabulary, so it can be built before any schema reconciliation lands.
Subscriptions are type-level only; id-level watches are deferred because
`supersedes` keeps both entities in the graph, so a watch on a superseded id
fails silently rather than erroring.
