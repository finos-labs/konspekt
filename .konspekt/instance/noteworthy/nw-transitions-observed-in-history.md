```yaml
id: nw-transitions-observed-in-history
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
# Noteworthy: the backfilled log enumerates every status and review transition

The backfill of `transitions/transitions.md` covers all 228 entities and 380
edges present on 2026-10-04 and yields 794 rows: 682 birth rows and 112 changes.

- `review`: 94 changes from `proposed` to `accepted` (39 on entities, 55 on edges)
  and one from `accepted` to `proposed` (`goal-portability`).
- `status`: 17 changes on nodes. 12 `open` to `resolved`, 3 `active` to
  `resolved`, 2 `open` to `active`.

This is a full enumeration of the instance's history.
[[nw-node-status-does-transition]] reached the same conclusion from seven nodes
and two commits; the log confirms it for every node.

Proposes to supersede `nw-review-is-the-only-field-that-transitions` on its claim
that `review` is the one field that changes value on an existing entity:
`status` changed 17 times. That atom's conclusion that the notifier should key on
an entity becoming `accepted` is not disputed here.

The log makes a status transition directly observable, which is relevant to the
notifier's event set under `task-portable-notifications`. This atom does not
decide that event set, or the pending supersession of
`nw-state-written-at-birth-not-transitioned`.

Notes [[task-transition-log]].
