```yaml
id: nw-basis-policy-field
kind: decision
review: accepted
provenance:
  sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  conversationId: accept-authority-design
  timestamp: 2026-10-07T12:20:00Z
  confidence: 0.85
createdAt: 2026-10-07T12:33:57Z
updatedAt: 2026-10-07T12:33:57Z
```
# Noteworthy: `basis` sets whether work may be bound to a proposed entity

`project.md` has a field `basis: proposed | accepted`, default `proposed`.

Under `accepted` the conformance checker reports an error for a changed-code
row, an executed-command row, or a `resolved` status on an entity that is not
`accepted`, and for a resolved node with an attached decision that is not
`accepted`. Under `proposed` none of this is checked, so an existing instance is
unaffected.

Persisting a proposal is permitted under both values. `basis` restricts binding
work, and the rule that review does not block persist is unchanged.

Notes [[task-acceptance-before-work]].
