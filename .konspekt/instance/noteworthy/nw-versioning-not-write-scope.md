```yaml
id: nw-versioning-not-write-scope
kind: decision
review: proposed
provenance:
  sourceRef: ni:///sha-256;5ZP6EMbu315z1W-q2K8KWxHcurJbCgHuFBPWf1QJSGo
  timestamp: 2026-09-14T16:00:00Z
  conversationId: app-design-101
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
    contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Noteworthy: Versioning, not partitioned write scope

An earlier proposal split write rights by field — the app writing disposition,
the agent writing content — and was rejected. The native agent keeps everything
it can write today, and the app gets as much write capability as can be
architected. Neither writer is privileged.

Coordination comes from per-atom compare and swap instead. The failure this
exists to prevent is the silent one: a human accepts an atom in the app, an agent
later rewrites that node from its stale copy, and the acceptance reverts to
proposed with no error anywhere. Whole-file rewrites make it worse, so both
writers should edit the lines they mean to change.
