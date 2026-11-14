```yaml
id: concept-asr-hash-independent-identity
subtype: asr
label: Content identity must not depend on git's object format or on SHA-1
aliases: [git-independent content identity, algorithm-named content address]
review: accepted
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
updatedAt: 2026-11-14T19:43:57Z
```
# Concept: Content identity must not depend on git's object format or on SHA-1

The identity of a stored excerpt, command or other content-addressed object
must be computable from its bytes alone, by any tool, without git and without
a fixed hash algorithm. A git blob SHA-1 fails both: it hashes a git-specific
`blob <length>\0` header together with the bytes, and it uses an algorithm that
git itself is replacing. An identity that names its algorithm lets a later
algorithm be added without invalidating existing references.

This is architecturally significant because every provenance reference, every
content-addressed file name and every verify probe in konspekt is keyed by this
identity, and a non-git store ([[task-enterprise-persistence]]) cannot compute
a git blob SHA as a native operation. Its consequences are carried by the
`drives` edge to [[wp-adr-ni-sha256-references]].

This requirement is recorded after the decisions it drives, from the
discussion in [[investigation-source-uris]]; it states the force those
decisions answered rather than a requirement written before them.
