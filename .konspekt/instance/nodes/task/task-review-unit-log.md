```yaml
id: task-review-unit-log
type: task
title: Record review units (pull requests) against bound commits
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-22T16:44:55Z
review: proposed
provenance:
  sourceRef: ni:///sha-256;9T50L83o1_4jb1fTgumyngCBEDVpGnCuM1i5kzBikkY
  conversationId: task-pr-map
  timestamp: 2026-11-22T16:44:55Z
  confidence: 0.75
createdAt: 2026-11-22T16:44:55Z
updatedAt: 2026-11-22T16:44:55Z
```
# Task: Record review units (pull requests) against bound commits

Give every entity a derived link to the review units that delivered it, per
[[nw-task-pr-map-derivable]]. A **review unit** is the forge's unit of review
and merge; on GitHub, the reference binding, it is a pull request.

- **Log.** An optional engineer log `changes/review-units.md`, columns
  `| review unit | state | merge commit | commit | timestamp |`, one row per
  (review unit, commit). It records only commits already bound in
  `changes/changed.md`; the entity is reached through that log. Defined in
  `spec/personas/engineer/SPEC.md` and `registry.mjs` beside the
  changed-code log.
- **Tool.** `tools/review-units.mjs` asks the forge, for each bound commit,
  which review units contain it, and writes the rows. Rows are written by the
  tool, never by hand. Its output is bookkeeping (`.konspekt/instance/**`
  only). The forge query is one adapter; GitHub is the first.
- **Coverage.** Any review unit, opened by a human, an agent or a bot, gets
  rows once it contains a bound commit. `state` covers open, merged and
  closed, so a raised but unmerged unit is visible. A commit in stacked units
  gets a row per unit. Work committed to `main` directly has no row.
- **Check.** Conformance reports a row whose commit is not in the changed-code
  log.
- **Policy.** When the tool runs (after a merge, or before `push`) is host
  policy in `OPERATING.md`. Squash and rebase merges replace bound SHAs and
  are out of scope, as they already are for the changed-code log.
- **Projection.** Entity to review units is a generated projection, like
  `ROADMAP.md`; the UI drawer can show it.

Out of scope: `TRANSPORT.md`'s rule that instance persistence uses no pull
requests is unchanged; review units here are units of code work.

Decomposes [[investigation-task-pr-map]].
