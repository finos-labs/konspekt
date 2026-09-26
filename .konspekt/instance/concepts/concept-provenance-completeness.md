```yaml
id: concept-provenance-completeness
label: Provenance completeness
aliases: [invariant V, binding completeness, no free-floating conversation]
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.75
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Concept: Provenance completeness

Every persisted atom resolves to an entity binding, or to a recorded decision
not to bind. Stated as the fifth invariant, alongside the existing four
(store-stays-simple, read-path-neutral, distribution-is-projection,
accept-does-not-converge). Its purpose is to close the gap where a conversation
produces no entity at all, so its source text is referenced nowhere and leaves no
trace -- the failure that motivated it (`nw-no-artifacts-captured`).

Framed as **referential integrity**, not judgment: the requirement is that an
atom references an entity that exists, the way a foreign key requires a valid
parent. It does not decide whether the atom is *good* -- acceptance judgment
stays in the review conversation (`concept-propose-accept-separation`), so the
invariant does not collide with the machine-proposes-human-disposes rule.

Enforced at the extraction layer, the same way `provenance.confidence` is
mandatory on every proposed atom, rather than by a gate that blocks persist --
because "review does not block persist; nothing is held hostage in a working
copy" is already a governing rule of `spec/architecture/REVIEW.md`.
