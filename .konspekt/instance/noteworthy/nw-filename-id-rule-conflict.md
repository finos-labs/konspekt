```yaml
id: nw-filename-id-rule-conflict
kind: fact
review: accepted
provenance:
  sourceRef: ni:///sha-256;fXoV3y-dWcBv4coEKfGPpNJW-Vht7riUYVa6t1hZprA
  timestamp: 2026-07-19T18:15:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 38e0d13103a54d228fc8645be097c86bd3cf6320
    contentHash: 38e0d13103a54d228fc8645be097c86bd3cf6320
createdAt: 2026-07-19T18:15:00Z
updatedAt: 2026-07-19T18:15:00Z
```
# Noteworthy: the filename-equals-id rule is violated by 48 of 82 files

`SERIALIZATION.md` states that `id` is kebab-case, globally unique, and equals
the filename without `.md`. In this instance that holds for all 22 nodes and all
11 waypoints, and for none of the 12 artifacts, 11 concepts, or 25 noteworthy
items. The violating directories keep the type prefix in the `id` and strip it
from the filename: `noteworthy/timestamp-source-time.md` holds
`id: nw-timestamp-source-time`; `artifacts/spec.md` holds `id: artifact-spec`;
`concepts/two-pillars.md` holds `id: concept-two-pillars`.

Both sides have a case. The rule makes a file self-identifying, which matters for
the manual re-upload path where a file arrives with no directory context. The
practice avoids stuttering paths (`noteworthy/nw-…`) and keeps the prefix
available in edge refs, where `type:id` already carries the type.

Unresolved deliberately. Whichever way it goes, one side is a mechanical
migration: 48 renames, or 48 front-matter edits plus every `type:id` reference in
`edges.md`. Note that renaming is a breaking layout change under
`SERIALIZATION.md` versioning.

Until it is decided, new entities follow the existing per-directory convention
rather than the written rule, so that no third pattern is introduced. The five
entities added on 2026-07-19 follow the prefix-stripped convention on that basis.
