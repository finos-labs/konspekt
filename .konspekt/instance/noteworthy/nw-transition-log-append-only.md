```yaml
id: nw-transition-log-append-only
kind: decision
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
# Noteworthy: state history is an append-only transition log

When a `review` or `status` value was written is recorded in an append-only log,
one row per assignment: `ref | field | from | to | timestamp | source`. It was
chosen over a `reviewedAt` field, and over `reviewedAt` plus `statusChangedAt`.

A field stores only the latest transition. The log stores every transition, and
the history contains a case where that matters: `goal-portability` changed from
accepted to proposed and back to accepted on 2026-09-11.

Edges are addressed as `edge:<id>`, so the edge table needs no new column. The
log is defined in core at `transitions/transitions.md`, because `review` is a
core field. The entity file and the edge row remain the authority for current
state. A conformance rule requires the last log row to equal the current value,
which detects a difference between the two.

Notes [[task-transition-log]].
