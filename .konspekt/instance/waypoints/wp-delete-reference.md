```yaml
id: wp-delete-reference
kind: pivot
timestamp: 2026-06-22T21:00:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;0t33jwyAlbxf0YBCjCsKmh_PnkwV23IPchbVmo110dk
  timestamp: 2026-06-22T21:00:00Z
  conversationId: setup-and-operating-loop
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: bd8a2f4f0cff7b2666ce17c85a5c337375cd12f7
    contentHash: bd8a2f4f0cff7b2666ce17c85a5c337375cd12f7
createdAt: 2026-06-22T21:00:00Z
updatedAt: 2026-06-22T21:00:00Z
```
# Waypoint: Deleted reference/; triggers collapse into propose-accept

Removed the `reference/` directory as speculative scaffolding. The "triggers"
question dissolved: when a durable write happens is just propose-accept — the
machine ventures a proposal, a human command is the write — so there was no
separate trigger category needing a home, and `reference/`'s only would-be tenant
(a not-yet-written tool) didn't justify an empty folder claiming concepts.
`sync` / `persist` stay in the spec as aliases for the future verb-API. The
conformance target is now `spec/` + the dogfooded instance + the manual-reupload
probe.

**marks** investigation-repo-structure, investigation-operating-loop.
