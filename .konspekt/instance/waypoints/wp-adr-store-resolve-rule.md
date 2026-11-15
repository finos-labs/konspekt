```yaml
id: wp-adr-store-resolve-rule
kind: decision
subtype: adr
timestamp: 2026-11-14T19:30:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;idqFoT14UBvBzfEOpS8AD5WPfA1E5Q2PaYK3Vo7RxO4
  conversationId: source-uris
  timestamp: 2026-11-14T19:30:00Z
  confidence: 0.75
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 79351f57f62b5883e4590949d7c1a1061dde8bd8
    contentHash: 79351f57f62b5883e4590949d7c1a1061dde8bd8
createdAt: 2026-11-14T19:30:00Z
updatedAt: 2026-11-14T19:43:57Z
```
# Waypoint: Store resolution is declared once per instance in project.md

`project.md` declares the store kind and a `resolve` rule with one template
per kind of content: sources, commands, entities, edges and checkpoints. For
git, the entity template's `{path}` follows the SERIALIZATION.md layout; a
MongoDB or Postgres rule names collections or tables. A new STORAGE.md defines
the operations every backend provides: `getSource`, `getEntity`, `getEdges`
and `getLastCheckpoint`. A read server should also serve
`/.well-known/ni/sha-256/<digest>`; that is a recommendation, because a
git-only instance has no server.

Origin locators (`uri`, `kind`, `retrievedAt`) are optional attributes of a
source, never part of its identity, and limited to the hosts in
`project.md` `locators.allow`.

Consequences: SERIALIZATION.md and the new STORAGE.md; `setup/init.mjs` writes a
default git `store` block; views and the UI clients build links from the rule.
The work is [[task-ni-references]].
