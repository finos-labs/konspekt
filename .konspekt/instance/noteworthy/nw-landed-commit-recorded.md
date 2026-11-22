```yaml
id: nw-landed-commit-recorded
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;P9MeQFLRAKNLz0vbvCXoQRFjgQCl9pWeVVqHNdaAsZk
  conversationId: task-pr-map
  timestamp: 2026-11-22T18:57:09Z
  confidence: 0.75
createdAt: 2026-11-22T18:57:09Z
updatedAt: 2026-11-22T18:57:09Z
```
# The review-unit log records the default-branch commit each bound commit landed as

Squash and rebase merges are in scope. Each row of `changes/review-units.md`
records `landed`: the default-branch commit that carries the bound commit's
change, and `match`: how it was found.

- `same`: the bound commit itself reached the default branch (merge-commit
  merge, or a `direct` row).
- `squash`: the review unit's merge commit, which squashed the unit's commits.
- `patch-id`: a commit the rebase put on the default branch whose
  `git patch-id --stable` equals the bound commit's.
- `position`: the rebased commit at the bound commit's position in the unit,
  used when no patch-id matches (for example, a conflict resolved during the
  rebase). The marker keeps the weaker match visible.

The binding audit counts a default-branch commit as bound when the changed-code
log names it, or when it is the `landed` of a row whose commit the changed-code
log binds; the entity is reached through that row, and the acceptance-ordering
check uses the bound commit's author time. The audit reads only the log and
stays forge-neutral.

Settled with it:

- **Lag.** After a squash or rebase merge the audit reports the new commit until
  `tools/review-units.mjs` is run and its output committed, the same staleness
  the log already has. No bot writes to the default branch.
- **Rewriting before merge.** A branch rebased or amended after binding can leave
  a bound SHA on no branch and in no unit; the checker warns on a bound commit
  with no row and does not rewrite the changed-code log.

Motivation: enterprise adopters commonly merge by squash or rebase, which the
earlier scope excluded.
