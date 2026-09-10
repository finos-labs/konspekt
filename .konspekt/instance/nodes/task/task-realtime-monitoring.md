```yaml
id: task-realtime-monitoring
type: task
title: Continuous monitoring of an instance
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-08-28T11:49:13Z
review: proposed
provenance:
  sourceRef: 59f0929da44315acea7393b38a6a9db554f5d523
  contentHash: 59f0929da44315acea7393b38a6a9db554f5d523
  timestamp: 2026-08-28T11:49:13Z
  confidence: 0.9
createdAt: 2026-08-28T11:49:13Z
updatedAt: 2026-08-28T11:49:13Z
```
# Task: Continuous monitoring of an instance

Run the analytics queries continuously and watch `review` transitions as they
happen, so an instance is observable live rather than on demand. This extends
the notifier from single events to a standing view.

Open questions, roughly in dependency order:

**What is watched.** `review` transitions are the signal, consistent with the
notifier watching the field that transitions; `status` transitions too, per
`nw-node-status-does-transition`.

**Change source depends on the store.** Native change streams on an enterprise
store, webhook or poll off the notifier on git. The detail here waits on
`task-enterprise-persistence` settling the interface, so this is sketched now
and deferred in detail.

Success is a standing view reflecting transitions on an instance within seconds
of the commit that caused them.
