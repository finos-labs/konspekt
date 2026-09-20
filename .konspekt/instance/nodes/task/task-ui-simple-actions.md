```yaml
id: task-ui-simple-actions
type: task
title: Take simple actions from the UI (accept a proposed entity)
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-20T18:00:00Z
review: proposed
provenance:
  sourceRef: 8ba9d7285e3780034133f597e92d53bb89e98acf
  contentHash: 8ba9d7285e3780034133f597e92d53bb89e98acf
  conversationId: ui-simple-actions
  timestamp: 2026-09-20T18:00:00Z
  confidence: 0.7
createdAt: 2026-09-20T18:00:00Z
updatedAt: 2026-09-20T18:00:00Z
```
# Task: Take simple actions from the UI (accept a proposed entity)

Make the local UI able to take a bounded action, starting with **accept**: a human
flips a proposed entity to accepted from the drawer, and connected edges
auto-accept two-way. Writes touch the working tree only.

Implemented: `POST /api/accept` in both the implementation-zero server and the
plugin `ViewServer`; an Accept control in the shared drawer shown only while an
entity is `proposed`; `review` added to `/api/entity`. Governed by
[[concept-ui-human-disposition]] and applied by [[wp-adr-ui-accept-action]];
consistent with [[concept-propose-accept-separation]] and the one-view ASR
([[concept-view-no-fork]]).

Success: from either surface, clicking Accept on a proposed entity flips it (and
its now-both-accepted edges) to accepted, and the view refreshes. Later actions
(reject, status change) are out of scope here.
