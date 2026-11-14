```yaml
id: concept-asr-store-agnostic-references
subtype: asr
label: Atoms reference stored content without naming a store, host or URL
aliases: [no store URLs in atoms, store-independent references]
review: proposed
provenance:
  sourceRef: 79351f57f62b5883e4590949d7c1a1061dde8bd8
  contentHash: 79351f57f62b5883e4590949d7c1a1061dde8bd8
  conversationId: source-uris
  timestamp: 2026-11-14T19:30:00Z
  confidence: 0.8
createdAt: 2026-11-14T19:30:00Z
updatedAt: 2026-11-14T19:30:00Z
```
# Concept: Atoms reference stored content without naming a store, host or URL

An atom refers to stored content by content identity only. It must not
contain a store URL, hostname, collection name or credential, so that moving an
instance between stores (git, MongoDB, Postgres) does not rewrite atoms, no
internal host leaks into a repository that may be public, and two instances
agree on the identity of the same bytes. How to reach the content is declared
once per instance, outside the atoms.

This is architecturally significant because it decides where resolution
knowledge lives for every reader and tool: today it is an unstated convention of
the git layout (`sources/<hash>.md` on GitHub). Its consequences are carried by
the `drives` edges to [[wp-adr-ni-sha256-references]] and
[[wp-adr-store-resolve-rule]].

This requirement is recorded after the decisions it drives, from the
discussion in [[investigation-source-uris]]; it states the force those
decisions answered rather than a requirement written before them.
