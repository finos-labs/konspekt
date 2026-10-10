```yaml
id: task-fleet-worktree-committer
type: task
title: Worktree-outbox fleet committer implementation
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-10T16:00:00Z
review: accepted
provenance:
  sourceRef: 1e1bc298fb11d1f9fa021fdf96d3f4f901147346
  contentHash: 1e1bc298fb11d1f9fa021fdf96d3f4f901147346
  conversationId: fleet-worktree-committer
  timestamp: 2026-10-10T16:00:00Z
  confidence: 0.8
createdAt: 2026-10-10T16:00:00Z
updatedAt: 2026-10-10T16:00:00Z
```
# Task: Worktree-outbox fleet committer implementation

Build the core mechanism of the git fleet cut: the deterministic single-writer
committer and the worktree-outbox path that carries proposals onto canonical.
This is the mechanism the design settled on; it is distinct from
[[task-cursor-implementation]] (a Cursor-specific runtime binding of it) and from
[[task-sources-sha256-migration]] (source re-addressing). The design doc is
[[artifact-fleet-spec]].

Governed by the accepted fleet decisions:

- **Serialized single writer, agents as proposal producers.** N+1 worktrees off
  one object store — one worktree per proposer on its own outbox branch, plus one
  committer worktree holding canonical. Agents read canonical and never write it;
  sync is one-directional, outbox to committer to canonical
  ([[nw-fleet-serialized-committer]]).
- **Worktree-outbox is the co-located ingest option** under the general
  committer-accepts-proposals-over-an-ingest-contract model; MCP is the general
  channel and carries no accept authority ([[nw-fleet-committer-ingest-contract]]).
- **Fold onto canonical as `review: proposed`.** Canonical is authoritative for
  proposal state; the durable `proposed` ref is a derived, rebuildable state index
  (pending / accepted / rejected with canonical-commit pointers), never the
  authority ([[nw-fleet-canonical-authoritative]], [[nw-fleet-durable-proposed-ref]]).
- **Role split.** The write path is deterministic — hash-verify, order by arrival
  with rebase-append on contention, atomic append, DCO `Signed-off-by` trailer,
  post-write SHA recheck — with no model on it. The "which proposals can I commit"
  surface is a separate LLM review assistant on the read side, holding no write
  authority to canonical ([[nw-fleet-committer-role-split]]).
- **Per-proposal admission.** The human admits a chosen subset one proposal at a
  time, recording inspection versus batch as provenance
  ([[nw-fleet-per-proposal-admission]]).

Scope: the committer's read-verify-order-fold protocol over outbox branches, the
proposal payload schema and content-addressed source verification, the durable
`proposed` ref and its rebuild from canonical, and the deterministic-writer /
review-assistant boundary. Code integration (the proposer agents' own code
branches and PRs) is a separate track, out of scope for this cut.

Success is a committer that ingests proposals from N proposer outboxes, verifies
and orders them, folds the admitted subset onto canonical as proposed with the
human acceptor naming the subset, and leaves the store honest after a crash
between the fold commit and a `proposed`-ref update.

Decomposes [[task-agent-fleet]].
