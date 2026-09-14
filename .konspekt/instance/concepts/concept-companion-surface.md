```yaml
id: concept-companion-surface
label: Companion surface, not a chat client
aliases: [companion app, alongside the agent, konspekt UI is a companion]
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  conversationId: app-design-101
  timestamp: 2026-09-14T16:00:00Z
  confidence: 0.75
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Concept: Companion surface, not a chat client

The konspekt interface runs alongside the native agent UI and never tries to
replace it. The native surface keeps conversation, model work, tool calls and
the rest of a mature product; rebuilding any of that would be worse and would
never finish.

What the companion takes is the work chat is bad at: a queue of proposed atoms
with their provenance visible together, the graph with status and review as
visual channels, and batch disposition where a human accepts nine and rejects
one in seconds instead of nine turns.

The instance is the coordination point between the two. The agent proposes into
the store, the human dispositions in the companion, and the agent sees the new
state the next time it reads. No channel from the companion into the session is
required for this to work, which matters because none can exist.
