```yaml
id: concept-accept-grant
label: Accept grant
aliases: [grant, acceptor, grantor, grant scope]
review: proposed
provenance:
  sourceRef: ni:///sha-256;rlHb2VSzAvJCByH2dZRWKKHL9NnFyUo5KTc9H_65FlE
  conversationId: accept-authority-design
  timestamp: 2026-10-07T12:20:00Z
  confidence: 0.9
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
    contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
createdAt: 2026-10-07T12:33:57Z
updatedAt: 2026-10-07T12:33:57Z
```
# Concept: Accept grant

A recorded statement that one principal, the **acceptor**, may accept the atoms
inside one **scope**, issued by one **grantor** at one time. A grantor is a
human principal with the `grantor` role. A scope is the entire graph or one
entity and its subgraph. Grants are rows in the append-only table
`authority/grants.md`, and a later `revoke` row ends a grant.

A principal accepts an atom only while it holds a grant in force on the scope
that applies to that atom.

Defined in `spec/architecture/AUTHORITY.md`.
