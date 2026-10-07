```yaml
id: nw-by-records-writing-principal
kind: decision
review: proposed
provenance:
  sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  conversationId: accept-authority-design
  timestamp: 2026-10-07T12:20:00Z
  confidence: 0.85
createdAt: 2026-10-07T12:33:57Z
updatedAt: 2026-10-07T12:33:57Z
```
# Noteworthy: the transition log records who wrote each value

`transitions/transitions.md` has a `by` column holding the principal that wrote
the value: the proposer on a row that writes `proposed`, the acceptor on a row
that writes `accepted`. In an instance that declares principals, a row that
writes `accepted` must name a principal that held a grant on the atom's scope at
the row's timestamp.

`by` is a declared value. The writer that appends a row also writes its `by`,
so an agent can record any id. Verified identity depends on
[[task-signed-accepts]].

**Enforcement** follows `nw-accept-authority-enforced-not-gated`: the accepting
client checks the grant before it writes, and the conformance checker reports a
violation after the write. A grant row that fails validation confers nothing.

**Backfill in this instance.** Every earlier row that sets `review` to
`accepted` names `denisurusov`, the one human who held accept authority
(`nw-instance-single-individual-authority`). Earlier rows that write any other
value have no `by`. Rows from 2026-10-07 written by the maintaining agent name
the agent principal `claude`.

Notes [[task-authority-mechanism]].
