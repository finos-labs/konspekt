```yaml
id: wp-adr-ui-resolve-action
kind: decision
subtype: adr
timestamp: 2026-09-26T15:00:00Z
review: accepted
provenance:
  sourceRef: 44b51f8e3a332bf62e25beedafc51b8b21e8ce7b
  contentHash: 44b51f8e3a332bf62e25beedafc51b8b21e8ce7b
  timestamp: 2026-09-26T15:00:00Z
  conversationId: ui-resolve-action
  confidence: 0.8
createdAt: 2026-09-26T15:00:00Z
updatedAt: 2026-09-26T15:00:00Z
```
# Waypoint: Resolve a work node from the UI (POST /api/resolve)

The UI's second write action is **resolve**, the first authority verb after accept
([[wp-adr-ui-accept-action]]). The drawer shows a Resolve control on a work node
whose status is `open` or `active`; clicking it (after an inline confirm) POSTs
`/api/resolve?entity=<id>`, and the server sets that node's `status:` to `resolved`
in the working tree.

Decisions:
- **The verb carries acceptance**: a human authority verb lands `review: accepted`
  (spec/data-model authority verbs), so a still-`proposed` node is flipped
  `review: accepted` in the same step, reusing the two-way edge auto-accept; an
  already-accepted node is a status flip only.
- **Nodes only**: `resolve` applies to work nodes (goal/investigation/experiment/
  topic/task/note); a non-node is refused. Idempotent — resolving a resolved node
  is a no-op success; an abandoned node is refused.
- **Working-tree only**: no git commit from the UI; the human commits separately.
- **Both surfaces**: implemented in the implementation-zero server and the plugin
  `ViewServer` over the one shared view (POST only; GET returns 405), so behavior
  does not fork ([[concept-view-no-fork]]).

Forced by [[concept-ui-human-disposition]]; consequences are the `/api/resolve`
endpoint in both shells, the drawer Resolve control, and `status` / `entityType`
added to `/api/entity`. Marks [[task-ui-resolve-action]].
