```yaml
id: wp-adr-ui-accept-action
kind: decision
subtype: adr
timestamp: 2026-09-20T18:00:00Z
review: proposed
provenance:
  sourceRef: 8ba9d7285e3780034133f597e92d53bb89e98acf
  contentHash: 8ba9d7285e3780034133f597e92d53bb89e98acf
  timestamp: 2026-09-20T18:00:00Z
  conversationId: ui-simple-actions
  confidence: 0.8
createdAt: 2026-09-20T18:00:00Z
updatedAt: 2026-09-20T18:00:00Z
```
# Waypoint: Accept a proposed entity from the UI (POST /api/accept)

The UI's first write action is **accept**. The drawer shows an Accept control on
any `proposed` entity; clicking it (after a confirm) POSTs `/api/accept?entity=<id>`.
The server flips that entity's `review:` line to `accepted` in the working tree,
then **two-way auto-accepts** every proposed edge touching the entity whose other
endpoint is also accepted — the same disposition a human does by hand. The
file-watcher then refreshes every view.

Decisions:
- **Accept only** for now (no reject/abandon/status change yet).
- **Two-way edge auto-accept**: an edge flips when both its endpoints are accepted;
  edges to still-proposed endpoints stay proposed.
- **Working-tree only**: no git commit from the UI; the human commits separately.
- **Both surfaces**: implemented in the implementation-zero server and the plugin
  `ViewServer` over the one shared view (POST only; GET returns 405), so behavior
  does not fork ([[concept-view-no-fork]]).

Forced by [[concept-ui-human-disposition]]; consequences are the `/api/accept`
endpoint in both shells, the drawer Accept control, and the `review` field added to
`/api/entity`. Marks [[task-ui-simple-actions]].
