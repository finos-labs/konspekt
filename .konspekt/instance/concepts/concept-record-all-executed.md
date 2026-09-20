```yaml
id: concept-record-all-executed
subtype: asr
label: Record every LLM-executed command, linked to an entity, in order
aliases: [record all executed commands, executed provenance is complete and ordered, command timeline]
review: accepted
provenance:
  sourceRef: 80f080054c0d45db36806a561f1bbedb112dfaa9
  contentHash: 80f080054c0d45db36806a561f1bbedb112dfaa9
  timestamp: 2026-09-20T14:00:00Z
  conversationId: engineer-executed-provenance
  confidence: 0.85
createdAt: 2026-09-20T14:00:00Z
updatedAt: 2026-09-20T14:00:00Z
```
# Concept: Record every LLM-executed command, linked to an entity, in order

In engineering mode, essentially every command an LLM executes in the
conversation is recorded as provenance: the verbatim text, the entity it was
about (any entity type), and its position in execution order. The record earns
its keep only if it is **complete** — all commands, not a curated few — and
**ordered** — the execution timeline is recoverable. Those two properties,
completeness of capture and preservation of execution order, are the requirement.

This is architecturally significant because it fixes what the executed-command
channel must guarantee, and therefore what its serialization must support: a
complete, entity-linked, order-preserving record. Its significance is carried by
the `drives` edge to the ADR that chooses the serialization
([[wp-adr-executed-log]]), not by a stored flag.
