```yaml
id: artifact-fleet-proposer-common-skill
name: fleet proposer common protocol skill
kind: skill
location: .claude/skills/fleet-proposer-common/SKILL.md
review: accepted
provenance:
  sourceRef: 2b8c8ce74f296aeb851528d9c510c5b28d987136
  contentHash: 2b8c8ce74f296aeb851528d9c510c5b28d987136
  conversationId: fleet-uat-committer-2026-10-21
  timestamp: 2026-10-22T02:16:59.291Z
  confidence: 0.7
createdAt: 2026-10-22T02:16:59.291Z
updatedAt: 2026-10-22T02:16:59.291Z
```
# Artifact: fleet proposer common protocol skill

The shared protocol every fleet proposer role loads: read canonical read-only,
bind to an accepted entity, author one wired atom (field-lines fence + prose +
source excerpt + spec.json), and commit it to the proposer's own outbox via the
CLI. Not vendor-specific; moves to a neutral location per
[[task-vendor-neutral-interop]].

Produced by [[task-agent-fleet]].
