```yaml
id: task-accountability-report
type: task
title: The responsibility report
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-08T11:45:54Z
review: proposed
provenance:
  sourceRef: 679628fa02a009b6f129ff8805300eedefc5b699
  contentHash: 679628fa02a009b6f129ff8805300eedefc5b699
  timestamp: 2026-09-08T11:45:54Z
  confidence: 0.85
createdAt: 2026-09-08T11:45:54Z
updatedAt: 2026-09-08T11:45:54Z
```
# Task: The responsibility report

For any accepted node, a projection that returns the full chain: the verbatim
source excerpt (both sides), the proposer (which agent and model), the
acceptor, and the timestamps. It reads the graph and writes nothing back, so it
is an observability projection that decomposes under accountability while
relating to `goal-observability`.

Open questions, roughly in dependency order:

**Proposer attribution is a prerequisite.** The report needs "which agent and
model proposed this" to be answerable, which is the attribution work in
`task-agent-fleet`.

**Read-only, like every projection.** Output is derived and regenerable and is
never written back into the graph.

Success is that, for any accepted node, the report returns source, proposer,
acceptor, and times with no graph mutation.
