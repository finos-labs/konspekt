```yaml
id: task-instance-layout-regularity
type: task
title: Decide whether instance/ directory layout should be regularized
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-07-19T16:10:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;NOtuuWUcfOkMXoNrYjBxgemN4s8lkQ9QzhjiUGKrSx4
  timestamp: 2026-07-19T16:10:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 006ea804cbcf195e24ff31f75385b4fc931eaded
    contentHash: 006ea804cbcf195e24ff31f75385b4fc931eaded
createdAt: 2026-07-19T16:10:00Z
updatedAt: 2026-07-19T16:10:00Z
```
# Task: Decide whether instance/ directory layout should be regularized

`instance/` mixes three kinds of directory: six entity-type directories, `edges/`
holding a single table file, and `sources/` holding provenance excerpts that are
explicitly *not* entities. `SERIALIZATION.md` already annotates the `sources/`
distinction, so the layout is documented rather than accidental — the open
question is whether documented-but-irregular is good enough for a second
implementer reading the tree cold.

Related and unresolved: **`node` is an overloaded term.** In konspekt it names
one of six `EntityRef.type` values — a unit of work with a status and a place in
the goal tree — not a graph vertex in general. Concepts and noteworthy items are
vertices but are not nodes, and must not move under `nodes/`, because the
directory supplies the entity type wherever a `type:id` prefix is absent. The
ambiguity has already caused at least one misread in working sessions. The cheap
fix is a naming note in `SPEC.md`; the expensive fix is renaming the type.

Blocked on nothing. Deliberately held apart from the pending schema
reconciliation (R1–R8), which is a data-model question, not a layout one. Note
that any layout change is a **breaking** change under `SERIALIZATION.md`
versioning and bumps the serialization to v2.
