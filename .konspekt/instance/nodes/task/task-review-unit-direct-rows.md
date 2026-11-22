```yaml
id: task-review-unit-direct-rows
type: task
title: Record direct-to-default-branch commits in the review-unit log
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-22T18:49:13Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;wFlEqUaI0PGZ1CcxBpuUt0QNJX63-6ZfT5doBMllDM4
  conversationId: task-pr-map
  timestamp: 2026-11-22T18:49:13Z
  confidence: 0.8
createdAt: 2026-11-22T18:49:13Z
updatedAt: 2026-11-22T18:50:42Z
```
# Task: Record direct-to-default-branch commits in the review-unit log

Implement [[nw-direct-commits-recorded]]: every bound commit on the default
branch gets a row in `changes/review-units.md`, and a commit that no review
unit contains gets a `state: direct` row.

- **Spec.** `spec/personas/engineer/SPEC.md` § Review units: add `direct` to
  `state`; a `direct` row has an empty review unit and merge commit and the
  commit's timestamp; an absent row means "not on the default branch yet, or
  not derived yet".
- **Checker.** `registry.mjs`: `review-unit-incomplete` accepts an empty
  review unit and merge commit only for `direct`; a `direct` row with a review
  unit is an error; a bound commit with no row is a warning.
- **Tool.** `tools/review-units.mjs`: emit `direct` rows for bound commits
  reachable from the default branch that no review unit contains, reading the
  branch history through git; `--check` and `--report` cover them.
- **Viewers.** The implementation-zero atom drawer (bundled by the IntelliJ
  plugin, version bumped) labels a commit "direct to main" only from a
  `direct` row and "no review unit yet" when it has no row.
- **Log.** Regenerate `changes/review-units.md`.

Delivered as a pull request.
