```yaml
id: task-session-hook-last-checkpoint
type: task
title: Make the session-start hook report a checkpoint that is on origin/main but not in the local checkout
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-23T01:29:20Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;-JF9esqLGGVGyn6ZnbAh6K4Hd6AW0ux8MFTMoqYR3Vs
  conversationId: review-units-graphql-error
  timestamp: 2026-11-23T01:29:20Z
  confidence: 0.6
createdAt: 2026-11-23T01:29:20Z
updatedAt: 2026-11-23T01:41:44Z
```
# Task: Make the session-start hook report a checkpoint that is on origin/main but not in the local checkout

Relates to [[task-session-checkpoint]].

**Observed.** On 2026-11-22 the session-start hook (`.claude/hooks/load-mandatory-skills.sh`) offered the 2026-11-21 checkpoint (`task-ui-clickable-source-refs`). The checkpoint log on `origin/main` already had a 2026-11-22 row (`task-review-units-graphql-error`, commit `a6e0186`, written from claude.ai-web). `git reflog` shows the checkout was at `c2f5c71` when the hook ran, and the IDE pulled `a6e0186` afterwards.

**Cause.** The hook selects the last row correctly (line 109, `tail -n 1`) but reads the local working tree, which is behind `origin/main` whenever a checkpoint was pushed from another venue.

**Done when.** At session start the hook compares the local `checkpoints.md` with the one on `origin/main` (after a bounded `git fetch`, skipped without failure when offline), and when the remote has later rows it offers the remote last row and tells the maintainer that the checkout is behind and should be pulled before work.

Decomposes [[goal-usability]].
