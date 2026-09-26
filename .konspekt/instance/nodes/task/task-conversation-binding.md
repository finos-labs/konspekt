```yaml
id: task-conversation-binding
type: task
title: Bind every conversation to a graph entity
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-26T18:16:00Z
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.7
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Task: Bind every conversation to a graph entity

In a konspekt-enabled project, a conversation must resolve to a graph entity
while it is live, not be captured from outside after the fact. This inverts the
current default, where nothing binds a conversation to the graph as it happens,
so the default outcome is no capture (`nw-no-artifacts-captured`).

Realizes `concept-provenance-completeness` (invariant V) across three surfaces,
split by whether each is portable standard or host policy:

- **Spec (portable):** the completeness invariant, added as a first-class
  architecture doc (`BINDING.md`) and referenced from `REVIEW.md`; the
  `binding` field defined in the data model. Enforced at extraction, framed as
  referential integrity -- see `task-binding-invariant-spec`.
- **Behavior (host policy):** the maintainer asks at conversation open which
  entity to bind to (existing id, or new entity of a stated type; `investigation`
  is the exploratory default), and proposes an active-entity switch when the
  topic moves; the human confirms. Lives in `.konspekt/OPERATING.md` -- see
  `task-binding-operating-behavior`.

Design decisions recorded as the five `nw-binding-*` noteworthy items. Marks
`wp-conversation-binding`. Decomposes from `investigation-operating-loop` (the
behavior) and `goal-accountability` (provenance completeness serves the audit
record).
