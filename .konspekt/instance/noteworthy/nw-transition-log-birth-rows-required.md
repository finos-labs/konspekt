```yaml
id: nw-transition-log-birth-rows-required
kind: decision
review: accepted
provenance:
  sourceRef: 60b283e07d6fad5738561d91d4fc9a2345235814
  contentHash: 60b283e07d6fad5738561d91d4fc9a2345235814
  conversationId: transition-log-design
  timestamp: 2026-10-04T16:18:00Z
  confidence: 0.8
createdAt: 2026-10-04T16:24:34Z
updatedAt: 2026-10-04T16:24:34Z
```
# Noteworthy: every atom has a birth row in the transition log

An atom accepted in the write that creates it still gets a transition row, so a
projection never infers an acceptance time from `createdAt`.

Stated for the log: every entity and every edge has a `review` birth row with an
empty `from`, and every entity that has a `status` has a `status` birth row. The
check is then uniform. Each ref and field has at least one row, each row's
`from` equals the previous row's `to`, and the last row equals the current
value.

Notes [[task-transition-log]].
