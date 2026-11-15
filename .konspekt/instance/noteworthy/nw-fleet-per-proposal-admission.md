```yaml
id: nw-fleet-per-proposal-admission
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;9a-2bwqAaDR9W-1XIh9bWxEF9kI6ylpFNMOWxYTI9IM
  conversationId: fleet-implementation
  timestamp: 2026-09-28T23:07:00Z
  confidence: 0.95
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
    contentHash: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
createdAt: 2026-09-28T23:07:00Z
updatedAt: 2026-09-28T23:07:00Z
```
# Noteworthy: fleet acceptance is per proposal, recording inspection versus batch

Fleet-mode acceptance is **per proposal**, finer than konspekt's current
file-level accepted-default review. The point of fleet review is that the human
admits a chosen subset rather than signing for a file wholesale, so the human
names which proposals to admit one at a time.

Each accept **records whether the decision was by inspection or by batch** as
provenance, so the signature states its own resolution. This widens the
carried-forward batch-acceptance-granularity item into a concrete rule: a
sole acceptor signing for fleet volume must record the resolution at which they
inspected it.

Scopes [[task-agent-fleet]]; connects to [[task-review-ergonomics]].
