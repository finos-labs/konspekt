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
  conversationId: roadmap-plan
  timestamp: 2026-08-28T11:49:13Z
  confidence: 0.9
createdAt: 2026-08-28T11:49:13Z
updatedAt: 2026-09-10T23:15:00Z
```
# Goal: Make the graph observable

Make the state and history of an instance legible enough to act on. Read as
queries over the typed graph — what has been proposed and accepted, how long
proposals wait unanswered, how the work is progressing — the record becomes the
basis for analysing the efficiency of the work, monitoring and controlling it
while it runs, intervening when it goes off course, and drawing lessons from
what happened afterwards. Every measure is a regenerable projection over the
graph and adds nothing back to it.

The concrete first measures — edge density, provenance depth, proposal and
acceptance counts, unaccepted-proposal age — are also the ones the effectiveness
research needs, so the capability is general and that research is its first
consumer.
