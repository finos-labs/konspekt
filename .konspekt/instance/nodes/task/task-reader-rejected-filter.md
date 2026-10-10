```yaml
id: task-reader-rejected-filter
type: task
title: Filter review rejected tombstones in the shipped readers
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-10T16:30:00Z
review: proposed
provenance:
  sourceRef: d1f27d9c19df3cee92f67d1cc8b11d432acc537c
  contentHash: d1f27d9c19df3cee92f67d1cc8b11d432acc537c
  conversationId: fleet-worktree-committer
  timestamp: 2026-10-10T16:30:00Z
  confidence: 0.7
createdAt: 2026-10-10T16:30:00Z
updatedAt: 2026-10-10T16:30:00Z
```
# Task: Filter review rejected tombstones in the shipped readers

Once the fleet committer folds proposals onto canonical, canonical carries
`review: rejected` tombstones alongside `accepted` and `proposed` atoms
(`fleet-spec.md` § Proposal state and reader filtering). Without a `review`
filter, a tombstone renders as a live node in the shipped tree-readers
(`implementation-zero`, the IntelliJ plugin), the same way an unfiltered
superseded node would.

Scope: the readers filter on `review` — default views show `accepted` (and
`proposed` where a view wants pending work) and omit `review: rejected`, matching
how current-item views already drop superseded nodes (`REVIEW.md`). This is a
reader concern, held apart from the committer that writes the tombstone
([[task-fleet-worktree-committer]]).

Success is that a `review: rejected` atom on canonical does not appear in a
reader's default view, and a `proposed` atom appears only where the view opts in
to pending work.

Surfaced while planning [[task-fleet-worktree-committer]]; ventured as `proposed`.
Relates to [[task-konspekt-ui-app]] and [[task-visual-status-filters]].
