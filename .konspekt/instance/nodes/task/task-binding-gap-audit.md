```yaml
id: task-binding-gap-audit
type: task
title: Detect unbound work — reconcile commits against the graph
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-26T17:00:00Z
review: accepted
provenance:
  sourceRef: 4395f3ccb8e1747ca13f2869046c1cc71972422a
  contentHash: 4395f3ccb8e1747ca13f2869046c1cc71972422a
  conversationId: presentation-and-binding
  timestamp: 2026-09-26T17:00:00Z
  confidence: 0.6
createdAt: 2026-09-26T17:00:00Z
updatedAt: 2026-09-26T17:00:00Z
```
# Task: Detect unbound work — reconcile commits against the graph

Give `binding: required` a detection surface it currently lacks
([[nw-binding-enforcement-gap]]). Build a check that reconciles non-bookkeeping
git commits — those touching files outside `.konspekt/instance/` — against the
changed-code log (`changes/changed.md`) and entity provenance, and reports any
commit that binds to no entity. A commit that changed product surfaces but is
referenced by no atom is unbound work, which under `required` is a violation.

Run it in CI (`.github/workflows/konspekt-conformance.yml`) so the gap becomes
visible instead of silent. It is **detection and observability, not a persist
gate**: it reports after the fact and never blocks a save, keeping the "review
does not block persist" rule (`spec/architecture/BINDING.md`) intact. The commit
boundary is the enforceable proxy for "a conversation happened"; a session-level
prompt is a possible complement, not a replacement.

Decomposes [[goal-accountability]]; addresses [[nw-binding-enforcement-gap]].
