```yaml
id: wp-adr-in-place-ni-migration
kind: decision
subtype: adr
timestamp: 2026-11-14T19:30:00Z
review: proposed
provenance:
  sourceRef: ni:///sha-256;idqFoT14UBvBzfEOpS8AD5WPfA1E5Q2PaYK3Vo7RxO4
  conversationId: source-uris
  timestamp: 2026-11-14T19:30:00Z
  confidence: 0.8
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 79351f57f62b5883e4590949d7c1a1061dde8bd8
    contentHash: 79351f57f62b5883e4590949d7c1a1061dde8bd8
createdAt: 2026-11-14T19:30:00Z
updatedAt: 2026-11-14T19:30:00Z
```
# Waypoint: Existing references migrate to ni: in place, keeping the old ones

Existing data is migrated by adding new references next to the old ones.
In an entity file the `ni:` reference goes into `sourceRef`, and the old
`sourceRef` and `contentHash` move under `provenance.deprecated` with a
`migratedAt` timestamp; `updatedAt` is unchanged. Table cells take the new
reference, and each content-addressed directory gets a `deprecated.md` table
`| deprecated | current | migratedAt |`. Each stored file is copied to its
`sha-256/<hex>.md` name and the SHA-1 file is kept, so the directories stay
append-only and the instance stays at serialization v1. A script performs the
migration idempotently and runs conformance at the end. Once an instance is
migrated, conformance checks only the new form.

This replaces the rename-and-overwrite plan in
[[task-sources-sha256-migration]]. Consequences: `tools/migrate-ni.mjs`, tested
on this repository's instance by [[task-ni-test-migration]]; the adopter
repositories migrate later.
