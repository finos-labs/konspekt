```yaml
id: nw-fleet-durable-proposed-ref
kind: decision
review: accepted
provenance:
  sourceRef: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  contentHash: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  conversationId: fleet-implementation
  timestamp: 2026-09-28T23:07:00Z
  confidence: 0.95
createdAt: 2026-09-28T23:07:00Z
updatedAt: 2026-09-28T23:07:00Z
```
# Noteworthy: the committer folds outbox proposals into a durable proposed ref

Agent outboxes are the grow-only proposal record, and the review queue is a query
across them. The gap is durability: if an agent's worktree is torn down after it
finishes, its un-accepted proposals leave the record with it. So the committer
**folds outbox proposals into a durable `proposed` ref before teardown**.

A proposal on the `proposed` ref has one of three states: **accepted**,
**rejected**, or **pending**. **Rejected is a first-class terminal state,
retained with a reason** rather than dropped, because rejected proposals are
pushed later in the cycle and serve audit. Nothing is erased. On accept, a
proposal is marked accepted with a pointer to its canonical commit; the rest
stay pending; a decided no is rejected with a reason.

This makes goal-accountability's responsibility chain a standing property: for
any atom, which agent proposed it, whether it was accepted, rejected, or is
pending, and why. It resolves the carried-forward rejected-proposal open item by
giving a rejected proposal an explicit, retained state.

Scopes [[task-agent-fleet]]; supplies the record behind [[goal-accountability]].
