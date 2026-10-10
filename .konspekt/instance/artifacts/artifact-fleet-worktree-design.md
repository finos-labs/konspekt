```yaml
id: artifact-fleet-worktree-design
name: worktree-outbox committer implementation design
kind: doc
location: implementations/fleet/worktree/docs/DESIGN.md
review: accepted
provenance:
  sourceRef: d1f27d9c19df3cee92f67d1cc8b11d432acc537c
  contentHash: d1f27d9c19df3cee92f67d1cc8b11d432acc537c
  conversationId: fleet-worktree-committer
  timestamp: 2026-10-10T16:30:00Z
  confidence: 0.85
createdAt: 2026-10-10T16:30:00Z
updatedAt: 2026-10-10T16:30:00Z
```
# Artifact: worktree-outbox committer implementation design

Implementation-level design for the git fleet cut's worktree-outbox channel, at
`implementations/fleet/worktree/docs/DESIGN.md`. Records the module layout, the
nine milestones, the reuse of `lib/` (`conformance.mjs`, `authority.mjs`,
`validate.mjs`), and four pinned decisions: the committer runs as its own
long-lived CLI process; reader filtering of `review: rejected` is a separate
sibling task ([[task-reader-rejected-filter]]); the shared ingest-contract module
with the MCP channel is extracted later; and `proposal_id` is the git blob SHA of
the canonicalized proposal (proposal.md with the `proposal_id` line removed, LF
line endings, a single trailing newline).

Produced by [[task-fleet-worktree-committer]]. **Non-normative**, like
[[artifact-fleet-spec]] and [[artifact-implementation-zero-design]]: `spec/`
governs on any conflict, and `docs/design/fleet-spec.md` is the authoritative
fleet design this implements.
