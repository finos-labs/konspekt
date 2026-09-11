```yaml
id: task-authority-mechanism
type: task
title: Design a richer accept-authority mechanism
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-11T14:00:00Z
review: accepted
provenance:
  sourceRef: 31313e0b47591b17ee59513996bf8f260728ceb7
  contentHash: 31313e0b47591b17ee59513996bf8f260728ceb7
  conversationId: roadmap-plan
  timestamp: 2026-09-11T14:00:00Z
  confidence: 0.8
createdAt: 2026-09-11T14:00:00Z
updatedAt: 2026-09-11T14:00:00Z
```
# Task: Design a richer accept-authority mechanism

The single-individual shape recorded in
[[nw-instance-single-individual-authority]] covers one human who is the sole
contributor to a project. Instances with more than one acceptor, or a
non-human acceptor, need a defined mechanism for who may accept and how an
acceptance is formed. Design that mechanism.

Scope — at least these shapes beyond single-individual:

- **Designated approver.** Acceptance routes to one named authority distinct
  from the proposer set.
- **Consensus syndicate.** A group forms an acceptance by a configured rule
  (quorum or unanimity).
- **Non-human acceptor.** An automated or delegated authority accepts under
  stated rules. This conflicts with the current invariant in
  `spec/architecture/REVIEW.md` that the transition to `accepted` is
  exclusively human; admitting it requires an explicit decision to amend that
  invariant rather than silently widening it.

The mechanism includes how an instance **declares** its shape — a spec-defined
config field, whose `project.md` home is already assumed by
[[task-persona-change-gate]] — and how the conformance checker reads and
enforces it. It couples to [[task-persona-change-gate]] (guarding changes to who
carries accept authority) and to [[task-signed-accepts]] (signed acceptance via
a legally-bound persona).

Success is a specified accept-authority config an instance can set to any
supported shape, validated by the conformance checker, admitting
single-individual, designated-approver, consensus-syndicate, and non-human
acceptor configurations under an explicit rule for each about who or what may
originate an acceptance.
