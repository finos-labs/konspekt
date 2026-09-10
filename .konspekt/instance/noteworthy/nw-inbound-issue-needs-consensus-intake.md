```yaml
id: nw-inbound-issue-needs-consensus-intake
kind: decision
review: proposed
provenance:
  sourceRef: 1adaaa49660f2708f0467c8caf0b971677a5144b
  contentHash: 1adaaa49660f2708f0467c8caf0b971677a5144b
  conversationId: roadmap-plan
  timestamp: 2026-09-10T22:30:00Z
  confidence: 0.85
createdAt: 2026-09-10T22:30:00Z
updatedAt: 2026-09-10T22:30:00Z
```
# Noteworthy: An inbound issue is not a graph proposal until the consensus-forming body admits it

Issues stay one-way outputs of the notifier: a graph event produces an issue,
never the reverse by default. An outside contributor's issue does not
automatically become a proposed task in the graph.

To enter the graph, an issue must be formally brought into the consensus-forming
body that holds accept authority (the "syndicate"), which admits it under the
propose→accept discipline. Graph authorship stays inside the accept-authority
body named in config, rather than letting arbitrary external input write
proposals directly. This is the same accept-authority model that governs
[[nw-roadmap-generation-coupled-to-authority]] and [[task-persona-change-gate]],
and it serves the shared-authorship aim of goal-collaboration.
