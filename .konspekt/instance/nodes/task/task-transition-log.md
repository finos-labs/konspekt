```yaml
id: task-transition-log
type: task
title: Append-only transition log for review and status
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-04T16:24:34Z
review: proposed
provenance:
  sourceRef: 60b283e07d6fad5738561d91d4fc9a2345235814
  contentHash: 60b283e07d6fad5738561d91d4fc9a2345235814
  conversationId: transition-log-design
  timestamp: 2026-10-04T16:18:00Z
  confidence: 0.9
createdAt: 2026-10-04T16:24:34Z
updatedAt: 2026-10-04T16:24:34Z
```
# Task: Append-only transition log for review and status

Record when each `review` and `status` value was written, for entities and
edges, in `transitions/transitions.md`, so that acceptance latency and status
cycle time can be computed from the instance without store history.

Before this task the model stored current state only. `updatedAt` does not
record acceptance time ([[nw-updatedat-not-acceptance-time]]). The store's
commit history does, but a measure computed from it depends on one backend. The
log is the store-neutral record ([[nw-transition-log-append-only]]). It has a
birth row for every atom ([[nw-transition-log-birth-rows-required]]), and
existing state was reconstructed once from history
([[nw-transition-log-backfill-from-history]]).

`nw-state-written-at-birth-not-transitioned` recorded an open question against
`task-provenance-model`: the durable record did not distinguish a birth state
from a later transition. The log records that distinction
([[nw-transitions-observed-in-history]]).

Scope: the serialization section, the schema type, the conformance rules, and
the backfilled log for this instance. Writers other than the maintainer are
[[task-transition-log-writers]]. The first consumer is
[[task-graph-analytics]]. [[task-signed-accepts]] can attach a signature to the
accepting row.

Success is that the conformance checker enforces the three log rules and this
instance passes them with zero errors.
