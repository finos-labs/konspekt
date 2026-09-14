```yaml
id: task-atom-vocabulary
type: task
title: Settle "atom" in the vocabulary
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-14T17:45:00Z
review: proposed
provenance:
  sourceRef: de0d9f28163201c628544e1982b1184588da2ec8
  contentHash: de0d9f28163201c628544e1982b1184588da2ec8
  conversationId: app-design-101
  timestamp: 2026-09-14T17:45:00Z
  confidence: 0.7
createdAt: 2026-09-14T17:45:00Z
updatedAt: 2026-09-14T17:45:00Z
```
# Task: Settle "atom" in the vocabulary

"Atom" runs through the spec as a working word — a proposed atom carrying
confidence, an extracted atom classified as new, duplicate, update or conflict,
a summarized excerpt being an atom in disguise — while naming no schema
construct. "Entity" is the term the serialization and reconciliation documents
use when they mean something the schema defines.

Three ways out: define atom formally as the umbrella over every addressable
kind (`node:`, `concept:`, `noteworthy:`, `artifact:`, `waypoint:`), retire it
in favour of entity, or leave it explicitly informal and say so once.

This sits under usability because vocabulary is the first thing an adopter
meets. Two words for one idea, neither defined, costs a newcomer more than it
costs anyone already fluent. It also sits next to the naming question already
flagged between `RECONCILIATION.md` and `SCHEMA-RECONCILIATION.md`, and the two
are best resolved in one pass rather than separately.

Note that "per-atom" as used for compare-and-swap granularity describes a scope
rather than a type, and may survive whichever way this lands.

Success: one decision, applied across the spec, with the losing word either
defined or absent.
