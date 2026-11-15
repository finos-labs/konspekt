```yaml
id: nw-konspekt-conforms-code-tracer-drifts
kind: fact
review: accepted
provenance:
  sourceRef: ni:///sha-256;fXoV3y-dWcBv4coEKfGPpNJW-Vht7riUYVa6t1hZprA
  timestamp: 2026-07-19T18:00:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 38e0d13103a54d228fc8645be097c86bd3cf6320
    contentHash: 38e0d13103a54d228fc8645be097c86bd3cf6320
createdAt: 2026-07-19T18:00:00Z
updatedAt: 2026-07-19T18:00:00Z
```
# Noteworthy: konspekt conforms; code_tracer drifts; nothing enforces either

Supersedes `nw-schema-behind-practice`, whose title was the error. A complete
machine-parsed census of all 82 files in this instance reverses its conclusion.

**This instance conforms.** `status` appears on nodes (8 active, 9 resolved,
5 open) and on exactly the five noteworthy items whose `kind` defines a status
vocabulary — assumption/`unvalidated`, constraint/`active` — and nowhere else.
`kind` is present on 25/25 noteworthy, 11/11 waypoints, 12/12 artifacts.
All 11 waypoints carry the first-class `timestamp`. Artifacts are
`name`/`kind`/`location` pointers of 313–1048 bytes. Edge domain and range hold.
There is no cross-entity envelope: `type` and `title` appear on nodes only.

**code_tracer diverges**, and it is the only instance that does: a uniform
envelope on every type, `status: active` as generic liveness, `kind` dropped from
noteworthy and waypoints, artifacts holding 2.3–27KB inline documents, and
`notes` edges reversed in both endpoints and direction.

The earlier atom read one instance's local choices as "practice" and proposed
moving the spec to meet them. Seven of its eight reconciliation items are
withdrawn on this evidence; only the validator survives, strengthened — the
divergence is not a signal that the spec is stale but that conformance is
unenforced, which is precisely what makes "second independent implementer"
untestable.

**Two census findings not previously recorded.** Filename equals `id` for nodes
and waypoints but for no artifact, concept, or noteworthy — 48 files, tracked
separately as `nw-filename-id-rule-conflict`. And only 26 of 81 entities carry
`sourceRef` + `contentHash`; the remainder predate the mechanism and hold
`conversationId` plus a timestamp, so a reference-only notification payload has
no source excerpt to link for roughly two-thirds of the graph.

`review: accepted` holds on all 82 files. No entity in this instance has ever
been serialized as `proposed` or `rejected`.
