```yaml
id: nw-acceptance-precedes-binding
kind: decision
review: accepted
provenance:
  sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  conversationId: accept-authority-design
  timestamp: 2026-10-07T12:20:00Z
  confidence: 0.9
createdAt: 2026-10-07T12:33:57Z
updatedAt: 2026-10-07T12:33:57Z
```
# Noteworthy: an entity is accepted before a commit is bound to it

Under `basis: accepted`, an explicit acceptance of an entity comes before any
commit is bound to that entity. The preferred order is stricter: acceptance
before code is written.

An instruction to start work does not accept the task node. The agent writes the
node's title and success condition, and the acceptor accepts them after reading
them.

Three checks follow from the order requirement. The conformance checker reports
work bound to an entity that is not accepted. `tools/binding-audit.mjs` reports
a commit authored before its entity was accepted. Where the harness can refuse a
file edit, `.claude/hooks/require-binding.sh` refuses an edit outside the
instance while the bound entity is not accepted. The hook covers the file-edit
tools only, so a change made through a shell command is not refused at that
point.

Notes [[task-acceptance-before-work]].
