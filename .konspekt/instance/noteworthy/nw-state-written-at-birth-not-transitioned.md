```yaml
id: nw-state-written-at-birth-not-transitioned
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;NOtuuWUcfOkMXoNrYjBxgemN4s8lkQ9QzhjiUGKrSx4
  timestamp: 2026-07-19T16:00:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 006ea804cbcf195e24ff31f75385b4fc931eaded
    contentHash: 006ea804cbcf195e24ff31f75385b4fc931eaded
createdAt: 2026-07-19T16:00:00Z
updatedAt: 2026-07-19T16:00:00Z
```
# Noteworthy: state is written at birth, not transitioned

Supersedes `nw-notify-events-are-creation-and-supersedes`, which reached the
right conclusion from a false premise.

The event set is unchanged: notify on **a new entity landing `review: accepted`**
and on **an entity acquiring an inbound `supersedes` edge**.

The corrected reasoning. The superseded atom claimed no instance contained any
of `resolved | refuted | lifted | abandoned`. That is false — `task-reconcile-schema`
and `task-serialization-format` are both `status: resolved`. The claim rested on
a sample that omitted this instance's own node files.

What is actually true is narrower and more useful: both resolved nodes carry
`createdAt == updatedAt` and bodies written retrospectively, so they were
*authored* resolved as after-the-fact records rather than moved from an earlier
state. No entity in either instance shows evidence of a status transition having
occurred. Status is a field set when an entity is written, not a value observed
to change — so a differ watching for transitions would fire on almost nothing,
while creation and supersedes cover what actually happens.

This does not mean the authority verbs are unused or unnecessary. It means the
durable record does not currently distinguish a verb-driven transition from a
birth state, which is a separate open question against `task-provenance-model`.
