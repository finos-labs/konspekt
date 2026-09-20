```yaml
id: wp-adr-executed-log
kind: decision
subtype: adr
timestamp: 2026-09-20T14:00:00Z
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
# Waypoint: Serialize executed commands as an append-only log

Executed commands are recorded in `commands/executed.md`, an append-only table
`| entity | command |`: one row per execution, `entity` any entity id, `command`
the content hash resolving to `commands/<command>.md`. **Row order is execution
order** — the timeline is the file's order, so no per-row timestamp is stored.
`executed` is therefore no longer a core edge-table kind; only `drives` remains an
edge the engineer layer adds.

This supersedes the earlier approach (from [[wp-adr-engineer-layer]]) of binding
commands with an `executed` edge carrying a `timestamp`, which the core edge table
— columns `id|kind|from|to|weight|review` — cannot serialize. Keeping the record
as a log also lets any entity type be a command's subject and keeps a high-volume,
time-ordered, provenance-only record out of the goal graph.

Forced by [[concept-record-all-executed]]; consequences are
`spec/personas/engineer/SPEC.md`, `spec/architecture/SERIALIZATION.md`,
`registry.mjs` (a `commandLog` declaration), and the `lib/conformance.mjs`
validation of the log. Marks [[task-executed-provenance-serialization]].
