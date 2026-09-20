```yaml
id: task-asr-adr-ui
type: task
title: An ASR/ADR view in the konspekt UI
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-20T15:00:00Z
review: proposed
provenance:
  sourceRef: 3e40ecbee32fff105151a8d772969f2f84f4c8ef
  contentHash: 3e40ecbee32fff105151a8d772969f2f84f4c8ef
  conversationId: engineer-executed-provenance
  timestamp: 2026-09-20T15:00:00Z
  confidence: 0.7
createdAt: 2026-09-20T15:00:00Z
updatedAt: 2026-09-20T15:00:00Z
```
# Task: An ASR/ADR view in the konspekt UI

A UI space for architecture decisions in the shared view ([[task-konspekt-ui-app]]):
a tab listing the ASRs (concepts with `subtype: asr`); selecting an ASR shows the
ADRs it drives (waypoints with `subtype: adr`, via `drives` edges); rows for both
open the standard detail + provenance drawer.

The tab is **visible only when the instance actually contains ASRs or ADRs**,
gated by that data presence rather than by the `engineer` persona flag — the flag
can flip on and off, while the presence of decisions to show is the true signal
of relevance ([[concept-surface-follows-data]]). One view across surfaces, so the
tab renders identically in `implementation-zero` and the IntelliJ plugin
([[concept-view-no-fork]]).

Success: with ASRs/ADRs present, the tab lists ASRs and, per ASR, its driven
ADRs; with none present, the tab is absent; the detail/provenance drawer works
for both — in both shells.
