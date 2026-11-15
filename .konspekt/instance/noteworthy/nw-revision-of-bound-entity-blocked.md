```yaml
id: nw-revision-of-bound-entity-blocked
kind: constraint
review: proposed
provenance:
  sourceRef: ni:///sha-256;FX4SXiM6wNIk5uPqPhMtzllRqAkKbqbuIKYUdddzW-Y
  conversationId: linkedin-ni-references
  timestamp: 2026-11-15T16:57:46Z
  confidence: 0.6
createdAt: 2026-11-15T16:57:46Z
updatedAt: 2026-11-15T16:57:46Z
```
# Noteworthy: Under basis: accepted, a wording revision of an entity with bound commits cannot be proposed

A body or title revision of an accepted entity is proposed by setting its
`review` back to `proposed` (as done for
[[concept-asr-hash-independent-identity]] on 2026-11-15). Under
`basis: accepted`, an entity that has commits bound to it through
`changes/changed.md` must stay `accepted`: setting
[[task-linkedin-announce-ni-references]] back to `proposed` on 2026-11-15
produced 20 `work-on-unaccepted` errors, one per changed-code row, which would
fail CI.

So the review state cannot carry a pending revision for such an entity. On
2026-11-15 the revision was shown in the conversation, accepted there, and
written with `review` left at `accepted`, so the transition log holds no row
for it. The alternative, a separate proposed atom with a `supersedes` edge,
adds an entity only to carry new wording. Which of these the standard should
prescribe is not decided.
