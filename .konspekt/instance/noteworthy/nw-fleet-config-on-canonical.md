```yaml
id: nw-fleet-config-on-canonical
kind: decision
review: accepted
provenance:
  sourceRef: e92a5547f7f331a55e37302a4b792acc1273a078
  contentHash: e92a5547f7f331a55e37302a4b792acc1273a078
  conversationId: fleet-uat-config
  timestamp: 2026-10-13T01:50:34Z
  confidence: 0.8
createdAt: 2026-10-13T01:50:34Z
updatedAt: 2026-10-13T01:50:34Z
```
# Noteworthy: the fleet config is committed on the canonical branch as repo-local envelope

The committed fleet config is one file, `.konspekt/fleet/config/fleet.json`, on
the canonical branch. It sits beside `OPERATING.md` as repo-local **envelope**,
not inside the portable `.konspekt/instance/`, so a second adopter writes its own
and does not inherit this one. The committer owns the canonical branch, so the
config lives where the single writer already reads.

Two things are kept **out** of this file. Absolute filesystem paths — the
canonical worktree location and each outbox worktree location — are excluded
because they break across clones and machines. The runtime logs
(`.konspekt-fleet/`) are excluded because they are rebuildable from canonical.

This supersedes the earlier placement, where `fleet.json` was a session manifest
at the CLI `--root` carrying absolute paths (`implementations/fleet/docs/ADOPTING.md`,
`implementations/fleet/app/README.md`).

Scopes [[task-agent-fleet]]; relates to [[nw-fleet-git-topology-below-standard]]
and [[nw-fleet-canonical-authoritative]].
