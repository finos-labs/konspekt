```yaml
id: wp-provenance-model
kind: decision
timestamp: 2026-06-22T18:00:00Z
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
# Waypoint: Provenance anchors on content-addressed source

Decided provenance points at addressable source text (`sourceRef` + a matching
`contentHash`), with the git blob as the store, rather than at host
conversation/message ids. Routes around the host-injection problem instead of
waiting on vendor support. Refines investigation-operating-loop; opened the
`instance/sources/` store.

**marks** investigation-operating-loop.
