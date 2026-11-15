```yaml
id: concept-asr-persona-layering
subtype: asr
label: Persona-agnostic core with extension layers
aliases: [core stays persona-agnostic, personas extend core, layered spec architecture]
review: accepted
provenance:
  sourceRef: ni:///sha-256;KoNRSFRexdV9DhXWAA7C435u2No1VgpuOJ3bt_sY9Mw
  timestamp: 2026-08-01T21:30:00Z
  confidence: 0.9
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 7c50ca7a05678b5e4e0211bf398533f33ff9eeea
    contentHash: 7c50ca7a05678b5e4e0211bf398533f33ff9eeea
createdAt: 2026-08-01T21:30:00Z
updatedAt: 2026-08-01T21:30:00Z
```
# Concept: Persona-agnostic core with extension layers

konspekt separates a persona-agnostic core from persona extension layers. The
core (`spec/data-model/`, `spec/architecture/`) defines the entity set, the
single typed edge table, provenance, review, and the serialization every
instance shares, and names no working role. A **persona layer** extends that
core with its own vocabulary — subtypes, edge kinds, and content-addressed
provenance channels — through generic hooks (an optional `subtype`
discriminator, provenance-ref edge endpoints, and a `personas` activation
list) rather than by mutating core enums. An instance that activates no layer
is unaffected; a non-activating instance never sees a layer's vocabulary.

This is architecturally significant because it is the constraint every later
persona decision answers to: it fixes *where* new vocabulary may live (in a
layer, never in core) and *how* the neutral conformance checker stays neutral
(it merges a supplied layer registry and hard-codes no layer value). Its
significance is carried by the `drives` edge to the ADR that introduces the
first such layer, not by any stored flag.
