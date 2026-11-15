```yaml
id: nw-crossover-over-parallel
kind: decision
review: proposed
provenance:
  sourceRef: ni:///sha-256;_6jKWgqtgaPGSC45KDUBOqXvupECW48RadXoIEJBg78
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.6
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
    contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Noteworthy: Lean toward within-subject crossover over parallel groups

For the validation experiment, the design lean is a within-subject crossover
(each participant does both arms, order randomized, serving as their own control)
over a parallel-groups RCT. Reason: between-developer variance on "the same type
of problem" is large enough to bury the treatment effect, and crossover removes
that variance by comparing a person to themselves; it also needs fewer
participants. The cost is carryover -- once someone learns to think in the graph's
terms it may leak into their no-konspekt arm -- managed by washout and by
randomizing which arm comes first. Not yet locked; see `nw-experiment-open-items`.
