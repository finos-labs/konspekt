```yaml
id: nw-schema-behind-practice
kind: fact
review: accepted
provenance:
  sourceRef: ni:///sha-256;jP89OKyOY1aDWLN50poVvAREdWHc6ccXM4sWOn5tup0
  timestamp: 2026-07-19T15:15:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 05f79ce4a294a4a0251a6feef26b5a1d287ea16e
    contentHash: 05f79ce4a294a4a0251a6feef26b5a1d287ea16e
createdAt: 2026-07-19T15:15:00Z
updatedAt: 2026-07-19T15:15:00Z
```
# Noteworthy: schema.ts is behind practice, and nothing checks

A diff of `spec/data-model/schema.ts` against the `code_tracer` instance — the
first real usage of konspekt outside its own repo — found divergence on four
entity types and four edge kinds, produced by one author with one maintainer LLM
inside one month.

Where practice is ahead: every entity file converged on a uniform envelope
(`id, type, title, status, review, summary, provenance, createdAt, updatedAt`)
that the schema does not define — `Summary` is specced only for `GraphNode` and
`Project`, `title` and `status` are scattered per-entity. Practice also dropped
`Waypoint.timestamp` as a duplicate of `provenance.timestamp`, and made Artifact
content-bearing rather than a `name`/`location`/`version` pointer.

Where practice drifted: `status: active` became a generic liveness flag on all
four entity types, materializing as a stored field what the spec already derives
(*current items = entities with no inbound supersedes edge*) — the store-once
violation Principle 1 exists to prevent. `kind` disappeared from Noteworthy and
Waypoint entirely, surviving only as title prose, while NodeType was promoted to
a subdirectory. Edge domain/range no longer holds: `notes` reversed direction and
both endpoints in every occurrence.

The divergence is `code_tracer`'s; konspekt's own instance still matches spec.
The lesson is not that either instance is wrong but that no validator exists, so
conformance is unenforced and "second independent implementer" is untestable as
a milestone.
