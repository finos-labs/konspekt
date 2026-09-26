```yaml
id: nw-pilot-before-matrix
kind: decision
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.7
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Noteworthy: Run a single-project pilot before the full matrix

Build the whole apparatus for one project end to end first -- author one
decision/to-do/supersession script, run both arms once, and check whether the
probe battery discriminates and whether a cost gap is visible at small size. A
full run is N projects x D sessions x 2 arms x repeated runs; if a single clean
pilot shows no separation, the full matrix will not rescue it, and that is learned
for a fraction of the cost. The scripted matched-pair pilot (a tight mechanism
test) and the crossover trial (the ecological test) are complementary, not
competing: if both point the same way the result is hard to dismiss.
