```yaml
id: task-cursor-implementation
type: task
title: Cursor implementation of the fleet
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-03T14:00:00Z
review: accepted
provenance:
  sourceRef: afe1a5babb2999e9f74e89140952271b7653e505
  contentHash: afe1a5babb2999e9f74e89140952271b7653e505
  conversationId: fleet-cursor-impl
  timestamp: 2026-10-03T14:00:00Z
  confidence: 0.8
createdAt: 2026-10-03T14:00:00Z
updatedAt: 2026-10-03T14:00:00Z
```
# Task: Cursor implementation of the fleet

A Cursor-specific binding of the fleet: run the proposer agents as Cursor
background agents (cloud agents), each on its own branch in an isolated cloud VM,
with one durable committer endpoint. Each agent's branch carries a `.konspekt`
instance, so it proposes to the committer before raising its code PR.

This is one concrete runtime under [[nw-fleet-committer-ingest-contract]], not a
change to the standard: the proposer reaches the committer over MCP or an outbox
ref per [[nw-fleet-commit-then-call]], and holds outbox-namespace write per
[[nw-fleet-proposer-outbox-write-scope]].

Open questions:

- **Durable committer.** Cursor background agents are spun up per task and torn
  down, so the committer cannot be one of them. Stand up the committer as a
  durable endpoint (a long-lived agent or a service the Cursor agents call) that
  holds canonical write and the DCO key.
- **Proposal payload off the code branch.** A Cursor agent's branch is destined
  for its PR, so proposal files must not land on it. Write them to a separate
  outbox ref or carry them over MCP only, so code review and graph review stay
  separate.
- **Merge-SHA staleness.** A squash- or rebase-merge of the PR rewrites the
  agent's commit SHA, so any proposal that pins a pre-merge SHA (an artifact
  `produces` edge, a `changed.md` row) goes stale. Bind code-change proposals to
  the merge commit, or re-point after merge.

Decomposes [[task-agent-fleet]].
