```yaml
id: nw-direct-commits-recorded
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;2xV_ye3RaBbCbZwO8SC4IrFAK5qeUEHfvKZhIXrSFaM
  conversationId: task-pr-map
  timestamp: 2026-11-22T18:21:29Z
  confidence: 0.8
createdAt: 2026-11-22T18:21:29Z
updatedAt: 2026-11-22T18:21:29Z
```
# A bound commit made outside any review unit is recorded as `direct`

The review-unit log (`changes/review-units.md`) records a row for every bound
commit on the default branch, including those no review unit contains. Such a
row has `state: direct`, an empty `review unit` and `merge commit`, and the
commit's own timestamp.

Before this, an absent row was the only sign of a commit pushed straight to the
default branch, and absence had three readings: pushed directly, on a branch
whose review unit is not open yet, or a log not regenerated since the unit
opened. Measured on this instance on 2026-11-22: 209 bound commits, 130 in a
pull request, 79 with no row, all 79 on `origin/main`.

Consequences:

- `state` gains the value `direct`. `review-unit-incomplete` accepts an empty
  review unit and merge commit only when `state` is `direct`.
- An absent row now means only "not on the default branch yet, or not derived
  yet". A viewer labels a commit "direct to main" only from a `direct` row.
- The checker may warn on a bound commit with no row; a warning, since a commit
  on an open branch legitimately has none.
- The derivation reads the default branch's history as well as the forge.
