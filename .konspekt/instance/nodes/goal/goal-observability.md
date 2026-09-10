```yaml
id: goal-observability
type: goal
title: Make the graph observable
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
# Goal: Make the graph observable

Make the state and history of an instance legible through queries over the
typed graph — edge density, provenance depth, proposal and acceptance counts,
unaccepted-proposal age — run as projections outside the store and, at the
limit, continuously. These measures are the same ones the effectiveness
research needs, so the capability is general and the research is its first
consumer. It runs entirely as regenerable projections and adds nothing back to
the graph.
