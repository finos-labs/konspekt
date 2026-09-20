```yaml
id: task-plugin-pop-mode
type: task
title: Configurable popup mode for the IntelliJ plugin
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-20T15:00:00Z
review: accepted
provenance:
  sourceRef: 3e40ecbee32fff105151a8d772969f2f84f4c8ef
  contentHash: 3e40ecbee32fff105151a8d772969f2f84f4c8ef
  conversationId: engineer-executed-provenance
  timestamp: 2026-09-20T15:00:00Z
  confidence: 0.6
createdAt: 2026-09-20T15:00:00Z
updatedAt: 2026-09-20T15:00:00Z
```
# Task: Configurable popup mode for the IntelliJ plugin

Experiment with rendering the plugin's view in a **popup / floating window**
instead of the docked tool window ([[task-intellij-plugin]]), and make the choice
configurable (tool window vs popup). The same JCEF-hosted shared view either way
([[concept-view-no-fork]]); only the host frame changes — closer to
`implementation-zero`'s always-on-top window.

Open for the experiment: which IntelliJ surface hosts the popup (a `JBPopup`, a
detached frame, or the tool window's own float action), whether it stays on top,
and how the setting is stored. Confidence is low because it is exploratory.

Success: a setting switches the plugin between the docked tool window and a
floating popup, both rendering the shared view.
