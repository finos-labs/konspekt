```yaml
id: investigation-validation
type: investigation
title: How to validate the product
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-06-21T13:00:00Z
review: accepted
provenance:
  conversationId: goals-and-motivation
  timestamp: 2026-06-21T13:00:00Z
createdAt: 2026-06-21T13:00:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Investigation: How to validate the product

Dogfooding validates ergonomics and what state is worth tracking, but the
author is a non-representative user, so own-use yields hypotheses, not proof.
The deeper question — is the pain acute enough that people adopt a *new
convention* — needs strangers.

## Experiment design direction (2026-09)

A concrete design for testing the compounding-advantage hypothesis
(`concept-compounding-advantage`) with strangers, arrived at across a design
conversation:

- **Two arms on identical work:** a human with konspekt enabled vs. the same work
  without it. The baseline is native memory in its realistic strong form (model
  memory plus ad-hoc human notes), not a crippled context-stuffing baseline.
- **The hard part is the simulated prompts and the arm-B memory model.** If either
  is generated loosely the experiment measures the generator, not konspekt. The
  no-konspekt arm's human/agent memory must be a defined, imperfect, identical-
  across-arms recall model.
- **Design shape:** lean toward a within-subject crossover over a parallel-groups
  RCT, because between-developer variance on "the same type of problem" is large
  enough to bury the effect and crossover removes it (`nw-crossover-over-parallel`).
- **Sequence:** a scripted single-project matched-pair pilot first (cheap mechanism
  test), then the crossover trial (ecological test) (`nw-pilot-before-matrix`).
- **Measurement:** a start-of-session probe battery against ground truth, scoring
  accuracy, cost to re-establish context (counting curation labor honestly), and a
  separately-tracked confidently-wrong rate — the argued primary endpoint.

Six design items remain open (`nw-experiment-open-items`): parallel-vs-crossover,
control-group sham, primary endpoint, comparability of "same type", duration and
washout, and human-subjects overhead. Resolving these is the next step.
