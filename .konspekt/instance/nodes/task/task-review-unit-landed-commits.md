```yaml
id: task-review-unit-landed-commits
type: task
title: Record the landed commit for squash and rebase merges; bind it in the audit
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-22T18:57:09Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;P9MeQFLRAKNLz0vbvCXoQRFjgQCl9pWeVVqHNdaAsZk
  conversationId: task-pr-map
  timestamp: 2026-11-22T18:57:09Z
  confidence: 0.75
createdAt: 2026-11-22T18:57:09Z
updatedAt: 2026-11-22T18:57:09Z
```
# Task: Record the landed commit for squash and rebase merges; bind it in the audit

Implement [[nw-landed-commit-recorded]].

- **Spec.** `spec/personas/engineer/SPEC.md` § Review units: add the `landed`
  and `match` columns; replace "squash and rebase merges are out of scope".
- **Checker.** `registry.mjs` and `lib/conformance.mjs`: validate `match`
  (`same | squash | patch-id | position`) and require `landed` and `match`
  together.
- **Tool.** `tools/review-units.mjs`: for a merged unit whose bound commit is not
  on the default branch, fetch the unit's head, match by `git patch-id` against
  the commits the merge put on the default branch, fall back to position, and
  otherwise record the merge commit as a squash.
- **Audit.** `tools/binding-audit.mjs`: count a `landed` commit as bound, with
  the entity and author time of the bound commit.
- **Viewers.** Show where a commit landed when it differs from the commit.

Delivered in the same pull request as [[task-review-unit-direct-rows]].
