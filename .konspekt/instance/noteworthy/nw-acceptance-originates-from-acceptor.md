```yaml
id: nw-acceptance-originates-from-acceptor
kind: decision
review: proposed
provenance:
  sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  conversationId: accept-authority-design
  timestamp: 2026-10-07T12:20:00Z
  confidence: 0.9
createdAt: 2026-10-07T12:33:57Z
updatedAt: 2026-10-07T12:33:57Z
```
# Noteworthy: an acceptance is originated only by an acceptor

The invariant in `spec/architecture/REVIEW.md` read: the transition to
`accepted` is exclusively human. It now reads: an acceptance is originated only
by an acceptor, a principal that holds a grant for the atom from a human
grantor. In an instance that declares no principals, the acceptor is human.

The prohibitions of the earlier text remain. No confidence threshold and no
timeout produces an acceptance, and an agent never accepts an atom it proposed.
An agent accepts only an atom whose birth row names a different proposer.

This is the explicit amendment that [[task-authority-mechanism]] required
before a non-human acceptor could be admitted. It is consistent with
`nw-acceptor-is-persona-capability` and `nw-human-only-accept-default`: every
acceptance traces to a human decision, either the acceptance itself or the
grant that authorized it.

Notes [[task-authority-mechanism]].
