```yaml
id: task-spec-acceptance-prose
type: task
title: State in the spec that acceptance is prose
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-07T17:15:00Z
review: accepted
provenance:
  conversationId: authority-verb-usage-2026-10-07
  timestamp: 2026-10-07T17:05:00Z
  confidence: 0.8
createdAt: 2026-10-07T17:05:00Z
updatedAt: 2026-10-07T17:15:00Z
```
# Task: State in the spec that acceptance is prose

Add a paragraph to `spec/data-model/SPEC.md` in the `Human vocabulary (v1)`
section, before the authority-verb table, stating that plain acceptance is prose
in v1: a human accepts a proposal in the conversation and the atom lands
`review: accepted` with no status change. The paragraph names the Accept control
and the `accepted` status as the same `review` transition seen from the UI and
from the data, and cross-references the deferred `accept <ref>` verb in
`spec/architecture/TRANSPORT.md`. Closes the confusion that the vocabulary lists
six authority verbs and no `accept`, while the UI shows an Accept button and
entities carry status `accepted`.

Working source only (`spec/`); the frozen `distribution/latest/spec/` snapshot is
bumped by a separate release action.

Decomposes [[investigation-authority-verb-usage]].
