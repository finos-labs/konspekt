```yaml
id: wp-links-edge-kind
kind: decision
timestamp: 2026-09-12T14:30:00Z
review: proposed
provenance:
  sourceRef: 1c521cd2996ebec25d03424a298bf146305e2c58
  contentHash: 1c521cd2996ebec25d03424a298bf146305e2c58
  timestamp: 2026-09-12T14:30:00Z
  confidence: 0.9
createdAt: 2026-09-12T14:30:00Z
updatedAt: 2026-09-12T14:30:00Z
```
# Waypoint: Add a generic node-to-node `links` edge kind

Give core one generic associative edge between nodes — kind `links`, `node ->
node`, untyped, symmetric in meaning but stored directed, with an optional
`weight`. It is the node-level counterpart to concept `relates`, which stays
concept-to-concept. The generic link is deliberately scoped to `node -> node`
rather than `entity -> entity`: a link that accepted any type would compete with
the typed cross-type edges (`mentions`, `produces`, `notes`) and erode that
vocabulary, so the node-only boundary protects the typed edges the way JIRA's
issue-only linking does. Relationship *typing* of node links (`blocks`,
`depends-on`, `duplicates`, …) is left to persona layers, so core stays
domain-agnostic and carries no named link type.

The forcing observation was 26 `edge-domain-range` conformance warnings: the
roadmap changeset (`6d98b03`) had expressed 13 node-to-node associations as
concept `relates`, which the model had no home for. Consequences: the `links`
kind in `spec/data-model/schema.ts` and `SPEC.md`, its domain/range and
weight rules in `lib/conformance.mjs`, the retag of those 13 edges (now
`e-link-*`), a rendered dashed arc in `visual/`, and the scaffolder template.
This waypoint sits on `task-serialization-format`.
