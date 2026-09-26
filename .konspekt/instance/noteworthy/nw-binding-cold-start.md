```yaml
id: nw-binding-cold-start
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
# Noteworthy: Binding is settled by a direct ask at conversation open

The maintainer's first move is to ask the human directly whether the conversation
attaches to an existing entity (give the id) or creates a new one (name the
type). Bind-before-first-turn, as a direct question. For an exploratory start
where the type is not yet clear, the maintainer proposes `investigation` as the
default -- "I don't know yet" maps to a real node type rather than a stall -- and
the entity can be pinned to a `goal` later once the intent is clear. The ask is
unconditional; the answer is the human's.
