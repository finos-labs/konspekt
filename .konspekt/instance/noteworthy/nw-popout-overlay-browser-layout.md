```yaml
id: nw-popout-overlay-browser-layout
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;pWZuS224nZ9ay2z6P95IyHMA6k9_rLyUqfKnhq8b3R0
  conversationId: ui-atom-panel
  timestamp: 2026-11-21T15:19:49Z
  confidence: 0.6
createdAt: 2026-11-21T15:19:49Z
updatedAt: 2026-11-21T15:19:49Z
```
# Noteworthy: The pop-out graph is an overlay with a layout computed in the browser

The pop-out graph opens as an overlay over the page, in the standalone view and
in the plugin's tool window alike, so it needs no Kotlin UI code. Its layout is
computed in the browser: a radial tree around the current entity over a
breadth-first walk of all edges, with entities more than two hops out drawn as
unlabeled dots. The server only serves the graph (`/api/fullgraph`).

Notes [[task-ui-atom-neighborhood-graph]].
