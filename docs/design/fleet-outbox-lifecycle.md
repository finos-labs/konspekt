# Fleet outbox lifecycle and idempotent-fold contract

Status: non-normative design note (`docs/design/` — fleet vocabulary, not
`spec/`). `spec/` governs on any conflict. Realizes the artifact record
`artifact-fleet-outbox-lifecycle`; serves `task-fleet-worktree-committer`.

The fleet design defines how a proposal enters an outbox (`propose`) and how the
committer folds it (`run-pass`). It did not define what happens to a
`proposals/<id>/` directory after the fold. `nw-fleet-refold-clobbers-blessed`
records the result: `foldProposal` rewrites `entity.md` unconditionally, so a
second `run-pass` over an outbox that still holds a folded proposal resets a
blessed atom to `review: proposed` and duplicates its edge and transition rows.
The current workaround is a manual `git rm` of each folded proposal before the
next pass. `task-fleet-committer-refold-dedup` carries the implementation of the
fix; this note is its contract.

## The contract

1. **Proposal states.** A proposal in an outbox is `pending` (not yet on
   canonical), `folded` (its entity is on canonical), or `set-aside` (verify
   failed). Consumption, the removal of `proposals/<id>/` from the outbox, is
   permitted only for `folded` and `set-aside` proposals.
2. **Consumer.** The proposer owns its outbox branch, so the proposer removes its
   own folded proposals (`git rm` plus a signed commit on `outbox/<handle>`). The
   committer never writes a proposer branch. The committer reports which
   proposals each pass folded or set aside, and that report is the proposer's
   input.
3. **Idempotent-fold invariant.** A `run-pass` over outboxes whose contents have
   not changed since the previous pass changes nothing on canonical. This
   invariant holds whether or not any proposer has consumed its outbox.
4. **Dedup key from canonical alone.** The fold decides "already folded" by
   reading canonical: the target entity file exists and its `provenance`
   `contentHash` equals the proposal's source hash. The `.konspekt-fleet/` fold
   log is gitignored derived state (`fleet-recovery.md`), so it cannot decide a
   write to canonical. An already-folded proposal is reported as `ALREADY FOLDED`
   and skipped. Its entity, edges, and transition rows are not rewritten, so a
   blessed or rejected `review` value is kept.
5. **Collision rule.** When the entity id exists on canonical with a different
   `contentHash`, the proposal is set aside with reason `id collision`. It does
   not overwrite the existing entity. A changed atom is proposed under a new id
   with a `supersedes` edge.

With items 3 and 4 in force, consumption (item 2) keeps outboxes small and is no
longer required for correctness, and the manual consume-before-re-fold step in
`nw-fleet-refold-clobbers-blessed` becomes optional. The contract selects the
canonical-side dedup over an incremental outbox read because only the
canonical-side check holds after a lost `.konspekt-fleet/` directory or a fresh
checkout.

## Implementation status

This note is the design; the dedup and collision checks are not yet implemented
in `implementations/fleet/app/fold.mjs`. Until they are, the re-fold hazard is
live and the manual consume-after-fold workaround
(`nw-fleet-refold-clobbers-blessed`) remains mandatory between passes.
