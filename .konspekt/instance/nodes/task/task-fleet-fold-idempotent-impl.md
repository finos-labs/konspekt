```yaml
id: task-fleet-fold-idempotent-impl
type: task
title: Implement idempotent fold in fold.mjs
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-22T17:32:42.831Z
review: accepted
provenance:
  sourceRef: 706890226af3d49c42e45964284b4f0b2303c913
  contentHash: 706890226af3d49c42e45964284b4f0b2303c913
  conversationId: fleet-uat-committer-2026-10-22
  timestamp: 2026-10-22T17:32:42.831Z
  confidence: 0.9
createdAt: 2026-10-22T17:32:42.831Z
updatedAt: 2026-10-22T17:46:00.000Z
```
# Task: Implement idempotent fold in fold.mjs

Implement the idempotent-fold contract designed by
[[artifact-fleet-outbox-lifecycle]] in
`implementations/fleet/app/fold.mjs`. `task-fleet-committer-refold-dedup` is
resolved as design-only; this task carries the code.

`foldProposal` currently rewrites `entity.md` unconditionally, so re-folding an
un-consumed outbox clobbers a blessed atom back to `review: proposed`
([[nw-fleet-refold-clobbers-blessed]]). Make it idempotent:

- decide "already folded" from canonical — the target entity exists and its
  `provenance.contentHash` equals the proposal's source hash — report
  `ALREADY FOLDED` and skip, leaving the entity, edges, and transition rows
  untouched so a blessed or rejected `review` is kept;
- set aside a proposal whose id exists on canonical with a different
  `contentHash` as an `id collision`;
- cover the invariant with a test: a `run-pass` over outboxes unchanged since
  the previous pass changes nothing on canonical.

Landing this retires the mandatory consume-after-fold workaround.

Decomposes [[task-fleet-worktree-committer]].
