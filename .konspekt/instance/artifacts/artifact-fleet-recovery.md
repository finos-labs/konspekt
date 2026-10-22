```yaml
id: artifact-fleet-recovery
name: fleet committer recovery and proposed-index durability note
kind: doc
location: docs/design/fleet-recovery.md
createdAt: 2026-10-21T00:00:00Z
updatedAt: 2026-10-21T00:00:00Z
review: accepted
provenance:
  sourceRef: 3b2d2e9ad4faba2bdc8997dc5399f2c356f280df
  contentHash: 3b2d2e9ad4faba2bdc8997dc5399f2c356f280df
  conversationId: fleet-uat-spec-writer
  timestamp: 2026-10-22T01:47:58.161Z
  confidence: 0.6
```
# Artifact: fleet committer recovery and proposed-index durability note

The fleet design asserts that a crash between the fold commit and a
`proposed`-ref update "cannot make the store lie" and that the derived index is
rebuilt with `rebuild-index`, but the recovery contract itself is never written
down in one place: it survives only as a fleet-spec sentence, a README table
row, and code comments in `proposed-ref.mjs`. This note closes that ambiguity. It
names the committer's durability contract under `docs/design/` (fleet-vocabulary
territory, not `spec/`): the single invariant that canonical is the only
authoritative input and the index is never read back onto it; the enumerated
crash points along the fold / materialize / bless / record path and what each
one leaves behind; and the exact `rebuild-index` reconstruction procedure —
reading the fold log, joining each folded `proposal_id` to the current `review`
of its atom on canonical, classifying pending / accepted / rejected / missing,
and overwriting the materialized index so a fresh build after a crash is correct
by construction. It states the operator runbook (when to run `rebuild-index`:
after a fold, after a crash, or whenever the cached queue is suspect) so an
operator recovering a halted committer does not have to infer the safe action
from source.
