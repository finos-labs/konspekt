```yaml
id: concept-asr-lossless-provenance-migration
subtype: asr
label: Changing the addressing scheme must lose no provenance and break no existing tooling
aliases: [lossless addressing migration, additive re-addressing]
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
# Concept: Changing the addressing scheme must lose no provenance and break no existing tooling

A change to how content is addressed must keep every existing reference
recoverable and every existing stored file in place, and the existing tools
(conformance, validate, views, roadmap, binding audit, the fleet, the UI
clients) must keep running on a migrated instance. Content-addressed
directories are append-only, so a migration may add files and references but
not rename or remove them.

This is architecturally significant because the instance's provenance is its
audit record: a migration that renamed files or overwrote references would
break every citation made before it, in this repository and in adopter copies
migrated later. Its consequences are carried by the `drives` edge to
[[wp-adr-in-place-ni-migration]].

This requirement is recorded after the decisions it drives, from the
discussion in [[investigation-source-uris]]; it states the force those
decisions answered rather than a requirement written before them.
