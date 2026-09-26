```yaml
id: nw-binding-retroactive
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
# Noteworthy: Retroactive binding allowed before persist, never after

A conversation (or a span of it) may be bound late -- once its significance is
clear -- as a switch whose target is decided at the end rather than the start.
This is what makes an exploratory opening legal: the conversation that only
becomes a skills-change entity partway through binds that span retroactively. The
constraint: retroactive means anytime in the working copy **before** `persist`,
never after an atom is in the store. Since binding is mandatory at extraction, the
decision already lands no later than the atom is proposed; retroactive binding
cannot become a way to launder unbound atoms into the durable record.
