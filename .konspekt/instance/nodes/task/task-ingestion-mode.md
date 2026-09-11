```yaml
id: task-ingestion-mode
type: task
title: Ingestion mode
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-06-22T15:00:00Z
review: accepted
provenance:
  conversationId: maintain-populate-instances
  timestamp: 2026-06-21T15:00:00Z
createdAt: 2026-06-21T15:00:00Z
updatedAt: 2026-09-11T18:30:00Z
```
# Task: Ingestion mode

How content gets into an instance. Modes are composable: batch transcript
extraction, incremental per-turn deltas, explicit human capture, and
self-maintenance by the working LLM. The current project relies on runtime
self-maintenance — least intrusive, weakest on recall/consistency, and it
collapses propose→accept (the model marks its own homework). First outcome: a
Tier 1 human vocabulary (authority verbs) landed in `spec/data-model/SPEC.md`. The
convention-carrier question this raised — where the operating convention lives so
it isn't re-pasted per project — is an adoption/host concern, not an ingestion
mechanism, and is relocated to [[nw-convention-carrier]].
