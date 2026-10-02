```yaml
id: nw-fleet-commit-then-call
kind: decision
review: proposed
provenance:
  sourceRef: 15e3edd1b6fef47c8e08cf98dabf42f8bc7e277e
  contentHash: 15e3edd1b6fef47c8e08cf98dabf42f8bc7e277e
  conversationId: fleet-design-ingest
  timestamp: 2026-10-02T02:30:00Z
  confidence: 0.9
createdAt: 2026-10-02T02:30:00Z
updatedAt: 2026-10-02T02:30:00Z
```
# Noteworthy: the fleet handoff is commit-then-call, with payload-in-call as the fallback

A proposer that holds a writable store **commits its content-addressed payload
first, then calls the committer over MCP**. The commit gives proposer-side
durability: the proposal survives a committer that is down or a call that fails.
The call carries a **pointer** (the content hash or outbox ref), not the payload;
the committer fetches the bytes from the store it already trusts and hash-verifies
on read, so the MCP channel never carries authoritative content, and a call that
references a hash cannot forge one.

The handoff is the **proposer's choice**, because it depends on what store the
proposer can write. A proposer with no writable store uses **payload-in-call**:
the payload travels in the MCP call and durability rests on the committer
persisting each received proposal before it acks. Commit-then-call is preferred
where a writable store exists; payload-in-call is the fallback.

Commit-then-call makes delivery **idempotent**: the payload identity is fixed
before the call, so a timed-out retry resolves to the same hash and the committer
deduplicates — at-least-once delivery, exactly-once effect. Rollback is clean up
to the committer's persist-ack: before the committer folds the proposal, the
proposer's outbox commit is a proposer-local draft, and resetting it discards a
draft with no shared record to repair.

Scopes [[task-agent-fleet]]; refines [[nw-fleet-committer-ingest-contract]];
relates to [[nw-push-based-idempotence]].
