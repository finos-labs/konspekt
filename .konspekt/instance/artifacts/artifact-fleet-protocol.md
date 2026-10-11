```yaml
id: artifact-fleet-protocol
name: fleet protocol — roles and verbs
kind: doc
location: docs/design/fleet-protocol.md
review: accepted
provenance:
  sourceRef: a5ab6d58fdcc0a8944e90ae083077b5a8332bf2a
  contentHash: a5ab6d58fdcc0a8944e90ae083077b5a8332bf2a
  timestamp: 2026-10-11T14:29:55Z
  conversationId: fleet-as-protocol
  confidence: 0.7
createdAt: 2026-10-11T14:29:55Z
updatedAt: 2026-10-11T14:29:55Z
```
# Artifact: fleet protocol — roles and verbs

Design doc at `docs/design/fleet-protocol.md`. Records the fleet's protocol
vocabulary under [[wp-adr-fleet-agentic-committer]]: an agent-roles table
(proposer, committer, acceptor, grantor) and a verb table giving each proposed
verb (`propose`, `claim`, `release`, `fold`, `accept`, `reject`) its disposition
against the existing checkpoint and authority vocabulary, issuer, and record
effect. It is the working surface for settling that vocabulary; `claim` and
`release` are the open rows.

Produced by [[task-agent-fleet]]. **Non-normative**, like [[artifact-fleet-spec]]:
`spec/` governs on any conflict, and the doc stays under `docs/design/` while the
vocabulary is still `proposed`.
