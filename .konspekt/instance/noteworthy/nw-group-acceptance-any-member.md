```yaml
id: nw-group-acceptance-any-member
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
# Noteworthy: any holder of a grant on a scope accepts; there is no quorum

When more than one principal holds a grant on the same scope, any one of them
accepts an atom in that scope. No quorum or unanimity rule exists. A group is
the set of principals that hold a grant in force on one scope, and each
membership is its own grant row with its own grantor, timestamp, and revocation.

This replaces the "consensus syndicate" configuration named in the scope of
[[task-authority-mechanism]].

Proposes to supersede `nw-unique-acceptor-per-atom`. That invariant allowed one
acceptor per atom so that two acceptors could not accept contradictory
proposals. The restated invariant is: **exactly one grant scope applies to an
atom.** Inside a group, two members can accept atoms that contradict each other,
and the graph shows that only when a `supersedes` edge is proposed. Two members
cannot both accept the same atom, because the first acceptance leaves nothing
proposed. The `by` column names the individual member, so each acceptance still
has one accountable principal.

Notes [[task-authority-mechanism]].
