```yaml
id: concept-content-addressed-provenance
label: Content-addressed provenance
aliases: [source-ref invariant, sourceRef plus contentHash]
review: accepted
provenance:
  sourceRef: ni:///sha-256;9oNMw56WvEGIOCxD2QcsF0WABJUYjGj6B1sPiXdsKcY
  timestamp: 2026-06-22T18:00:00Z
  confidence: 0.7
  conversationId: provenance-as-chat-text
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: cac9f56277870404ef9a525efd4c773c75740175
    contentHash: cac9f56277870404ef9a525efd4c773c75740175
createdAt: 2026-06-22T18:00:00Z
updatedAt: 2026-06-22T18:45:00Z
```
# Concept: Content-addressed provenance

Anchoring an entity's origin to the *content* of its source text — a pointer
plus a matching digest — rather than to a host-issued identifier. The text is
something every binding can produce; the id is not. Makes edits self-evident
(new content → new hash) and dedup structural.
