```yaml
id: nw-fleet-config-is-setup-driver
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
# Noteworthy: one committed fleet config is the declarative setup driver; host paths are derived, not stored

`fleet.json` is the single declarative source for the fleet. It holds
fleet-level fields — `version`, `canonicalBranch`, `topology`, optional
`committer` identity, and `defaults` — and one entry per agent:
`{ handle, role, entityTypes, optional branch }`. It merges the former separate
`grants.json`: each agent's `entityTypes` grant sits next to the handle it
governs.

It is the primary driver of agent count, agent types, and worktree setup. Setup
reads it and creates one `outbox/<handle>` worktree per agent off the canonical
branch.

Host paths are not persisted. Under `topology: worktree`, each path is resolved
at attach time from `git worktree list` (branch to path), keyed by the branches
in config, so there is no session manifest to write or keep in sync — the same
derive-don't-copy rule the runtime logs already follow. A non-worktree topology
carries explicit path overrides in the per-agent entry.

This inverts today's flow, where the `--proposers` argument drives `init` and
`fleet.json` is its output (`implementations/fleet/app/worktrees.mjs`).

Scopes [[task-agent-fleet]]; relates to [[nw-fleet-config-on-canonical]] and
[[nw-fleet-git-topology-below-standard]].
