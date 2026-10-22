```yaml
id: task-fleet-config-driven-setup
type: task
title: Config-driven fleet setup from the canonical fleet.json
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-13T01:50:34Z
review: accepted
provenance:
  sourceRef: e92a5547f7f331a55e37302a4b792acc1273a078
  contentHash: e92a5547f7f331a55e37302a4b792acc1273a078
  conversationId: fleet-uat-config
  timestamp: 2026-10-13T01:50:34Z
  confidence: 0.8
createdAt: 2026-10-13T01:50:34Z
updatedAt: 2026-10-22T18:08:00.000Z
```
# Task: Config-driven fleet setup from the canonical fleet.json

Implement the setup and attach path that realizes
[[nw-fleet-config-on-canonical]] and [[nw-fleet-config-is-setup-driver]].

Read the committed `.konspekt/fleet/config/fleet.json`. For each agent, create an
`outbox/<handle>` worktree off the canonical branch (`git worktree add`). Resolve
the canonical and outbox paths at attach time from `git worktree list`, keyed by
the branches in config, replacing the flat `--root/fleet.json` manifest the CLI
reads today (`implementations/fleet/app/worktrees.mjs` `loadFleet`). Fold the
separate `--grants grants.json` file and the `--proposers` argument into the
config.

Current `init` builds only a throwaway `git init` store; this adds the real-repo
setup it lacks.

Success: from a committed `fleet.json` plus a canonical repository, one command
stands up the N outbox worktrees, and every later command attaches with no
hand-written manifest.

Decomposes [[task-agent-fleet]]; relates to [[task-fleet-worktree-committer]],
[[nw-fleet-config-on-canonical]], and [[nw-fleet-config-is-setup-driver]].
