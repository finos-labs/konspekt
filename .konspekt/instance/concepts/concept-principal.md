```yaml
id: concept-principal
label: Principal
aliases: [principal, declared identity]
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
# Concept: Principal

An identity that an instance declares in `authority/principals.md`. Its kind is
`human` or `agent`. A principal is what proposes an atom, accepts an atom, or
issues a grant, and the `by` column of the transition log names it.

"Principal" was chosen over "maintainer" because the spec already uses "the
maintainer" for the agent that maintains an instance, while
`goal-accountability` uses "named maintainer" for the accepting human. It is
also distinct from a persona layer, which is a vocabulary extension that an
instance activates in `project.md`.

Defined in `spec/architecture/AUTHORITY.md`.
