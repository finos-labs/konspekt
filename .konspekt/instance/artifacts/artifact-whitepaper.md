```yaml
id: artifact-whitepaper
name: Technical whitepaper
kind: doc
location: WHITEPAPER.md
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
# Artifact: technical whitepaper

A non-normative, second-implementer-depth technical summary of konspekt at the
repository root (`WHITEPAPER.md`). Covers motivation and stance, the data model
(entities, edge kinds, derived views, human vocabulary), the four architecture
contracts (reconciliation, serialization, transport, review), the operating
loop, adoption (setup kit, web/mobile seed, distribution), and status. It routes
every section to the owning file under `spec/` as authority and states that
`spec/` governs on any conflict, so it summarizes rather than competing as a
second source of truth. Excluded from `distribution/` by intent — see
`nw-whitepaper-non-normative`.
