```yaml
id: wp-conversation-binding
kind: decision
timestamp: 2026-09-26T18:16:00Z
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.75
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Waypoint: Conversation binding adopted (invariant V)

Settled that a konspekt-enabled project binds every conversation to a graph
entity while it is live. Adds provenance completeness as the fifth invariant,
enforced at extraction (not by a persist gate), with the ask-at-open and
active-entity switch as host-policy behavior in `.konspekt/OPERATING.md`.
Configurable per instance via `binding: required | optional`. Origin: two design
conversations that themselves produced no captured entities
(`nw-no-artifacts-captured`).

**marks** task-conversation-binding.
