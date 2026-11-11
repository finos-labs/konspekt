```yaml
id: nw-fleet-canonical-follow-drain-then-move
kind: decision
review: accepted
provenance:
  sourceRef: 853e31626f2212ff25762bfceb7dec90596eaf36
  contentHash: 853e31626f2212ff25762bfceb7dec90596eaf36
  conversationId: fleet-canonical-follow
  timestamp: 2026-11-11T18:19:12Z
  confidence: 0.7
createdAt: 2026-11-11T18:19:12Z
updatedAt: 2026-11-11T18:25:33Z
```
# Noteworthy: a canonical branch switch drains the outboxes onto the old branch, clears them, then moves them

In fleet mode only (the fleet config is present and every configured outbox
worktree is stood up), a switch of the committer's canonical branch is followed
by the whole fleet in this order: refuse unless the canonical worktree and every
outbox worktree are clean and every pending proposal verifies; fold every pending
proposal onto the **old** branch as `review: proposed` and apply pending claims
there; delete the drained proposals and applied claims from each outbox branch,
one commit per outbox, so nothing folds again onto the new branch; switch the
canonical worktree; write the new branch name into `canonicalBranch` in the
fleet config; merge the new branch into each outbox branch.

`canonicalBranch` is dynamic: it names the branch the committer created or
cloned into, and the committer writes it (on a switch and at `setup`) for the
proposers to follow. The follow runs from the explicit `switch-canonical`
command, from `follow-canonical` after a manual switch, and from the fold
watcher when it observes a switch; the last two drain onto the previous branch
through a temporary worktree, using the branch recorded in
`.konspekt-fleet/canonical-branch`.

This automates and extends the manual three-step procedure recorded in
[[nw-fleet-fold-follows-worktree-branch]], whose finding (folds follow the
canonical worktree's current branch) still holds. Implemented by
[[task-fleet-canonical-follow]].
