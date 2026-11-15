```yaml
id: artifact-fleet-spec
name: fleet-mode design spec
kind: doc
location: implementations/fleet/design/fleet-spec.md
review: accepted
provenance:
  sourceRef: ni:///sha-256;9a-2bwqAaDR9W-1XIh9bWxEF9kI6ylpFNMOWxYTI9IM
  conversationId: fleet-implementation
  timestamp: 2026-09-28T23:07:00Z
  confidence: 0.9
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
    contentHash: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
createdAt: 2026-09-28T23:07:00Z
updatedAt: 2026-11-13T01:20:22Z
```
# Artifact: fleet-mode design spec

Design doc for the git fleet cut, at `implementations/fleet/design/fleet-spec.md`. Records the
proposal payload schema and the committer's read-order-present-append protocol:
N+1 worktrees, one outbox branch per proposer, a deterministic committer plus an
LLM review assistant, a durable `proposed` ref with accepted/rejected/pending
states, per-proposal admission, and SHA-256 source addressing.

Produced by [[task-agent-fleet]]. **Non-normative**, like
[[artifact-implementation-zero-design]]: `spec/` governs on any conflict. Much
of the design is still `proposed`, so it lives under `implementations/fleet/design/` rather than
`spec/`.
