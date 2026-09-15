```yaml
id: task-konspekt-ui-app
type: task
title: Build the konspekt UI app as one view with two shells
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-14T16:00:00Z
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  conversationId: app-design-101
  timestamp: 2026-09-14T16:00:00Z
  confidence: 0.7
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Task: Build the konspekt UI app as one view with two shells

One HTML view over the instance, served two ways: by a local shell that owns its
own window (the konspekt UI app), and as a `ui://` resource rendered in a host
iframe. The view holds the goal picker, the open-task queue, status and review as
visual channels, and the authority verbs — the read-side tasks
([[task-goal-task-navigation]], [[task-visual-status-filters]]) and the write-side
task ([[task-task-workthrough-ui]]) are faces of this one application, not three.

The shells differ only in transport: in the local shell the view calls the
konspekt R/W API directly; in the iframe it calls tools through the host. Behind
a transport adapter, the disposition logic stays identical, which is the point —
if accept means something different in each surface there are two review
behaviours over one instance.

Phone width is a requirement of the view itself, not of one deployment, because
remote review happens in a phone browser.

Success: a human can move through a goal's open tasks and record dispositions
from either shell, with one view implementation and one set of semantics.
