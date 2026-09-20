```yaml
id: concept-versioned-write-seam
subtype: asr
label: Concurrent writers coordinate through a versioned R/W contract, not partitioned scope
aliases: [compare-and-swap seam, versioned read/write, no partitioned write scope, CAS contract]
review: proposed
provenance:
  sourceRef: df46fa543395c9f188893c8944453acff0a841bb
  contentHash: df46fa543395c9f188893c8944453acff0a841bb
  timestamp: 2026-09-20T20:00:00Z
  conversationId: cas-cursor-design
  confidence: 0.75
createdAt: 2026-09-20T20:00:00Z
updatedAt: 2026-09-20T20:00:00Z
```
# Concept: Concurrent writers coordinate through a versioned R/W contract, not partitioned scope

More than one writer already touches one instance — an agent in a session and a
human in the app — so writes must be coordinated. The coordination mechanism is
**versioning (compare-and-swap)**, not partitioned write scope: a read returns
`(content, version)`; a write submits `(content, base_version)` and the store
applies it only if the atom is still at `base_version`, otherwise it rejects and
returns the current content to merge and retry. Alongside it the store returns an
**opaque changes-since cursor** ([[nw-cursor-is-opaque-store-token]]) so an away
session catches up without being pushed to.

This is architecturally significant because it is the single seam every backing
store implements and every writer goes through, and it closes a hazard that
already exists: a multi-file push that silently clobbers concurrent edits
([[nw-multifile-push-clobbers-silently]]). It is backend-neutral — the git binding
realizes it one way, a datastore another — which is what lets propose→accept and a
future fleet of agents ([[task-agent-fleet]]) run over a portable record. Its
consequences are carried by the `drives` edge to the ADR that applies it
([[wp-adr-cas-write-contract]]).
