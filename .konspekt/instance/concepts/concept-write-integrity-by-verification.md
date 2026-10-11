```yaml
id: concept-write-integrity-by-verification
subtype: asr
label: Write-path integrity rests on record-level verification and human-authorized acceptance, not on excluding a model from the write
aliases: [verification not a model boundary, any writer plus deterministic verification, enforcement over gating on the write path]
review: accepted
provenance:
  sourceRef: 66ce1472f226767b199556329bedbb9d60ca96f6
  contentHash: 66ce1472f226767b199556329bedbb9d60ca96f6
  timestamp: 2026-10-11T13:39:32Z
  conversationId: fleet-as-protocol
  confidence: 0.8
createdAt: 2026-10-11T13:39:32Z
updatedAt: 2026-10-11T13:39:32Z
```
# Concept: Write-path integrity rests on record-level verification and human-authorized acceptance, not on excluding a model from the write

The integrity of a write to canonical is guaranteed by two record-level
properties, not by the identity of the process that performs the write. First,
every write is a deterministic, byte-exact operation — content hashing, the
`review`-field flip, and an `edges.md` row append — checked after the fact
against the record by `lib/conformance.mjs`, `tools/binding-audit.mjs`, the
`git hash-object` content-address probe, and the `transitions/transitions.md`
log. Second, acceptance is authorized by a human principal and carried in the
conversation. Because correctness is verified against the record and acceptance
is human-authorized, whether the executor is a deterministic script or an agent
does not change the guarantee.

This is architecturally significant because it is the force that lets the
committer's JavaScript machinery shrink in favor of agentic communication while
the graph is never left partially written and the accepted commit still carries
the human `Signed-off-by`. It generalizes the store-neutral enforcement
principle of [[nw-accept-authority-enforced-not-gated]] — authorization is made
auditable, never gated — to the committer's write operations. Its consequences
are carried by the `drives` edge to [[wp-adr-fleet-agentic-committer]].
