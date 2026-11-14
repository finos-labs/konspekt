```yaml
id: concept-instance-upgradeability
label: Instance upgradeability
aliases: [upgradeable instances, instances must be upgradeable, scaffold drift, adopters get later features]
review: accepted
provenance:
  sourceRef: ni:///sha-256;ZFFCepedzS1zf-wWLU7oQBR3JUztxpxErxkoxbAPFfQ
  timestamp: 2026-07-19T23:35:00Z
  confidence: 0.7
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: b38b180d7178d8ca8c41044782fbd0158fd5de05
    contentHash: b38b180d7178d8ca8c41044782fbd0158fd5de05
createdAt: 2026-07-19T23:35:00Z
updatedAt: 2026-07-19T23:50:00Z
```
# Concept: Instance upgradeability

A repo that adopted konspekt at some point must be able to reach the current
konspekt without being re-scaffolded by hand. Scaffolding is a one-time event;
the standard keeps moving. Every feature added after an instance was created —
the notifier, the per-row edge review column, the filename-equals-id rule — is
a divergence between what that instance has and what konspekt now offers, and
nothing today closes the gap.

The failure is visible already. `code_tracer` was set up from `init.mjs`, holds
a real instance, and has no notifier: no `notify.yml`, no differ, no workflow.
It is not misconfigured, it is simply *older*, and there is no upgrade path — a
second adopter would hit the same wall with every feature shipped after their
setup date.

This is distinct from **conformance**, which asks whether an instance is a valid
konspekt instance, and from **reconciliation**, which asks whether the graph
agrees with itself. Upgradeability asks a third question: can this instance
*move forward*. An instance can be perfectly conformant and years behind.

Two constraints shape any answer.

**An upgrade is not a re-scaffold.** `init.mjs` refuses to overwrite. Whatever
performs upgrades must add what is missing while leaving authored content
alone — closer to a migration than an initialization, and it inherits the
derived-not-copied discipline (`nw-derive-not-copy`): the upgrade path must not
become a second authority over files the instance owns.

**Not every feature is portable.** The notifier is the sharp case — its
delivery is a GitHub Actions workflow, and konspekt is deliberately not bound to
GitHub. So upgradeability cannot mean "push every konspekt file into every
instance"; it has to distinguish what is part of the standard from what is
host-specific scaffolding around it, and offer the latter rather than assume it.

**Why the confidence is not higher.** The need is demonstrated, but the shape is
not. It is unclear whether this warrants a version marker in the instance, a
capability list, an `init.mjs --upgrade` mode, or simply documentation — and
whether an unversioned instance can be upgraded reliably at all is untested.
