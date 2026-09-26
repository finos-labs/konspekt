```yaml
id: concept-compounding-advantage
label: Compounding-advantage hypothesis
aliases: [slide 14 hypothesis, super-linear advantage]
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.6
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Concept: Compounding-advantage hypothesis

The claim under test (deck slide 14): given work that spans multiple sessions,
native memory that accretes with no human curation, and a project with real
structure (interdependent decisions, provenance, supersession), a curated typed
graph turns recall into edge traversal, and its advantage over native memory
grows super-linearly with complexity (edge count). The advantage breaks out as
size, accuracy, and integrity.

Falsification conditions (any one is a genuine hit): no compounding (the gap grows
at most linearly); curation-not-the-graph (flat curated notes recover most of the
advantage, so typed edges are not the mechanism); total cost erases the flat line
(counting curation labor, the graph arm's cost also rises with complexity);
integrity inverts under churn (the graph arm's confidently-wrong rate rises with
complexity as stale edges return confident wrong answers). The curation-not-the-
graph and integrity-under-churn conditions are the sharpest, since they attack the
stated causal story rather than only the effect size.
