```yaml
id: nw-timestamp-source-time
kind: constraint
status: active
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
# Noteworthy: timestamp is source time, never transport time

`provenance.timestamp` records when the source exchange *happened* and is
binding-independent. The timeline must never be derived from transport metadata
— e.g. a git commit time — even though the store knows it. Commit time is when a
write landed (transport), not when a thing was said (source); reading it would
give the dumb blob store a semantic job the contract denies it, and would break
on any binding without commits. Source time stays a first-class field carried by
the data.
