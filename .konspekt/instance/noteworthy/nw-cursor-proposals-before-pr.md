```yaml
id: nw-cursor-proposals-before-pr
kind: decision
review: proposed
provenance:
  sourceRef: afe1a5babb2999e9f74e89140952271b7653e505
  contentHash: afe1a5babb2999e9f74e89140952271b7653e505
  conversationId: fleet-cursor-impl
  timestamp: 2026-10-03T14:00:00Z
  confidence: 0.8
createdAt: 2026-10-03T14:00:00Z
updatedAt: 2026-10-03T14:00:00Z
```
# Noteworthy: Cursor proposers send konspekt proposals before raising their code PR

On a per-agent-branch runtime — Cursor background agents, each on its own branch
in an isolated cloud VM ending in a pull request — konspekt layers in **front of
the PR**. Each proposer, at the end of its task, sends its proposals to a durable
committer, then raises its code PR.

**The PR and the proposals carry different things, so they coexist.** The pull
request carries the **code diff** (reviewed and merged on GitHub); the konspekt
proposals carry the **project-state graph** — the decisions, findings, artifacts,
and provenance behind that diff — folded onto canonical as `review: proposed` and
admitted by the human acceptor. konspekt does not replace code review; it captures
the record alongside it. Sending proposals before the PR lets the PR reference the
folded proposal ids and the canonical context.

Three constraints make it work:

- **The committer is durable, not an ephemeral task agent.** Cursor background
  agents are torn down after their task, so the committer is a long-lived endpoint
  holding canonical write and the DCO key. Commit-then-call
  ([[nw-fleet-commit-then-call]]) makes the proposers safe to be ephemeral: a
  proposer commits its payload durably, then tears down, and the committer ingests
  afterward.
- **Proposal payload stays off the code PR branch.** The agent writes proposals to
  a separate outbox ref ([[nw-fleet-proposer-outbox-write-scope]]) or carries them
  over MCP only, so a code PR never contains graph payloads.
- **Commit-pinned bindings wait for the merge SHA.** A squash- or rebase-merge
  rewrites the agent's commit SHA, so a proposal that pins a pre-merge SHA goes
  stale; bind code-change proposals to the merge commit or re-point after merge.

This is a Cursor-specific implementation of
[[nw-fleet-committer-ingest-contract]], recorded under
[[task-cursor-implementation]]; it adds the PR-coexistence rule and the
ephemeral-proposer / durable-committer constraint on top of the general ingest
contract.

Scopes [[task-cursor-implementation]]; relates to
[[nw-fleet-committer-ingest-contract]].
