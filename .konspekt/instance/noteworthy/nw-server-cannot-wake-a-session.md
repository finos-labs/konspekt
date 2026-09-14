```yaml
id: nw-server-cannot-wake-a-session
kind: constraint
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  timestamp: 2026-09-14T16:00:00Z
  conversationId: app-design-101
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Noteworthy: No server can wake a chat session

MCP requires server-initiated requests — `sampling/createMessage`,
`elicitation/create`, `roots/list` — to be associated with an originating
client-to-server request; standalone ones must not be implemented. The stated
intent is that a user is never prompted out of nowhere.

So a watcher over the instance cannot notify a running agent session, and there
is no inbound prompt API for a hosted chat surface. Everything flows the other
way: the agent finds out by reading, at the start of a turn a human originated.
Designs that assume a push into the session are not merely unsupported, they are
ruled out by the protocol.
