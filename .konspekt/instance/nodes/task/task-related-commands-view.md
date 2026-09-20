```yaml
id: task-related-commands-view
type: task
title: Related-commands tab in the entity detail panel
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
# Task: Related-commands tab in the entity detail panel

Make the entity detail drawer a three-tab panel: (1) the entity's file, (2) its
provenance source, and (3) — when present — its **related commands**: the rows of
`commands/executed.md` whose `entity` is this entity, in execution order, each
resolving to the verbatim `commands/<hash>.md`. The third tab appears only when
the entity has commands ([[concept-surface-follows-data]]).

Reuses the shared view across surfaces ([[concept-view-no-fork]]) and consumes the
executed-command log ([[task-executed-provenance-serialization]]). Needs a new
read endpoint over the log filtered by entity.

Success: opening any entity shows its file and provenance; an entity with recorded
commands also shows them, ordered, in a third tab — in both shells.
