```yaml
id: nw-fleet-git-topology-below-standard
kind: decision
review: proposed
provenance:
  sourceRef: 80787b91bd3624bfe393482af57912892aa26b6c
  contentHash: 80787b91bd3624bfe393482af57912892aa26b6c
  conversationId: fleet-as-protocol
  timestamp: 2026-10-11T15:02:58Z
  confidence: 0.8
createdAt: 2026-10-11T15:02:58Z
updatedAt: 2026-10-11T15:02:58Z
```
# Noteworthy: the fleet is one agentic model; git store topology is a binding concern below the standard

The fleet has **one model** at the konspekt level: N proposer agents, each
writing only its own outbox namespace, hand content-addressed, origin-tagged
proposals to one committer, which verifies each on receipt and folds it onto
canonical as `review: proposed`; a human authorizes acceptance. Transport is
agentic — agents calling the committer, or an MCP server fronting it.

**How the git store is laid out is below this model and does not change it.** N+1
linked worktrees off one object store (one outbox branch per proposer), N
separate local repositories, and protected `refs/konspekt/outbox/<agent-id>/*`
namespaces on a shared remote are equivalent realizations of "each proposer owns
an outbox namespace over a git object store." The choice among them is a
git/GitHub binding concern, invisible to the standard, and is not a
konspekt-level mode. "Worktree mode" names a git topology, not a peer of an
"agentic mode": every realization is agentic at the protocol level.

The handoff details are below the line in the same way — commit-then-call with a
pointer where a shared store exists, payload-in-call where it does not
([[nw-fleet-commit-then-call]]), and committer-reads-branch versus
proposer-calls-committer. The ingest contract verifies a content-addressed
payload on receipt independent of how it arrived.

This sharpens [[nw-fleet-committer-ingest-contract]], which already demoted the
worktree-per-agent layout to one ingest option rather than the general model, and
keeps topology out of the standard the way [[concept-transport-contract]] keeps
the store's read/write binding out of it. The `implementations/fleet/worktree/`
tree is one git binding, not the definition of a mode.

Scopes [[task-agent-fleet]]; relates to [[nw-fleet-committer-ingest-contract]],
[[concept-transport-contract]], and [[wp-adr-fleet-agentic-committer]].
