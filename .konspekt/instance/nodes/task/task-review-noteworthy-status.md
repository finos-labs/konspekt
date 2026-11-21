```yaml
id: task-review-noteworthy-status
type: task
title: Review the specification re noteworthy status
status: open
review: proposed
provenance:
  sourceRef: ni:///sha-256;FolGXIBJIMaI9tXhG95gna_hruiQsfM17FLXYovTsDU
  conversationId: ui-atom-panel
  timestamp: 2026-11-21T14:33:27Z
  confidence: 0.7
createdAt: 2026-11-21T14:33:27Z
updatedAt: 2026-11-21T14:33:27Z
```
# Task: Review the specification re noteworthy status

`spec/data-model/schema.ts` declares `Noteworthy.status` optional, and
`NOTEWORTHY_STATUS_BY_KIND` in `lib/conformance.mjs` gives a status vocabulary
to two kinds only: `assumption` (`unvalidated | validated | refuted`) and
`constraint` (`active | lifted`). The checker warns when a `fact`, `statement`
or `decision` carries a status, and reports nothing when an `assumption` or
`constraint` has none. In this instance, 10 of 19 constraints have no status.

Review the specification and decide:

- whether `fact`, `statement` and `decision` stay without a status (their
  replacement is carried by `supersedes` and their acceptance by `review`);
- whether status is required for `assumption` and `constraint` (a checker
  warning), or a missing value reads as `unvalidated` / `active`;
- whether to backfill the constraints that have no status, each set to `active`
  or `lifted` by a human, with a birth row in the transition log.

Success: `spec/data-model/SPEC.md`, `schema.ts` and the checker state one rule
for noteworthy status, and every noteworthy in this instance conforms to it.

Decomposes from [[goal-curated-context]].
