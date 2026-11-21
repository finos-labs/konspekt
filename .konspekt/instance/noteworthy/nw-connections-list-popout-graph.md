```yaml
id: nw-connections-list-popout-graph
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;pWZuS224nZ9ay2z6P95IyHMA6k9_rLyUqfKnhq8b3R0
  conversationId: ui-atom-panel
  timestamp: 2026-11-21T15:19:49Z
  confidence: 0.9
createdAt: 2026-11-21T15:19:49Z
updatedAt: 2026-11-21T15:19:49Z
```
# Noteworthy: The Connections frame is a list; the graph is the pop-out

The drawer's Connections frame is a list only, grouped by edge kind. The graph
form of an entity's connections is the pop-out view, not an in-drawer graph.

Supersedes [[nw-connections-list-default-graph-toggle]], which kept an ego-graph
toggle in the frame. Notes [[task-ui-atom-neighborhood-graph]].
