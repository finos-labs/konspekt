```yaml
id: nw-fleet-proposer-skill-drift
kind: constraint
status: active
review: accepted
provenance:
  sourceRef: 3b5ab0896393176672b6a8afb03d17a923ae7db3
  contentHash: 3b5ab0896393176672b6a8afb03d17a923ae7db3
  conversationId: fleet-uat-committer-2026-10-22
  timestamp: 2026-10-22T16:35:00.000Z
  confidence: 0.9
createdAt: 2026-10-22T16:35:00.000Z
updatedAt: 2026-10-22T17:01:30Z
```
# Noteworthy: a proposer auto-loads skills from its own drift-prone outbox branch

Claude Code auto-loads skills from the session's project dir. A fleet proposer's
session runs in its outbox worktree, so it loads `fleet-proposer-common` and its
role skill from its **own outbox branch** — which lags canonical. Observed
2026-10-22: the outbox branches forked at `220d470`, before `d1715a0` (the
proposer-skill fix: `body_file` → `fence_file`/`prose_file`, and
`implementations/fleet/worktree/app` → `implementations/fleet/app`), so the
spec-writer engine read a stale protocol. It produced a correct proposal only
because it noticed the discrepancy against canonical's copy and used the
corrected path from the launch brief.

The constraint: a proposer must read its protocol/role skill from
**`CANONICAL/.claude/skills/`**, not the copy auto-loaded from its own branch.
Refreshing outbox branches from canonical treats the symptom; reading from
canonical removes the drift surface. Aligns with [[task-vendor-neutral-interop]]
(skills move to a neutral canonical location).

Notes [[task-agent-fleet]].
