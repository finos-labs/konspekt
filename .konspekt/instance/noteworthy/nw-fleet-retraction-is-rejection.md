```yaml
id: nw-fleet-retraction-is-rejection
kind: decision
review: proposed
provenance:
  sourceRef: 15e3edd1b6fef47c8e08cf98dabf42f8bc7e277e
  contentHash: 15e3edd1b6fef47c8e08cf98dabf42f8bc7e277e
  conversationId: fleet-design-ingest
  timestamp: 2026-10-02T02:30:00Z
  confidence: 0.85
createdAt: 2026-10-02T02:30:00Z
updatedAt: 2026-10-02T02:30:00Z
```
# Noteworthy: a proposer retraction after ingest is recorded as review-rejected with a reason

A proposer that withdraws a proposal **after the committer has folded and acked
it** does not get a separate "withdrawn" state. The retraction is recorded as
`review: rejected` with an origin-tagged reason (proposer-withdrawn), reusing the
first-class retained rejection state the fleet already defines
([[nw-fleet-durable-proposed-ref]]) and matching `spec/architecture/REVIEW.md`'s
reject-as-tombstone: the folded atom stays on canonical as a `review: rejected`
tombstone, nothing is erased, and the responsibility record still shows which
agent proposed it and that it was withdrawn.

Before the committer's persist-ack there is nothing to reject: the proposal is a
proposer-local draft on the outbox, and resetting it leaves no shared record,
because the record starts at ingest. So retraction splits on the ack boundary —
a local reset before ack, a `review: rejected` tombstone after — and adds no new
terminal state to the proposed ref (accepted / rejected / pending is unchanged).

Scopes [[task-agent-fleet]]; relates to [[nw-fleet-durable-proposed-ref]].
