```yaml
id: task-fleet-proposal-carries-files
type: task
title: Let a fleet proposal land repository files, not only graph atoms
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-24T14:31:08Z
review: accepted
provenance:
  sourceRef: a65bb450013ce6f0751de7b4332dd934083740cb
  contentHash: a65bb450013ce6f0751de7b4332dd934083740cb
  conversationId: fleet-proposal-file-payload
  timestamp: 2026-10-24T14:25:57Z
  confidence: 0.75
createdAt: 2026-10-24T14:25:57Z
updatedAt: 2026-10-25T14:10:00Z
```
# Task: Let a fleet proposal land repository files, not only graph atoms

A fleet proposer has no protocol path for a repository file outside the konspekt
instance. The committer moves exactly one proposal directory from an outbox to
canonical (`proposals/<id>/` holding `entity.md`, `source.md`, `edges.md`,
`meta.json`); `run-pass` writes only under the instance directory
(`.konspekt/fleet/app/fold.mjs`); and `bless` is field-only and authors no
content, so the committer cannot copy a file by hand without putting model
judgment on the write path. Every file a proposer writes — documents, source
code, tests, configuration — and the changed-code rows that bind code stay on
the outbox branch and never reach canonical.

Observed 2026-10-24 in `cdm-collateral-fleet` (spec-writer outbox, constraint
`nw-fleet-no-file-path`): `artifact-business-case` was folded and blessed on
`e2e-wiring` with `location: docs/analysis/business-case.md`, while the document
itself and its changed-code row never reached canonical — canonical then holds
an accepted artifact whose `location` does not exist. The only route today is a
manual human merge or cherry-pick of the outbox branch, outside the fleet.

Candidate fixes, for the konspekt core to decide:

1. **Proposal carries a file set.** `propose` accepts files with target paths and
   content hashes; `run-pass` verifies the hashes and writes them beside the atom
   in the same fold commit, with the changed-code rows, so the atom and the files
   it describes land whole. `bless` stays field-only.
2. **Outbox commits as the payload.** The proposal names outbox commits; the
   committer verifies they touch only the declared paths and applies them
   deterministically at fold.
3. **Human merge is the protocol.** The spec states that only atoms fold and that
   repository files reach canonical by human merge of the outbox branch, with the
   artifact record's `location` checked at bless time.

Any fix must keep the committer deterministic with no model on the write path.

Success: a fleet proposal that includes a file (document, code, config) lands
that file on canonical through the committer — or the spec explicitly designates
human merge as the route and the committer refuses to bless an artifact whose
`location` is absent.

Decomposes [[task-agent-fleet]]; links to [[task-fleet-worktree-committer]].
Origin: the `nw-fleet-no-file-path` constraint proposed in the
`cdm-collateral-fleet` spec-writer outbox; that noteworthy lives in the adopter
repository and is not folded here.
