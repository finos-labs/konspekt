```yaml
id: nw-fleet-proposer-is-declared-principal
kind: constraint
review: proposed
provenance:
  sourceRef: 2385057ad39e36378c76ae0f2db14aab2733a081
  contentHash: 2385057ad39e36378c76ae0f2db14aab2733a081
  conversationId: fleet-uat-committer-2026-10-21
  timestamp: 2026-10-22T02:16:59.291Z
  confidence: 0.8
createdAt: 2026-10-22T02:16:59.291Z
updatedAt: 2026-10-22T02:16:59.291Z
```
# Noteworthy: a fleet proposer handle is a declared grantless agent principal

The committer records the proposing agent's handle in the transition `by` column
at fold. Conformance (`lib/validate.mjs`) requires every `by` to be a declared
principal, so each fleet proposer handle must appear in
`authority/principals.md` as an agent principal holding no grant: it proposes and
never accepts, matching the existing grantless `claude` agent principal. A fold
whose `by` is an undeclared handle fails validation with `unknown-principal`.
Adding a proposer to the fleet therefore adds a principal row, issued under the
grantor's authority.

Notes [[task-agent-fleet]]; relates to the authority model in
`.konspekt/instance/authority/`.
