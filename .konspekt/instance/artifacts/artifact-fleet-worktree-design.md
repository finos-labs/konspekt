```yaml
id: artifact-fleet-worktree-design
name: worktree-outbox committer implementation design
kind: doc
location: implementations/fleet/docs/DESIGN.md
review: accepted
provenance:
  sourceRef: ni:///sha-256;R32Y3KPM9fh4CCyFL7YShlSJ5a9QwbRLdXxkgFc0W0M
  conversationId: fleet-worktree-committer
  timestamp: 2026-10-10T16:30:00Z
  confidence: 0.85
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: d1f27d9c19df3cee92f67d1cc8b11d432acc537c
    contentHash: d1f27d9c19df3cee92f67d1cc8b11d432acc537c
createdAt: 2026-10-10T16:30:00Z
updatedAt: 2026-11-15T00:50:13Z
```
# Artifact: worktree-outbox committer implementation design

Implementation-level design for the git fleet cut's worktree-outbox channel, at
`implementations/fleet/worktree/docs/DESIGN.md`. Records the module layout, the
nine milestones, the reuse of `lib/` (`conformance.mjs`, `authority.mjs`,
`validate.mjs`), and four pinned decisions: the committer runs as its own
long-lived CLI process; reader filtering of `review: rejected` is a separate
sibling task ([[task-reader-rejected-filter]]); the shared ingest-contract module
with the MCP channel is extracted later; and `proposal_id` is the hex SHA-256 of
the canonicalized entity (`entity.md`, LF line endings, a single trailing
newline), the hex form that `sha-256/<hex>.md` file names use
(`implementations/fleet/app/payload.mjs`).

Produced by [[task-fleet-worktree-committer]]. **Non-normative**, like
[[artifact-fleet-spec]] and [[artifact-implementation-zero-design]]: `spec/`
governs on any conflict, and `implementations/fleet/design/fleet-spec.md` is the authoritative
fleet design this implements.
