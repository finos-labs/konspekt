```yaml
id: nw-provenance-content-addressed
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;9oNMw56WvEGIOCxD2QcsF0WABJUYjGj6B1sPiXdsKcY
  timestamp: 2026-06-22T18:00:00Z
  conversationId: provenance-as-chat-text
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: cac9f56277870404ef9a525efd4c773c75740175
    contentHash: cac9f56277870404ef9a525efd4c773c75740175
createdAt: 2026-06-22T18:00:00Z
updatedAt: 2026-06-22T18:45:00Z
```
# Noteworthy: Provenance is content-addressed, not id-addressed

Every entity's provenance points at its source *text* via `sourceRef` (a
content-pinned address) plus `contentHash` (the digest captured at construction
time); an entity verifies iff re-hashing `sourceRef` reproduces `contentHash`.
This sidesteps the host-injection problem (a maintainer cannot read its own
conversation/message id): the text is something every binding has. `sourceRef`
and `contentHash` stay *two* fields because a deep-link binding's addressed text
can drift, so the digest is the integrity gate; the GitHub binding collapses
them (blob SHA = content hash) and the invariant holds structurally.
`conversationId` demotes to optional grouping; `messageId` is retired.
