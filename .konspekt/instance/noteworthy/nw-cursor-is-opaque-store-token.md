```yaml
id: nw-cursor-is-opaque-store-token
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
# Noteworthy: The cursor is an opaque store token, not an atom

The changes-since cursor is a string returned by the store and comparable only by
the store. It is deliberately not a file in the instance: a cursor atom would be
the one line every writer has to update, making it the contention point for all
of them, and a second source of truth that can disagree with the history.

Keeping it opaque also keeps the standard off git. The git backend can return a
commit SHA, a document store a change-feed resume token, a relational store a log
position, and no caller parses any of them.
