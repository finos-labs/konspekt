```yaml
id: concept-two-pillars
label: Two pillars of the standard
aliases: [model plus verbs, standard is model and verbs, binding constraint vs vocabulary]
review: proposed
provenance:
  sourceRef: ni:///sha-256;jvdREM-JHaheN2YbR9-RcBJ9vCCyssWcRI5rnoMBIpM
  timestamp: 2026-06-27T13:42:26Z
  confidence: 0.8
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 37f457f9f4cd3a186c5547f32e0046867a91d2e9
    contentHash: 37f457f9f4cd3a186c5547f32e0046867a91d2e9
createdAt: 2026-06-27T13:42:26Z
updatedAt: 2026-11-15T00:41:12Z
```
# Concept: Two pillars of the standard

The konspekt standard is two things, both in `spec/data-model/`: a **model** — a
typed knowledge graph of a project (a typed `GraphNode` plus `Concept`,
`Noteworthy`, `Artifact`, `Waypoint`; one typed edge table; inventories as
queries over edges, never stored lists) — and a **verb set**, the authority
vocabulary a human issues over that graph (`pin`, `validate`, `refute`,
`resolve`, `abandon`, `lift`), conventions over generic constructs, never
chokepoints.

Everything else is an *implementation constraint* on a conformant binding, not
vocabulary: serialization, transport, reconciliation, and the content-addressing
scheme. The model still *requires* auditability — every entity carries
provenance and a `proposed → accepted` review state (SPEC Principle 3) — but
*how* a binding makes provenance verifiable (this repo: SHA-256 over the
verbatim source, cited as an `ni:///sha-256` reference) is the binding's
concern, in `spec/architecture/`. So
"provenance is an implementation constraint" is true of the mechanism, not of
the requirement.
