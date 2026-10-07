```yaml
id: nw-binding-rows-have-timestamp
kind: decision
review: accepted
provenance:
  sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  conversationId: accept-authority-design
  timestamp: 2026-10-07T12:20:00Z
  confidence: 0.75
createdAt: 2026-10-07T12:33:57Z
updatedAt: 2026-10-07T12:33:57Z
```
# Noteworthy: changed-code rows have a timestamp

Rows in `changes/changed.md` have a `timestamp` column recording when the row
was written. Under `basis: accepted` the conformance checker reports an error
when that time is earlier than a transition row that left the entity `accepted`.

The column exists so that an instance on a store without commit history can
still show that the acceptance came first. The earlier design stored no
timestamp because row order was sufficient for a timeline; row order cannot be
compared with the transition log.

Rows written before the column existed have none and are exempt from the order
check. `tools/binding-audit.mjs` checks the same order from commit author times
where commit history is available.

Notes [[task-acceptance-before-work]].
