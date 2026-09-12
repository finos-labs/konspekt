```yaml
id: artifact-visual-explorer
name: Visual context explorer
kind: code
location: visual/
review: accepted
provenance:
  sourceRef: edb20fa06fbb6ca03cf4fc84b0a3dbe19b3b9b89
  contentHash: edb20fa06fbb6ca03cf4fc84b0a3dbe19b3b9b89
  conversationId: roadmap-plan
  timestamp: 2026-09-11T19:00:00Z
  confidence: 0.8
createdAt: 2026-09-11T19:00:00Z
updatedAt: 2026-09-11T19:00:00Z
```
# Artifact: Visual context explorer

The read-only context explorer under `visual/`. It renders the `decomposes` DAG
(goals top, tasks bottom) as a collapsible tree using Cytoscape.js + dagre; click
a node to expand its `decomposes` children and its `mentions` / `notes` /
`produces` satellites, and to read its Markdown body. Snapshot-based: a build
step (`visual/build/snapshot.mjs`) bakes `visual/data/snapshot.js` from the
instance, and the page loads that; it never writes. Status, review, supersession,
and time are not yet encoded as visual channels. v1.

This artifact predates the content-addressed provenance mechanism; it is recorded
now as the starting point for [[goal-usability]], which decomposes into
[[task-visual-status-filters]], [[task-goal-task-navigation]], and
[[task-task-workthrough-ui]].
