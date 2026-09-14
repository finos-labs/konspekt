```yaml
id: nw-card-v1-is-last-ten-changed
kind: decision
review: proposed
provenance:
  sourceRef: 34c923658f7544ebe55d2ca521a3b0d02a33134e
  contentHash: 34c923658f7544ebe55d2ca521a3b0d02a33134e
  timestamp: 2026-09-14T17:00:00Z
  conversationId: app-design-101
createdAt: 2026-09-14T17:00:00Z
updatedAt: 2026-09-14T17:30:00Z
```
# Noteworthy: The first card is ten rows, read-only

The embedded card starts as a small table of the ten most recently changed
entities — entity id, state, timestamp — and nothing more. Read-only: it shows
what moved and takes no disposition, so no write leaves the card and the text
fallback and the rendered card cannot diverge in behaviour.

Entity is the right noun here, not node: `nodes/` holds only goals,
investigations and tasks, while a change feed has to carry concepts, noteworthy
items, artifacts and waypoints too. "Atom" is used informally throughout the
spec but names no schema construct; "entity" is the term the serialization and
reconciliation documents use.

Configurable contents and the one-hop sub-graph around changed entities remain
the intended direction, along with how far that hop extends for a large
changeset; both are deferred rather than dropped.

This is a presentation decision with no effect on the architecture. The tool
call, the `ui://` resource, the transport and the store are unchanged by it,
which is why it can be narrowed now and widened later without rework.
