```yaml
id: wp-triggers
kind: decision
timestamp: 2026-06-22T20:00:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;yMIwJFUOmDJ9zMGKKV4EiD45uW4pRrL4R-WxdUVfIVA
  timestamp: 2026-06-22T20:00:00Z
  conversationId: setup-and-operating-loop
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 5008ae3c57610c790f538129478763d706b3fa34
    contentHash: 5008ae3c57610c790f538129478763d706b3fa34
createdAt: 2026-06-22T20:00:00Z
updatedAt: 2026-06-22T20:00:00Z
```
# Waypoint: Operating-loop triggers settled (event-driven)

Settled how the loop fires for this instance: the LLM ventures proposals on
judged atom-readiness; a human manual command accepts and persists. Event-driven
over cadence — no portable session/turn concept across vendors. Realizes the host
policy `task-trigger-transport` delegated out of the spec; lands in
`.konspekt/OPERATING.md`.

**marks** investigation-operating-loop.
