```yaml
id: nw-fleet-refold-clobbers-blessed
kind: constraint
status: lifted
review: accepted
provenance:
  sourceRef: e8c4e203fcc5f80d60fb6363bf6ee35e5bc48b15
  contentHash: e8c4e203fcc5f80d60fb6363bf6ee35e5bc48b15
  conversationId: fleet-uat-committer-2026-10-22
  timestamp: 2026-10-22T12:44:01.258Z
  confidence: 0.9
createdAt: 2026-10-22T12:44:01.258Z
updatedAt: 2026-10-22T17:46:00.000Z
```
# Noteworthy: re-folding an un-consumed outbox clobbers a blessed atom back to proposed

`foldProposal` (`implementations/fleet/app/fold.mjs`) unconditionally rewrites
`entity.md` onto canonical with no dedup and no incremental-outbox read. So
re-running `run-pass` while an already-folded proposal is still present in its
outbox **clobbers** a blessed atom back to `review: proposed` and duplicates its
rows — a blessed decision is silently reverted.

The constraint in force until an idempotent fold exists: **consume each folded
`proposals/<id>/` from its outbox (`git rm` + commit) before the next
`run-pass`**, so the next fold reads zero stale proposals. All three UAT outboxes
were emptied this way on 2026-10-21.

The fix is tracked by [[task-fleet-committer-refold-dedup]], which decomposes
[[task-fleet-worktree-committer]].
