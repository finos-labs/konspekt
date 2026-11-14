```yaml
id: task-ni-test-migration
type: task
title: Test the ni: migration on the task-ni-references branch
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-14T14:45:53Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;H2qKGqx9n9X0JVpe08PQXrnG3RB9mksx9eaw9zn8ucQ
  conversationId: source-uris
  timestamp: 2026-11-14T14:45:53Z
  confidence: 0.85
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: a125b5a624c8072d4f7c41de493c38ddf2d794e7
    contentHash: a125b5a624c8072d4f7c41de493c38ddf2d794e7
createdAt: 2026-11-14T14:45:53Z
updatedAt: 2026-11-14T18:46:20Z
```
# Task: Test the ni: migration on the task-ni-references branch

Run the in-place migration from [[investigation-source-uris]] against this
repository's own instance on the `task-ni-references` branch, before anything
reaches `main`.

The sequence: the front-matter parsers read the migrated shape (done in
`bd177f9`); the fleet's proposal ids and source hashing move to `ni:`;
`tools/migrate-ni.mjs` is written and run; conformance, validate, the binding
audit, the roadmap and poster freshness gates, and the core, fleet and
implementation-zero test suites run against the migrated instance; the
migration runs a second time to confirm it changes nothing.

Success is the criterion of [[task-ni-references]] observed on the branch: no
provenance on existing data lost, every old reference present under
`deprecated:` or in a `deprecated.md` map, every old SHA-1 file still in
place, and every listed tool and suite passing on the migrated instance.
