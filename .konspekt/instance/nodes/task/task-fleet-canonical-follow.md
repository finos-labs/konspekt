```yaml
id: task-fleet-canonical-follow
type: task
title: "Fleet follows a canonical branch switch: fold pending proposals, re-base outboxes, fleet mode only"
status: active
review: accepted
provenance:
  sourceRef: 6ab9fc3a8f7eeb80f752d2fb04b1e709d0ecfb89
  contentHash: 6ab9fc3a8f7eeb80f752d2fb04b1e709d0ecfb89
  conversationId: fleet-canonical-follow
  timestamp: 2026-11-11T17:59:09Z
  confidence: 0.7
createdAt: 2026-11-11T17:59:09Z
updatedAt: 2026-11-11T17:59:09Z
```
# Task: Fleet follows a canonical branch switch

When the committer's canonical branch changes, every proposer agent follows it:
pending outbox proposals are folded, and each proposer's outbox worktree moves
onto the new canonical branch. The behaviour applies only to an instance running
in fleet mode, meaning the fleet config `.konspekt/fleet/config/fleet.json` is
present and every configured outbox worktree is stood up (the same test
`decideWatchAction` in `committer-watch-hook.mjs` applies). In any other repo it
does nothing.

The three-step manual procedure recorded in
`[[nw-fleet-fold-follows-worktree-branch]]` (switch the canonical worktree,
update `canonicalBranch` in the config, merge the new canonical into each outbox)
is the starting point. This task automates it and adds the drain and the clean
check.

Scope, as decided by the human on 2026-11-11:

- **Trigger: both.** An explicit committer command performs the switch, and the
  fold watcher detects a branch change in the canonical worktree and runs the
  follow.
- **Drain onto the old branch.** Pending proposals fold onto the old canonical
  branch before the switch.
- **Clear outboxes after the drain.** Proposals folded during the drain are
  removed from the outboxes, so they do not fold again onto the new branch.
- **Refuse unless clean.** The follow refuses when any proposer worktree (or the
  canonical worktree) has uncommitted changes, and proceeds only after they are
  cleaned up.
- **`canonicalBranch` is dynamic.** It names the branch the committer created or
  cloned into, and the committer writes it into the config for the proposers to
  follow.

Decomposes [[task-agent-fleet]].
