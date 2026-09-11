```yaml
id: task-roadmap-generation-workflow
type: task
title: Automate ROADMAP.md regeneration on accepted graph change
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-10T22:30:00Z
review: accepted
provenance:
  sourceRef: 1adaaa49660f2708f0467c8caf0b971677a5144b
  contentHash: 1adaaa49660f2708f0467c8caf0b971677a5144b
  conversationId: roadmap-plan
  timestamp: 2026-09-10T22:30:00Z
  confidence: 0.8
createdAt: 2026-09-10T22:30:00Z
updatedAt: 2026-09-10T22:30:00Z
```
# Task: Automate ROADMAP.md regeneration on accepted graph change

Add a GitHub Action that regenerates and commits `ROADMAP.md` when goals or
tasks are accepted, triggered on push-to-main like the notifier
(`.github/workflows/konspekt-notify.yml`). This removes the manual regenerate
step left by [[task-roadmap-generator]].

Two conditions gate this work. First, the workflow needs `contents: write` to
push the regenerated file; the notifier needs only `issues: write`, and pushing
new workflow files through the web connector is the narrow permission still to be
resolved (pushing them from the terminal already works). Second, the trigger and
approval routing depend on the instance's accept-authority model, recorded in
[[nw-roadmap-generation-coupled-to-authority]]: an unattended auto-commit fits a
single-individual authority, while a designated approver or a consensus group
requires routing regeneration through accept authority rather than an
unconditional push-to-main commit.

Success: an accepted graph change yields an up-to-date `ROADMAP.md` without a
manual regenerate step, consistent with the instance's configured
accept-authority.
