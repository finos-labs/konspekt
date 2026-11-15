```yaml
id: nw-rename-fires-as-creation
kind: fact
review: accepted
provenance:
  sourceRef: ni:///sha-256;bDogKu_Wwlz6kW-Wc-CIBK1eHaw56iPTKh7d17gDQ8U
  timestamp: 2026-07-19T19:50:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 08ea702eb99991e21726573b73dc5fcf284e60b8
    contentHash: 08ea702eb99991e21726573b73dc5fcf284e60b8
createdAt: 2026-07-19T19:50:00Z
updatedAt: 2026-07-19T19:50:00Z
```
# Noteworthy: a rename is indistinguishable from creation to a path differ

`nw-notify-events-are-creation-and-supersedes` defines a notifiable creation as
a new entity file appearing with `review: accepted`. A rename performed as
create-then-delete satisfies that definition exactly, so the filename-equals-id
migration would have fired roughly 50 spurious "new entity" notifications for
files whose content never changed.

The gap is in the event definition, not the migration. Path is the wrong
identity: the durable identity of an entity is its `id`, which is carried in
front-matter and did not move. A differ that keys on path sees a delete and an
add; a differ that keys on `id` sees nothing, correctly.

Consequence for the notifier: creation must be defined as *an `id` not present
in the parent commit*, not as *a path not present in the parent commit*. That
requires parsing front-matter of added files rather than reading the path list —
cheap, and it also makes the notifier robust to any future layout change, which
a path-keyed differ would report as a wholesale replacement of the instance.

Found by dogfooding: the migration was executed through the same GitHub
interface a watcher would read, which is the only reason the failure mode was
visible before a notifier existed to suffer it.
