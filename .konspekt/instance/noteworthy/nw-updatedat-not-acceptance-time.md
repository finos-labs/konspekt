```yaml
id: nw-updatedat-not-acceptance-time
kind: fact
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
# Noteworthy: updatedAt does not record acceptance time

Measured on this instance on 2026-10-04 against its full store history.

Of 160 accepted entities, 39 were accepted after first being persisted as
`proposed`. 26 of those 39 still have `updatedAt == createdAt`: the acceptance
write did not change the field. Of the 121 accepted in the write that created
them, 21 have a later `updatedAt` from unrelated edits.

Reading `updatedAt` on an accepted atom as its acceptance time therefore
produces two kinds of error. It omits acceptances that did not change the field,
and it reports later edits as acceptances. The edge table has no timestamp
column, so an edge's acceptance time was not recorded anywhere.

Notes [[task-transition-log]].
