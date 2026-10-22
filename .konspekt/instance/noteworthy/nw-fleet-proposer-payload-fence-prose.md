```yaml
id: nw-fleet-proposer-payload-fence-prose
kind: constraint
review: proposed
provenance:
  sourceRef: 46e52dde99b0c4b37deda4b401ca3662d42832cc
  contentHash: 46e52dde99b0c4b37deda4b401ca3662d42832cc
  conversationId: fleet-uat-committer-2026-10-21
  timestamp: 2026-10-22T02:16:59.291Z
  confidence: 0.85
createdAt: 2026-10-22T02:16:59.291Z
updatedAt: 2026-10-22T02:16:59.291Z
```
# Noteworthy: fleet propose payload is a field-lines fence plus separate prose, not a single body

The fleet `propose` CLI assembles the stored atom from two separate inputs: a
field-lines-only `fence` and a `prose` body. `cli.mjs` reads `spec.fence` /
`spec.fence_file` and `spec.prose` / `spec.prose_file`, and `assembleProposal`
(`outbox.mjs`) wraps the fence in the ```yaml delimiters and injects `review:`
and `provenance` itself. The fence therefore carries the entity's field lines
only — no ```yaml delimiters, and never `review` or `provenance`, which the
committer owns. There is no `body_file` input; a proposer that supplies one
fails with "spec needs fence or fence_file". The split is load-bearing: it
structurally prevents a proposer from authoring the fields the committer must
own.

Fixes [[task-agent-fleet]]'s proposer skills; surfaced standing up spec-writer.
