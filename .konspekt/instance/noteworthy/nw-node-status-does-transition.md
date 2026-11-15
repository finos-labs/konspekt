```yaml
id: nw-node-status-does-transition
kind: fact
review: proposed
provenance:
  sourceRef: ni:///sha-256;s15BEreHmr0v5uVs_uTDAC14GleCELr4cbM6XTzj5w8
  timestamp: 2026-07-20T16:00:00Z
  confidence: 0.95
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 54ea0e9de396fa5f319815fe9a4751036aa79b7a
    contentHash: 54ea0e9de396fa5f319815fe9a4751036aa79b7a
createdAt: 2026-07-20T16:00:00Z
updatedAt: 2026-07-20T16:00:00Z
```
# Noteworthy: node status does transition, and git proves it

Supersedes `nw-state-written-at-birth-not-transitioned`, which reached its
conclusion from a sample of two.

That atom conceded the broad claim was false (some nodes are `resolved`) but
retained a narrower one: those nodes carry `createdAt == updatedAt` and bodies
written retrospectively, so they were *authored* resolved rather than moved
from an earlier state — "no entity in either instance shows evidence of a status
transition having occurred."

The narrower claim is also false. Seven task nodes carry `status: resolved`, not
two, and four of them have `updatedAt > createdAt`. Git history is decisive
rather than suggestive:

- `e8731da` (2026-06-21) creates four operating-loop tasks and records their
  birth states in the commit message: "Ingestion + reconcile active;
  trigger-transport + review open."
- `53b14ae` (2026-06-22) — "Flip task-reconciliation to resolved with an
  outcome summary."

That is `active → resolved`, written down as a transition by the person
performing it. `task-trigger-transport` and `task-review-ergonomics` were born
`open` in the same commit and are now `resolved`: two further transitions.

**The recurring error is the sample, not the conclusion.** This claim has now
been asserted three times from progressively larger but still partial reads —
first from a summary diff, then from two node files, now from seven plus git
log. Each correction narrowed the claim rather than checking it. That pattern is
the argument for R8 (ship a validator) stated in evidence rather than in
principle: nothing mechanically enumerates the instance, so every claim about it
is a sample someone stopped taking.

**Consequence for the notifier.** The three-event set (`accepted`, `proposed`,
`superseded`) was justified by the superseded atom's premise — that a differ
watching status would fire on almost nothing. That justification is void. A
status-transition event would have fired at least three times in one month,
which is signal-rate rather than noise-rate. The event set should be revisited
against `task-portable-notifications`; this atom does not itself decide the
new shape.
