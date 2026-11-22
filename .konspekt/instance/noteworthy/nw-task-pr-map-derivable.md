```yaml
id: nw-task-pr-map-derivable
kind: fact
review: proposed
provenance:
  sourceRef: ni:///sha-256;9T50L83o1_4jb1fTgumyngCBEDVpGnCuM1i5kzBikkY
  conversationId: task-pr-map
  timestamp: 2026-11-22T16:44:55Z
  confidence: 0.85
createdAt: 2026-11-22T16:44:55Z
updatedAt: 2026-11-22T16:44:55Z
```
# A task-to-pull-request map is derivable from the changed-code log

Joining an instance's changed-code log (entity, commit) with the forge's
commit list for each merged pull request reproduces a hand-kept task-to-PR map.
On one adopter, a 47-row hand map, the derivation named every pull request of
45 rows. Of the other two, one was a stacked pull request that the measuring
script did not count twice, and one was an error in the hand map: it named a
pull request for work that had gone to `main` directly.

Two consequences. A hand-kept map drifts, so the review-unit link should be
derived, not typed. A task commonly spans several pull requests, so the derived
link is many review units per entity, and a single "primary" pull request is a
project's own presentation choice.

Preconditions: commits are bound in the changed-code log, and review units
merge by merge commit, so the bound SHAs reach `main`.
