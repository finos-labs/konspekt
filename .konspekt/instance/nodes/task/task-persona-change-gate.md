```yaml
id: task-persona-change-gate
type: task
title: Protect changes to who carries legal weight
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-10T09:00:00Z
review: proposed
provenance:
  sourceRef: 679628fa02a009b6f129ff8805300eedefc5b699
  contentHash: 679628fa02a009b6f129ff8805300eedefc5b699
  timestamp: 2026-09-08T11:45:54Z
  confidence: 0.8
createdAt: 2026-09-08T11:45:54Z
updatedAt: 2026-09-10T09:00:00Z
```
# Task: Protect changes to who carries legal weight

Assigning or removing the legally-bound persona is the most guarded operation,
gated more strictly than an ordinary maintainers-list change. Without this,
anyone able to edit the list could drop the persona and escape the signing
requirement, which would void the control.

The gate mechanism is configurable per instance, set in `project.md` alongside
the accept-authority config. A fixed quorum rule cannot be the only shape: an
individual or single-maintainer instance can never form a quorum, so a hardcoded
quorum would leave the persona unchangeable there. The configuration selects
among at least two shapes — a separate, stricter named authority for persona
changes, or a quorum (or unanimous) accept from the existing legally-bound
maintainers — and an instance picks the shape that fits its maintainer count.

Success is that a persona change requires the instance's configured gate and is
rejected without it, with a shape available for both single-maintainer and
multi-maintainer instances.
