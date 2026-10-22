```yaml
id: artifact-fleet-spec-writer-skill
name: fleet spec-writer role skill
kind: skill
location: .claude/skills/fleet-spec-writer/SKILL.md
review: proposed
provenance:
  sourceRef: 80ceeb18d72b68d365c83501ba76c5229c25a3ad
  contentHash: 80ceeb18d72b68d365c83501ba76c5229c25a3ad
  conversationId: fleet-uat-committer-2026-10-21
  timestamp: 2026-10-22T02:16:59.291Z
  confidence: 0.7
createdAt: 2026-10-22T02:16:59.291Z
updatedAt: 2026-10-22T02:16:59.291Z
```
# Artifact: fleet spec-writer role skill

The spec-writer proposer role: propose an Artifact (a specification or design
document) capturing something underspecified in konspekt, producing the artifact
record, and commit it to its outbox. Follows [[artifact-fleet-proposer-common-skill]].
This is the role that produced [[artifact-fleet-recovery]] in the UAT.

Produced by [[task-agent-fleet]].
