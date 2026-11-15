```yaml
id: nw-no-artifacts-captured
kind: fact
review: proposed
provenance:
  sourceRef: ni:///sha-256;_6jKWgqtgaPGSC45KDUBOqXvupECW48RadXoIEJBg78
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.85
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
    contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Noteworthy: Capture-from-outside defaults to no capture

Two design conversations (the deck-generating one and the experiment-design one)
produced no konspekt entities: nothing wrote into an instance, so the source text
of either conversation is referenced nowhere in the graph. The reason is
structural, not an oversight -- capture happened from outside, after the fact, if
anyone remembered, so the default outcome is no capture. This is the finding that
motivated `task-conversation-binding` and `concept-provenance-completeness`: the
fix inverts the default by making binding a precondition of durability while the
conversation is live.
