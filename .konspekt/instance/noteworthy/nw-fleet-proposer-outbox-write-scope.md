```yaml
id: nw-fleet-proposer-outbox-write-scope
kind: decision
review: proposed
provenance:
  sourceRef: 15e3edd1b6fef47c8e08cf98dabf42f8bc7e277e
  contentHash: 15e3edd1b6fef47c8e08cf98dabf42f8bc7e277e
  conversationId: fleet-design-ingest
  timestamp: 2026-10-02T02:30:00Z
  confidence: 0.88
createdAt: 2026-10-02T02:30:00Z
updatedAt: 2026-10-02T02:30:00Z
```
# Noteworthy: proposers hold outbox-namespace write only; the committer owns canonical and the proposed ref

A proposer holds write to **its own outbox namespace only** —
`refs/konspekt/outbox/<agent-id>/*` — under server-side protection that keeps
canonical and the `proposed` ref **committer-only**. This grant is what lets
commit-then-call work for a proposer whose store is the shared remote (the
web/mobile case, where there is no local git), while the proposer never holds
canonical write or the DCO signing key.

The committer is therefore the only holder of canonical write and the signing
key, and proposers are propose-only. This keeps the least-privilege boundary the
committer-role-split already draws ([[nw-fleet-committer-role-split]]): the
deterministic writer is the sole write path to canonical.

**Origin is stamped from the authenticated namespace owner, not a proposer-set
field.** Because a proposer can write only to the namespace it owns, the committer
maps the namespace to the agent identity and records that as `origin`, the MCP
analogue of mapping an outbox branch to its owner. A payload whose self-declared
origin disagrees with the authenticated namespace is set aside with a reason.

Scopes [[task-agent-fleet]]; relates to [[nw-fleet-committer-role-split]] and
[[nw-fleet-sandbox-committer-egress]].
