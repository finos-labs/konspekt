```yaml
id: nw-transition-log-backfill-from-history
kind: decision
review: accepted
provenance:
  sourceRef: 60b283e07d6fad5738561d91d4fc9a2345235814
  contentHash: 60b283e07d6fad5738561d91d4fc9a2345235814
  conversationId: transition-log-design
  timestamp: 2026-10-04T16:18:00Z
  confidence: 0.9
createdAt: 2026-10-04T16:24:34Z
updatedAt: 2026-10-04T16:24:34Z
```
# Noteworthy: the transition log is backfilled once from store history

The log is not created empty. Existing state is reconstructed from this
instance's commit history, under three choices.

**One timestamp source.** Every backfilled row has the author time of the commit
that wrote the value. In-file timestamps are maintainer estimates: two
acceptances were committed 9 and 29 minutes before the entity's own `createdAt`.
Using `createdAt` for births and commit time for changes would have produced
negative intervals.

**Every ref resolves.** Edge ids that appear in history and no longer exist are
omitted. There are 14. An earlier count of 36 was of removal events, and 22 of
those ids were later restored and are kept.

**No source on backfilled rows.** The accepting exchanges were not captured, so
the `source` column is empty for them.

The backfill is a one-time derivation. After it, rows are written push-based in
the write that sets the value, and no reader resolves the log against version
control.

Notes [[task-transition-log]].
