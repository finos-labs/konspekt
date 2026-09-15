```yaml
id: nw-one-view-two-transports
kind: decision
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  timestamp: 2026-09-14T16:00:00Z
  conversationId: app-design-101
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Noteworthy: One view, two transports

The same HTML view serves both deployments, behind a transport adapter with two
implementations: direct calls to the konspekt R/W API in the local shell, and
tool calls relayed through the host from inside the iframe. Lifecycle differs too
— a card is bound to one tool call, a local page is long-lived and can subscribe
to change events.

Sharing the view is not about saving effort. Disposition semantics are what must
not drift: two separately written views produce two review behaviours over one
instance, with no way to tell afterwards which one produced a given accept.
