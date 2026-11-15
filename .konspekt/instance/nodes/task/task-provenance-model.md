```yaml
id: task-provenance-model
type: task
title: Provenance model — content-addressed source
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-06-22T18:45:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;9oNMw56WvEGIOCxD2QcsF0WABJUYjGj6B1sPiXdsKcY
  timestamp: 2026-06-22T18:00:00Z
  conversationId: provenance-as-chat-text
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: cac9f56277870404ef9a525efd4c773c75740175
    contentHash: cac9f56277870404ef9a525efd4c773c75740175
createdAt: 2026-06-22T18:00:00Z
updatedAt: 2026-06-22T18:45:00Z
```
# Task: Provenance model — content-addressed source (resolved)

Reworked provenance so it anchors on the *source text*, not on a host-supplied
conversation/message id the maintainer is blind to. `Provenance` now carries
`sourceRef` (a content-pinned address of the source excerpt) and `contentHash`
(its construction-time digest); `timestamp` is source time; `conversationId`
demotes to optional grouping; `messageId` is retired. The GitHub binding stores
each excerpt as a git blob, so the blob SHA *is* the content hash and the verify
invariant holds structurally. Push-based ingestion inverts idempotence to
match-level dedup on the content-addressed source, demoting the watermark to a
timestamp-ordered optimization and retiring the edited-message special case.
Specced across `spec/data-model/schema.ts`, `spec/data-model/SPEC.md`, and
`spec/architecture/RECONCILIATION.md`.

Mechanism started: source excerpts live at `instance/sources/<contentHash>.md`
(git blob SHA = contentHash), documented in `instance/sources/README.md`. This
session's entities are the first stamped under it and verify against
`instance/sources/cac9f56277870404ef9a525efd4c773c75740175.md` (verbatim spans
from both sides; an earlier excerpt that summarized the assistant turns is
superseded). Remaining: human-assisted backfill of entities predating the
mechanism, which still carry only `conversationId` + `timestamp`.
