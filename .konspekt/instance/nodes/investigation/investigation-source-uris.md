```yaml
id: investigation-source-uris
type: investigation
title: Source URIs alongside content hashes
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-14T00:08:05Z
review: accepted
provenance:
  sourceRef: 79351f57f62b5883e4590949d7c1a1061dde8bd8
  contentHash: 79351f57f62b5883e4590949d7c1a1061dde8bd8
  conversationId: source-uris
  timestamp: 2026-11-14T00:08:05Z
  confidence: 0.9
createdAt: 2026-11-14T00:08:05Z
updatedAt: 2026-11-14T00:08:05Z
```
# Investigation: Source URIs alongside content hashes

Started from adding URIs next to content hashes. Two separate questions came
out of it: where an excerpt came from (origin), and how to reach the stored
excerpt in whatever backend holds the instance (store resolution). Today the
second is implicit in the git layout (`sources/<gitBlobSHA>.md`), so with a
MongoDB or Postgres store it would be undocumented knowledge.

## Decided

- **Origin locators are optional.** A list of `uri`, `kind`
  (git-permalink | conversation | chat | web) and `retrievedAt`, never part of
  the hash input. `project.md` declares `locators.allow` (permitted hosts),
  checked by conformance. `validate` warns, and does not error, when a locator
  is unreachable.
- **Store resolution is mandatory per instance.** `project.md` declares the
  store kind and a `resolve` rule covering sources, commands, entities, edges
  and checkpoints. For git, the entity template's `{path}` follows the
  SERIALIZATION layout. Atoms never hold store URLs.
- **References use RFC 6920.** `ni:///sha-256;<base64url>`, no authority,
  SHA-256 over the raw excerpt bytes (no git blob header), so the address does
  not depend on git or on SHA-1. `contentHash` is derived from the reference.
  Channel refs keep their prefix: `command:ni:///sha-256;<digest>`.
- **Files use hex names.** `sources/sha-256/<hex>.md` and
  `commands/sha-256/<hex>.md`, so `sha256sum` output matches the file name;
  the spec defines the hex/base64url conversion.
- **Read path.** Serving `/.well-known/ni/sha-256/<digest>` is recommended;
  the `project.md` rule is the baseline.
- **In-place migration.** New references are written next to old ones. In
  entity files the old `sourceRef` / `contentHash` move under
  `provenance.deprecated` with a `migratedAt` timestamp, and `updatedAt` is
  unchanged. Table cells take the new reference, and one `deprecated.md` per
  content-addressed directory maps old to new
  (`| deprecated | current | migratedAt |`). Old files stay, so the directories
  stay append-only and the change is additive (serialization v1).
- **Conformance follows migration.** Once a repository is migrated, conformance
  checks only the new form.
- **Adopters deferred.** cdm-collateral and code_tracer migrate later.

SWHID was considered for interoperability and dropped: SWHID v1 is SHA-1 only,
v2 is not final, and no existing reference uses it.
