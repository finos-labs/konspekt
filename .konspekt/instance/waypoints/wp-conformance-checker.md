```yaml
id: wp-conformance-checker
kind: milestone
timestamp: 2026-07-20T18:00:00Z
review: proposed
provenance:
  sourceRef: ni:///sha-256;GL64s0C3knxFD_YrBEJa7nnb0vqfOhjp7ZJ7FKX54yY
  timestamp: 2026-07-20T18:00:00Z
  confidence: 0.85
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 5ed08b5539e0bb86e59aa8a79ec1c903f0c569b2
    contentHash: 5ed08b5539e0bb86e59aa8a79ec1c903f0c569b2
createdAt: 2026-07-20T18:00:00Z
updatedAt: 2026-07-20T18:00:00Z
```
# Waypoint: conformance becomes mechanical

The instance stops being described by hand.

Until now every claim about what an instance contained was a sample somebody
stopped taking — a summary diff, then two node files, then seven plus git log,
each pass narrowing the claim rather than checking it. Three separate atoms were
built on samples that later turned out to be wrong.

An inflection rather than a feature, because it changes what counts as evidence:
the schema reconciliation's open items are now decidable by running something.
`edge-domain-range` is R4's evidence, `unexpected-field` is R1's and R5's, the
enum and status-vocabulary checks are R2's.

The checker also turned out to be half-built already, inside the visualizer's
snapshot step, pointable at any instance and never pointed at the second one.
That is its own finding: capability that exists but is not reachable is
capability nobody uses.
