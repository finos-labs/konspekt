```yaml
id: task-ui-resolve-action
type: task
title: Resolve a work node from the UI (POST /api/resolve)
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-26T15:00:00Z
review: proposed
provenance:
  sourceRef: 44b51f8e3a332bf62e25beedafc51b8b21e8ce7b
  contentHash: 44b51f8e3a332bf62e25beedafc51b8b21e8ce7b
  conversationId: ui-resolve-action
  timestamp: 2026-09-26T15:00:00Z
  confidence: 0.8
createdAt: 2026-09-26T15:00:00Z
updatedAt: 2026-09-26T15:00:00Z
```
# Task: Resolve a work node from the UI (POST /api/resolve)

The UI's second write action, after accept ([[task-ui-simple-actions]]): the
`resolve` authority verb. The drawer shows a Resolve control on a work node whose
status is `open` or `active`; clicking it (after an inline confirm) POSTs
`/api/resolve?entity=<id>`. The server flips the node's `status:` to `resolved` in
the working tree. Because a human authority verb carries its own acceptance, a
still-`proposed` node is also flipped `review: accepted` in the same step, with the
two-way edge auto-accept reused from [[wp-adr-ui-accept-action]]; an already-
accepted node is a status flip only. Nodes only; idempotent; working-tree only, no
git commit.

A slice of [[task-task-workthrough-ui]] (working through and dispositioning tasks
with the authority verbs in the interface), applied by [[wp-adr-ui-resolve-action]]
and governed by [[concept-ui-human-disposition]]; consistent with the one-view ASR
([[concept-view-no-fork]]) and with propose→accept ([[concept-propose-accept-separation]]).

Success: from either shell, Resolve on an open/active node sets `status: resolved`
(accepting a proposed node in the same step), and the view refreshes. Verified
end-to-end ([[nw-ui-resolve-verified]]).
