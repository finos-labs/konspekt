```yaml
id: task-view-wrap-long-paths
type: task
title: Wrap long source and command paths in the shared view
status: open
review: accepted
provenance:
  sourceRef: ni:///sha-256;rvHkVkDkRlciuOxg0motWmMvFeidffnoTBsnKStigy0
  conversationId: linkedin-ni-references
  timestamp: 2026-11-15T17:24:22Z
  confidence: 0.8
createdAt: 2026-11-15T17:24:22Z
updatedAt: 2026-11-15T17:25:32Z
```
# Task: Wrap long source and command paths in the shared view

The Provenance tab labels an excerpt with its path and reference, for example
`sources/sha-256/<64 hex>.md  (ni:///sha-256;<43 base64url>)`. The label
(`.src-label` in `implementations/implementation-zero/app/view/app.css`)
has no wrap rule, and a hex path has no characters where the browser can
break the line, so a narrow pane cuts off the end of the path. The re-captured
`docs/visuals/how-to/ui_provenance.png` shows this in the IntelliJ plugin: the
path ends at `…DCFE8BC`. The Commands pane labels use the same class.

Let the label break anywhere (for example `overflow-wrap: anywhere`, as
`.chg-files li` already does with `word-break: break-all`). The plugin copies
this view at build time, so one change fixes both the standalone UI and the
plugin; the plugin then needs a version bump to ship it.

Decomposes [[task-ni-references]].
