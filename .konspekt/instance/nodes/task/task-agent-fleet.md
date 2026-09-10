```yaml
id: task-agent-fleet
type: task
title: One reviewer over a fleet of agents
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
# Task: One reviewer over a fleet of agents

Scale the current model to N agents proposing into one instance with a single
human reviewer. The rule is unchanged; the work is making many concurrent
machine proposers safe and legible.

Open questions, roughly in dependency order:

**Attribution per proposer.** Provenance already carries `origin`; extend it so
each proposal records which agent produced it, for review triage and later
analytics.

**Concurrency.** N agents writing `edges.md` at once hit the same
non-fast-forward problem as the multi-author case; whatever resolves it in
`task-multi-author-review` resolves it here.

**Review load.** One human against a fleet needs triage, with confidence and
proposer as the sort keys. This connects to `task-review-ergonomics`.

Success is several agents proposing concurrently without clobbering each other,
with the reviewer able to accept per proposer.
