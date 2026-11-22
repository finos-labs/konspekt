```yaml
id: task-ni-references
type: task
title: Migrate references to ni:///sha-256 with store resolution
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-14T04:51:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;M9jv5uZziWsm9kFbLRRMDDMOfi5cgLRyCwgQ-8RaR08
  conversationId: source-uris
  timestamp: 2026-11-14T04:51:00Z
  confidence: 0.9
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: f61e6d61d0bd51214259cc517ffc43dc4a2f763a
    contentHash: f61e6d61d0bd51214259cc517ffc43dc4a2f763a
createdAt: 2026-11-14T04:51:00Z
updatedAt: 2026-11-22T15:31:00Z
```
# Task: Migrate references to ni:///sha-256 with store resolution

Implements [[investigation-source-uris]]. Kept separate from
[[task-sources-sha256-migration]], whose rename-and-overwrite plan predates the
in-place decision.

**Spec.** SERIALIZATION.md: `ni:` references, derived `contentHash`,
`sha-256/<hex>` layout, the `deprecated:` block with `migratedAt`,
`deprecated.md` maps, `locators` and `locators.allow`. New STORAGE.md: the
`store` / `resolve` rule in `project.md` and `getSource` / `getEntity` /
`getEdges` / `getLastCheckpoint`. RECONCILIATION.md: the verify probe
resolves through the store and hashes raw bytes. TRANSPORT.md: `resume` reads
through the store; `/.well-known/ni/` is recommended. `schema.ts` and
SPEC.md to match.

**Migration script.** Idempotent and in place: copy each `sources/` and
`commands/` file to `sha-256/<hex>.md`, move old refs under `deprecated:`,
rewrite table cells, write `deprecated.md`, run conformance.

**Tooling.** `lib/conformance.mjs`, `lib/validate.mjs`, `lib/views.mjs`,
`visual/build/snapshot.mjs`, the fleet committer's hash-to-filename mapping,
`init.mjs` and its templates.

**Success.** No provenance on existing data is lost: every old reference is
kept under `deprecated:` or in a `deprecated.md` map, and every old SHA-1 file
is kept. Existing tooling (conformance, validate, views, roadmap, binding audit,
the fleet, the UI clients) runs on a migrated instance without breaking.

Resolved 2026-11-22 on the human's `resolve`; evidence in ni:///sha-256;pTmcp6qNLK_BjliyphVhxkEG0QYVqVsAfYb9bp2FCoU.
