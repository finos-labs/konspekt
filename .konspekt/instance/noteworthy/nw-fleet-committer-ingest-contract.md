```yaml
id: nw-fleet-committer-ingest-contract
kind: decision
review: proposed
provenance:
  sourceRef: 15e3edd1b6fef47c8e08cf98dabf42f8bc7e277e
  contentHash: 15e3edd1b6fef47c8e08cf98dabf42f8bc7e277e
  conversationId: fleet-design-ingest
  timestamp: 2026-10-02T02:30:00Z
  confidence: 0.78
createdAt: 2026-10-02T02:30:00Z
updatedAt: 2026-10-02T02:30:00Z
```
# Noteworthy: the fleet generalizes to one committer accepting proposals over a defined ingest contract

The worktree-per-agent layout is **one proposal-ingest option, not the general
model**. A linked worktree cannot be enforced on every proposer: web and mobile
conversations have no working tree, so the outbox-branch mechanism does not exist
for them. The general model is **one committer that accepts proposals through a
defined ingest contract** — a content-addressed, origin-tagged payload the
committer verifies on receipt — independent of how the proposal reaches it.

Two ingest options satisfy that contract. **MCP** is the general mechanism: any
proposer that can call the committer can propose, which covers surfaces with no
worktree, so MCP is the default. **Worktree-outbox** is the option for co-located
container agents, where the outbox branch adds proposer-side durability. MCP
carries proposals into the queue only; it holds no accept authority — the
`review: accepted` transition stays human, per `spec/architecture/REVIEW.md`.

This supersedes [[nw-fleet-serialized-committer]], whose core survives: the
committer is a serialized single writer, agents are proposal producers that never
write canonical, and sync is one-directional from proposer to committer to
canonical; propose stays grow-only and content-addressed, so N concurrent
proposers are near-free at the data layer and all pressure moves to acceptance,
and the `edges.md` traversal shard stays decoupled from fleet concurrency. What
narrows is the layout claim: "N+1 worktrees off one object store" is restated as
one ingest option rather than the model.

This proposal-ingest channel is distinct from the store transport contract
([[concept-transport-contract]], `spec/architecture/TRANSPORT.md`), which is the
committer's own read/write binding to the durable store. The committer is the MCP
server for ingest and a transport client for the store; the two channels do not
share authority.

It also connects the fleet to the web/mobile seed: in the seed topology the
conversation is the proposer and persist-on-accept via the connector is the
committer step fused into it — the n=1 case ([[nw-backend-is-mcp-client-on-web]],
[[nw-webmobile-seed-binds-at-open]]). The fleet separates the two roles, and MCP
is how a proposer that is not the committer reaches the one that is.

Scopes [[task-agent-fleet]]; supersedes [[nw-fleet-serialized-committer]].
