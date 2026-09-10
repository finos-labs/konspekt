```yaml
id: goal-collaboration
type: goal
title: Share authorship across a team
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-08-28T11:49:13Z
review: proposed
provenance:
  sourceRef: 59f0929da44315acea7393b38a6a9db554f5d523
  contentHash: 59f0929da44315acea7393b38a6a9db554f5d523
  timestamp: 2026-08-28T11:49:13Z
  confidence: 0.9
createdAt: 2026-08-28T11:49:13Z
updatedAt: 2026-08-28T11:49:13Z
```
# Goal: Share authorship across a team

Let several participants — people and agents — propose into and review one
shared instance without weakening propose→accept, with accept authority named
in config so it survives a change of backing store. Platforms build
collaboration into their own closed state; the version that works across a
neutral, portable record is the one no single vendor is incentivized to build.
The hardest open part is concurrency control on the single edge table,
unresolved and shared by both the human and the agent case.
