```yaml
id: nw-push-based-idempotence
kind: statement
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
# Noteworthy: Push-based ingestion makes match-level dedup primary

Bringing source excerpts into the store at extraction time (push-based) inverts
the idempotence design: identity is the content-addressed source blob, so a
re-run reproduces the same blob and dedups for free. Match-level dedup becomes
primary; the skip-level watermark demotes to a timestamp-ordered *optimization*,
no longer required for correctness. This works because the source excerpt is
near-deterministic even though atom extraction is not — the stable key sits
underneath the unstable layer. Worst case, UI manual curation fixes atoms; it
never has to re-establish identity.
