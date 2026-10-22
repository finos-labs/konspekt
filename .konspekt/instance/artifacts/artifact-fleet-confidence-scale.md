```yaml
id: artifact-fleet-confidence-scale
name: fleet proposer confidence scale
kind: doc
location: docs/design/fleet-confidence-scale.md
createdAt: 2026-10-22T16:56:02Z
updatedAt: 2026-10-22T16:56:02Z
review: accepted
provenance:
  sourceRef: fbf04d9c2e5ef1d7ca1b0c7dd9368742572caf24
  contentHash: fbf04d9c2e5ef1d7ca1b0c7dd9368742572caf24
  conversationId: f566a79b-eb21-4dba-91e8-01ad540a0b8e
  timestamp: 2026-10-22T16:56:07.396Z
  confidence: 0.6
```
# Artifact: fleet proposer confidence scale

`spec/architecture/REVIEW.md` makes `provenance.confidence` the review-queue
sort key, and `task-agent-fleet` names confidence and proposer as the triage
keys for one human reviewing many agents. The fleet does not define what the
number measures. Each role skill sets it by a different criterion:
`fleet-spec-writer` by how settled the content is, `fleet-presentation-writer`
by how sure the agent is the deck is worth a reviewer's time, and
`fleet-skill-builder` by how much the skill would change an agent's behavior.
A queue sorted lowest-first across all three proposers therefore orders values
taken on three different scales, and a 0.6 from one role carries no information
relative to a 0.6 from another.

This note, placed under `docs/design/` because proposer and outbox are
fleet-binding vocabulary, closes that ambiguity. It states:

1. **One criterion for every role.** `confidence` is the proposer's estimate of
   the probability that the human accepts the atom unchanged. Role skills keep
   their role-specific quality advice, and that advice informs the estimate; it
   does not redefine the scale.
2. **Anchored bands.** Below 0.4: the proposer expects rejection or rework, or
   the atom restates something it could not verify on canonical. 0.4 to 0.7: the
   content is plausible and grounded in canonical, but a placement, binding, or
   overlap with an existing atom is unresolved. Above 0.7: every claim is checked
   against canonical, the binding is direct, and no near-duplicate was found.
   Above 0.9 requires a cited canonical source that settles the content.
3. **Required grounding.** A value above 0.7 states in the prose which canonical
   surfaces were checked. The committer does not verify the statement; the
   reviewer reads it.
4. **Per-proposer drift is observable, not corrected.** The accept record
   (`fleet-spec.md` step 7) carries the proposer and the outcome, so the
   reviewer can compare each proposer's stated confidence against its
   acceptance rate. The committer never rescales a proposer's value; it copies
   the atom byte for byte (`nw-fleet-remove-fold-translation`).
5. **Sort rule unchanged.** Lowest confidence first, a missing value treated as
   lowest (`REVIEW.md`). Proposer is a secondary key for grouping only.

Follow-on edits this note implies: the three role skills replace their
per-role confidence sentences with a reference to this scale, and
`fleet-proposer-common` points to it from step 5.

Canonical surfaces checked: `spec/architecture/REVIEW.md` § Confidence
triages attention, `docs/design/fleet-spec.md`, the three role skills under
`.claude/skills/`, `task-agent-fleet`, and the existing fleet artifacts
(no artifact defines a confidence scale).
