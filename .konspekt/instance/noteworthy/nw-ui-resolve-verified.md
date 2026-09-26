```yaml
id: nw-ui-resolve-verified
kind: fact
review: accepted
provenance:
  sourceRef: 44b51f8e3a332bf62e25beedafc51b8b21e8ce7b
  contentHash: 44b51f8e3a332bf62e25beedafc51b8b21e8ce7b
  conversationId: ui-resolve-action
  timestamp: 2026-09-26T15:00:00Z
  confidence: 0.75
createdAt: 2026-09-26T15:00:00Z
updatedAt: 2026-09-26T15:00:00Z
```
# Noteworthy: resolve from the UI verified in both shells

The `resolve` action was verified end-to-end in both shells on 2026-09-26.

- **Standalone (implementation-zero):** `node --test` passes, including resolve
  success, idempotency, non-node refusal (400), GET→405, and unknown-id (400) —
  the write tests run against a throwaway copy of the instance so the repo stays
  clean.
- **IntelliJ plugin:** `./gradlew buildPlugin` succeeds and the rebuilt zip,
  installed from disk into IntelliJ 2026.2, resolves an open node from the tool
  window (human-confirmed).

Dogfood: [[task-intellij-plugin-distribution]] was resolved from the UI itself
(a proposed node → resolved + accepted, with two edges auto-accepted), and
[[task-intellij-plugin]] via the endpoint (already accepted → status flip only).
Notes [[task-ui-resolve-action]].
