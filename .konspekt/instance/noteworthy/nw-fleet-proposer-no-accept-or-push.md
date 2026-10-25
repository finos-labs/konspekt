```yaml
id: nw-fleet-proposer-no-accept-or-push
kind: constraint
review: accepted
provenance:
  sourceRef: 4dca7f84eee42618e6bbf9400bd69d00bade7da0
  contentHash: 4dca7f84eee42618e6bbf9400bd69d00bade7da0
  conversationId: fleet-resolve-and-adjustments-2026-10-25
  timestamp: 2026-10-25T14:20:00Z
  confidence: 0.9
createdAt: 2026-10-25T14:20:00Z
updatedAt: 2026-10-25T14:20:00Z
```
# Noteworthy: a fleet proposer never accepts or pushes, and never offers to

A fleet proposer proposes one atom to its own outbox and does nothing else on
the write or review path. It never sets `review: accepted` or `review: rejected`,
never runs the committer's `bless` or `reject`, never commits or pushes to
canonical, never merges its outbox branch into canonical, and never raises a pull
request for its proposal. It also never *offers* the human any of these actions:
offering to push the outbox or to accept an atom is as far outside the role as
doing it, because acceptance is the human acceptor's and the committer owns every
write to canonical (`nw-fleet-proposer-outbox-write-scope`,
`nw-fleet-committer-role-split`). Review does not block persist, so once the
`propose` CLI prints `proposed <id>`, the proposer's work is complete and it does
not wait for or solicit acceptance (`spec/architecture/REVIEW.md`).

The constraint is enforced in the shared proposer protocol
(`.konspekt/agents/skills/fleet-proposer-common/SKILL.md`, mirrored to
`.claude/skills/`), so it covers every proposer role — spec-writer, skill-builder,
presentation-writer — rather than relying on a single session's memory. Observed
2026-10-25: a spec-writer proposer in an adopter repository offered to push its
outbox and to accept an ADR, both outside its role.

Notes [[task-fleet-adjustments]] and [[task-agent-fleet]].
