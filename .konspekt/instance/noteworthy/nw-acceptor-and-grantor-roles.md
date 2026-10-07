```yaml
id: nw-acceptor-and-grantor-roles
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
# Noteworthy: accept authority has two roles, acceptor and grantor

**Acceptor** is the role that originates acceptances for the atoms inside its
scope. A human or an agent may hold it.

**Grantor** is the role that grants and revokes acceptor rights. Only a human
may hold it. Every acceptor right, for a human or for an agent, exists only
through a grant from a grantor.

The principal that creates an instance is its first grantor. Adding or removing
a grantor follows the rule that [[task-persona-change-gate]] will define.

One human may hold both roles. A single-individual instance requires that, so
it is permitted by default, and an instance forbids it with
`grantorAccepts: forbidden`.

The grantor role names the authority that [[task-persona-change-gate]]
protects, which that task described without naming a role.

Notes [[task-authority-mechanism]].
