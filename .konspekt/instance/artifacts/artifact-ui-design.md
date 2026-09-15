```yaml
id: artifact-ui-design
name: UI architecture (non-normative)
kind: doc
location: spec/architecture/UI-ARCHITECTURE.md
review: proposed
provenance:
  sourceRef: c952f0ebdf6fdb037a918d071b415188071a9a1c
  contentHash: c952f0ebdf6fdb037a918d071b415188071a9a1c
  timestamp: 2026-09-14T19:00:00Z
  conversationId: app-design-101
createdAt: 2026-09-14T19:00:00Z
updatedAt: 2026-09-14T19:00:00Z
```
# Artifact: UI architecture (non-normative)

Design background for the konspekt UI application at
`spec/architecture/UI-ARCHITECTURE.md`, with `ui-architecture.svg` beside it.
Names the eleven components and the links between them, and records what is
deliberately absent: no channel into a chat session, no write-scope split, no
mandated push, no vendor mobile target, no second view.

Non-normative by intent, in the same sense as `artifact-whitepaper`: `spec/`
governs on any conflict and nothing here constrains an implementer. Unlike
generated artifacts, the diagram cannot be derived from the graph — it draws
components and vendor infrastructure rather than entities — so it is a
hand-maintained snapshot of the design session of 2026-09-14, to be redrawn
rather than patched. See `nw-derive-not-copy` for why that exception is worth
naming.
