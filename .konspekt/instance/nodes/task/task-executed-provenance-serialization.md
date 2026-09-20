```yaml
id: task-executed-provenance-serialization
type: task
title: Serialize executed-command provenance as an ordered log
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-20T14:00:00Z
review: accepted
provenance:
  sourceRef: 80f080054c0d45db36806a561f1bbedb112dfaa9
  contentHash: 80f080054c0d45db36806a561f1bbedb112dfaa9
  conversationId: engineer-executed-provenance
  timestamp: 2026-09-20T14:00:00Z
  confidence: 0.8
createdAt: 2026-09-20T14:00:00Z
updatedAt: 2026-09-20T14:00:00Z
```
# Task: Serialize executed-command provenance as an ordered log

Make the engineer layer's executed-command channel usable. The blocker was that
the spec required a `timestamp` on an `executed` edge, but the core edge table
(`id|kind|from|to|weight|review`) cannot serialize one, so the channel had never
been used ([[nw-persona-brief-not-surfaced]] was the other cause).

Resolution ([[wp-adr-executed-log]], driven by [[concept-record-all-executed]]):
serialize executions as `commands/executed.md`, an append-only `| entity | command |`
log ordered by execution. Implemented across `spec/personas/engineer/SPEC.md`,
`spec/architecture/SERIALIZATION.md`, `spec/personas/engineer/registry.mjs`
(`commandLog`), and `lib/conformance.mjs` (log validation), with the
IntelliJ-plugin build's commands recorded as the first entries.

Success: the checker validates `commands/executed.md`, and an LLM working under the
engineer persona records the commands it runs — verified by `node lib/validate.mjs`.
