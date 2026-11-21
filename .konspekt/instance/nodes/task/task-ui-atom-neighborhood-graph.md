```yaml
id: task-ui-atom-neighborhood-graph
type: task
title: Show an atom's immediate connections in the drawer, with a pop-out full-graph view
status: open
review: accepted
provenance:
  sourceRef: ni:///sha-256;msW1a0Wxsf9T3K6lDvGGsnJZzGRvIBk3bYmwXkevvRc
  conversationId: ui-atom-panel
  timestamp: 2026-11-21T02:25:00Z
  confidence: 0.8
createdAt: 2026-11-21T02:25:00Z
updatedAt: 2026-11-21T14:38:25Z
```
# Task: Show an atom's immediate connections in the drawer, with a pop-out full-graph view

Add a Connections frame at the bottom of the atom drawer
(`implementations/implementation-zero/app/view/app.js`). It lists every edge
that touches the atom, in both directions and across all edge kinds, not only
`decomposes`. Each row shows the edge kind, its direction, the neighbor's id,
type, status and review, and whether the edge itself is still proposed.
Clicking a neighbor pushes that neighbor's drawer onto the drawer's view stack,
the way a source view is pushed by [[task-ui-clickable-source-refs]]: with a
back button and the path it was opened from, so the human can return to the
atom they started from.

The Details tab also links each `[[id]]` reference in the entity's text
(mockup variant C). A reference whose id names an entity in the graph opens
that entity's drawer on the same stack; one whose id names no entity stays
plain text. Both entry points, a Connections row and an `[[id]]` link, use the
same stacked entity drawer, so `openDetail` gains a push mode next to its
current replace mode.

A pop-out control opens the whole konspekt graph in a larger view with zoom
and pan, with the current atom centered and highlighted. The current graph view
is a goal-scoped `decomposes` DAG drawn as a layered SVG with no zoom or pan.

The server needs a neighbors endpoint and an all-edges graph endpoint. The
neighbor lookup is the read that [[task-edge-traversal-layout]] addresses at the
storage level. The IntelliJ plugin copies this view at build time, so the
plugin needs a version bump to ship the change.

Success: from any atom, a human can see and move through its connections, both
its edges and the `[[id]]` references in its text, return along the path they
took, and pop out to a navigable view of the full graph.

Decomposes from [[goal-usability]].
