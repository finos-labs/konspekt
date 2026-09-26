```yaml
id: task-binding-invariant-spec
type: task
title: Add the provenance-completeness invariant to the spec
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-26T18:16:00Z
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.7
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Task: Add the provenance-completeness invariant to the spec

The portable half of `task-conversation-binding`. Adds invariant V
(`concept-provenance-completeness`) to the standard:

- `spec/architecture/BINDING.md` -- new architecture doc stating the invariant,
  its extraction-layer enforcement, the referential-integrity framing, and its
  scope-in / scope-out boundary (behavior and prompting are host policy, out of
  scope, consistent with the triggers and review-surface carve-outs).
- `spec/architecture/REVIEW.md` -- the invariant added as a sibling to the
  confidence-mandatory rule, pointing at `BINDING.md`.
- `spec/data-model/SPEC.md` and `spec/data-model/schema.ts` -- define
  `binding: required | optional` as a `Project`-level field, and name
  binding-completeness under Principle 3 (Auditable by construction).

Produces `artifact-spec` and `artifact-review`. Mentions
`concept-provenance-completeness` and `concept-content-addressed-provenance`.
