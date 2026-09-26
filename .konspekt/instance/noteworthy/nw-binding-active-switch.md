```yaml
id: nw-binding-active-switch
kind: decision
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.8
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Noteworthy: One active entity at a time, switchable on maintainer proposal

A conversation binds to one *active* entity at a time, but the binding is
switchable mid-conversation: when the topic moves to a different entity, the
maintainer proposes a switch and the human confirms -- same accept discipline as
any other venture. Each span of provenance attaches to the entity active during
it, and the switch is recorded, so the seams are auditable (turns 1-N to entity
A, turns N+1-M to entity B). Allowing several entities active at once was
rejected: it makes which entity a given source span supports ambiguous, and the
provenance property depends on that being unambiguous.
