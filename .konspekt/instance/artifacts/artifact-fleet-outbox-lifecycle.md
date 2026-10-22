```yaml
id: artifact-fleet-outbox-lifecycle
name: fleet outbox lifecycle and idempotent-fold contract
kind: doc
location: docs/design/fleet-outbox-lifecycle.md
createdAt: 2026-10-22T00:00:00Z
updatedAt: 2026-10-22T00:00:00Z
review: accepted
provenance:
  sourceRef: 99060bd063e1a70fb8e93477e77bd982f3610884
  contentHash: 99060bd063e1a70fb8e93477e77bd982f3610884
  conversationId: fleet-uat-spec-writer
  timestamp: 2026-10-22T16:21:19.086Z
  confidence: 0.55
```
# Artifact: fleet outbox lifecycle and idempotent-fold contract

The fleet design defines how a proposal enters an outbox (`propose`) and how
the committer folds it (`run-pass`). It does not define what happens to a
`proposals/<id>/` directory after the fold. `nw-fleet-refold-clobbers-blessed`
records the result: `foldProposal` rewrites `entity.md` unconditionally, so a
second `run-pass` over an outbox that still holds a folded proposal resets a
blessed atom to `review: proposed` and duplicates its edge and transition rows.
The current workaround is a manual `git rm` of each folded proposal before the
next pass. `task-fleet-committer-refold-dedup` lists two candidate fixes
(dedup by folded proposal id, or an incremental outbox read) and selects
neither.

This note, placed under `docs/design/` because outbox and proposal id are
fleet-binding vocabulary, closes that ambiguity. It states:

1. **Proposal states.** A proposal in an outbox is `pending` (not yet on
   canonical), `folded` (its entity is on canonical), or `set-aside` (verify
   failed). Consumption, the removal of `proposals/<id>/` from the outbox, is
   permitted only for `folded` and `set-aside` proposals.
2. **Consumer.** The proposer owns its outbox branch, so the proposer removes
   its own folded proposals (`git rm` plus a signed commit on
   `outbox/<handle>`). The committer never writes a proposer branch. The
   committer reports which proposals each pass folded or set aside, and that
   report is the proposer's input.
3. **Idempotent-fold invariant.** A `run-pass` over outboxes whose contents
   have not changed since the previous pass changes nothing on canonical. This
   invariant holds whether or not any proposer has consumed its outbox.
4. **Dedup key from canonical alone.** The fold decides "already folded" by
   reading canonical: the target entity file exists and its `provenance`
   `contentHash` equals the proposal's source hash. The `.konspekt-fleet/`
   fold log is gitignored derived state (`docs/design/fleet-recovery.md`), so
   it cannot decide a write to canonical. An already-folded proposal is
   reported as `ALREADY FOLDED` and skipped. Its entity, edges, and transition
   rows are not rewritten, so a blessed or rejected `review` value is kept.
5. **Collision rule.** When the entity id exists on canonical with a different
   `contentHash`, the proposal is set aside with reason `id collision`. It does
   not overwrite the existing entity. A changed atom is proposed under a new id
   with a `supersedes` edge.

With items 3 and 4 in force, consumption (item 2) keeps outboxes small and is
no longer required for correctness, and the manual consume-before-re-fold step
in `nw-fleet-refold-clobbers-blessed` becomes optional. The note selects the
canonical-side dedup over the incremental outbox read because only the
canonical-side check holds after a lost `.konspekt-fleet/` directory or a
fresh checkout.
