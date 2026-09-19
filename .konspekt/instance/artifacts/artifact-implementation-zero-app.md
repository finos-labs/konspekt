```yaml
id: artifact-implementation-zero-app
name: implementation_zero app
kind: code
location: implementations/implementation-zero/app/
review: accepted
provenance:
  sourceRef: b5733acdd267476135f45abcd27108111f13ca8c
  contentHash: b5733acdd267476135f45abcd27108111f13ca8c
  timestamp: 2026-09-19T15:00:00Z
  conversationId: app-design-101
  confidence: 0.85
createdAt: 2026-09-19T15:00:00Z
updatedAt: 2026-09-19T15:00:00Z
```
# Artifact: implementation_zero app

The running implementation_zero application at `implementations/implementation-zero/app/`.
A zero-dependency Node core (`server.mjs`) watches the instance, reloads through
`loadInstance()` in `lib/conformance.mjs`, and serves the view plus `/api/entities`,
`/api/stats`, `/api/goals`, `/api/graph`, and a Server-Sent-Events change stream.
The view (`view/`) has three read-only tabs — Changes, Stats, Goals — and an
always-on-top Electron shell (`electron-main.mjs`) wraps the localhost view.

Produced by [[task-implementation-zero]]. The Stats tab realizes the measures of
[[task-graph-analytics]] and the Goals tab realizes [[task-goal-task-navigation]],
both as projections over the shared query layer (`lib/views.mjs`); it holds no
write path, so `propose→accept` is unaffected. Non-normative: `spec/` governs on
any conflict.
