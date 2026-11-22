```yaml
id: task-conformance-ships-review-units
type: task
title: Ship tools/review-units.mjs in the conformance component
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-22T20:03:58Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;A2lm119EuIdXNXYc9d_y3_QFMo0mByp2aPx3WJrMYj0
  conversationId: task-pr-map
  timestamp: 2026-11-22T20:03:58Z
  confidence: 0.85
createdAt: 2026-11-22T20:03:58Z
updatedAt: 2026-11-22T20:03:58Z
```
# Task: Ship tools/review-units.mjs in the conformance component

The conformance component ships the checker's review-unit rules and the binding
audit that reads `changes/review-units.md`, but not the tool that writes the log,
so an adopter cannot derive it ([[nw-task-pr-map-derivable]],
[[nw-landed-commit-recorded]]). Add `tools/review-units.mjs` to
`setup/components/conformance/manifest.yml` as `.konspekt/lib/review-units.mjs`
(Node built-ins only, like the binding audit), name it in the component's next
steps, and check in `test/setup-init.test.mjs` that it installs. Then refresh
cdm-collateral (its `task-konspekt-kit-refresh`).

Decomposes [[goal-adoption]].
