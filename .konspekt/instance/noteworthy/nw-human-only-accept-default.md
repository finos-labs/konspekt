```yaml
id: nw-human-only-accept-default
kind: decision
review: accepted
provenance:
  sourceRef: 7a4c18fa5e2285df902a347033daed7611423d67
  contentHash: 7a4c18fa5e2285df902a347033daed7611423d67
  conversationId: fleet-authority
  timestamp: 2026-09-21T00:53:00Z
  confidence: 0.95
createdAt: 2026-09-21T00:53:00Z
updatedAt: 2026-09-21T00:53:00Z
```
# Noteworthy: human-only accept is the shipped default (degenerate one-row matrix)

The shipped default accept-authority configuration is a **single human-bound
accept-capable persona** — the degenerate one-row matrix (human, all scopes).
It ships now and yields the serialized single acceptor for free.

Build one mechanism and ship the simplest point as its default: richer shapes
populate more rows of the same matrix without a schema change. This matches how
konspekt already ships a general mechanism with a specific pilot — a storage
interface with git as the reference implementation, persona layers with the
engineer layer as the pilot.

Records the portable, spec-level default for [[task-authority-mechanism]]; the
current dogfood instance's shape is [[nw-instance-single-individual-authority]].
