```yaml
id: artifact-fleet-review-triage-skill
name: fleet review triage skill
kind: skill
location: .claude/skills/fleet-review-triage/SKILL.md
createdAt: 2026-10-21T00:00:00.000Z
updatedAt: 2026-10-21T00:00:00.000Z
review: proposed
provenance:
  sourceRef: 4a291face333a8f1be7714f4b924b8fe478e8e4e
  contentHash: 4a291face333a8f1be7714f4b924b8fe478e8e4e
  conversationId: fleet-uat-skill-builder
  timestamp: 2026-10-22T02:19:07.648Z
  confidence: 0.68
```
# Artifact: fleet review triage skill

The primer that equips an agent to help a human work the proposal review queue
without ever crossing the propose/accept line. It walks the batched review diff
at the persist checkpoint, sorts proposed atoms lowest-confidence-first so
attention lands where the self-reported score is weakest, and for each atom
checks that it is wired to a valid endpoint and bound to an existing entity,
surfacing the binding and source excerpt for the human's bless/reject call. It
changes an agent's behavior by hard-coding the core invariant of review
ergonomics: the agent only ever marks `proposed`, treats `confidence` as a sort
key that triages attention and never as an acceptance threshold, and leaves
every transition to `accepted` to the human. This keeps the self-maintenance
ingestion path from collapsing propose into accept.

Produced by [[task-review-ergonomics]].
