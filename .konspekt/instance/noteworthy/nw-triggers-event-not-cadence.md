```yaml
id: nw-triggers-event-not-cadence
kind: decision
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
# Noteworthy: Operating-loop fires on events, not a cadence

The loop fires on two events, not a clock or turn/session rhythm: (1) the LLM
maintainer ventures a proposal when it judges an atom has crystallized
(propose / `sync`, always `review: proposed`), and (2) a human manual command
accepts and persists (`sync` / `persist` / `sync_persist` plus the authority
verbs — human authority carries acceptance). Per-turn was excluded as noise;
end-of-session was rejected because "session" has no portable meaning across LLM
vendors. Readiness is LLM-judged against the node types — workable but explicitly
imperfect — so it needs a readiness bar that holds until something settles, or it
decays back into per-turn noise.
