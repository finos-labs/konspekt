```yaml
id: task-central-service-binding
type: task
title: Central-service binding (MCP + REST over a dumb store)
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-06-24T01:46:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;WOlDn7SaYULJGQOoVZwNMCcTQ3RW0XPZKjVBCuCrGF0
  timestamp: 2026-06-24T01:42:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 79ded4d46bf3a766907fe37c0d892da433809f82
    contentHash: 79ded4d46bf3a766907fe37c0d892da433809f82
createdAt: 2026-06-24T01:42:00Z
updatedAt: 2026-06-24T01:46:00Z
```
# Task: Central-service binding (MCP + REST over a dumb store)

The third binding from `task-trigger-transport`'s trajectory: a dedicated
konspekt host the platforms call. Deferred ("if/when"), kept open. Shape, if
built: one core service + datastore exposing neutral read/write, skinned twice —
an MCP server (LLM-facing, native across vendors) and a REST / raw-markdown path
(everything else, and the conformance read). The verbs are unchanged — "sync to
konspekt mcp" is the same orchestration as "sync to github," only the binding's
read/write moves underneath. Constraints: keep the store dumb (review stays in
the conversation — no PRs, no server-side adjudication), and make the binding
pass the manual-re-upload probe via the non-LLM read, or it is lock-in, not a
konspekt transport (`nw-mcp-binding-needs-neutral-read`). Open: whether a
central service is worth standing up at all versus waiting for vendor-baked, and
the smallest useful version.
