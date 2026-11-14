```yaml
id: nw-whitepaper-non-normative
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;XvcnB6VecyVtlU6YOX3K_xSMsa5px44_vhEBiqMjC4c
  timestamp: 2026-06-24T12:00:00Z
  conversationId: whitepaper
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: b75fefa7933493f9a154a76c18bde311cf0e5f5c
    contentHash: b75fefa7933493f9a154a76c18bde311cf0e5f5c
createdAt: 2026-06-24T12:00:00Z
updatedAt: 2026-06-24T12:00:00Z
```
# Noteworthy: the whitepaper is non-normative and not distributed

Decision: `WHITEPAPER.md` lives at the repository root and is deliberately
excluded from `distribution/`. The build (`distribution/build/distribute.mjs`)
bakes only the conformance target (`spec/`), the adopter kit (`setup/`), and the
maintainer skills; a prose summary is not something an adopter conforms to.

The whitepaper is therefore a derived, non-normative surface: `spec/data-model/`
and `spec/architecture/` remain the single source of truth, and the whitepaper
states that `spec/` governs on any conflict. Keeping it out of `distribution/`
and marking it non-normative prevents it from becoming a second authority that
drifts from the spec — the same single-source-of-truth discipline that keeps
`distribution/` derived rather than hand-copied (`nw-derive-not-copy`).
