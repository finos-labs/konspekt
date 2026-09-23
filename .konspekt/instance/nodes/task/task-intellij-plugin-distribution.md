```yaml
id: task-intellij-plugin-distribution
type: task
title: Distribute the IntelliJ plugin as an installable zip
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-23T02:53:00Z
review: proposed
provenance:
  sourceRef: b81c3f97c5b8e5e7ba5e00c747479f41b76d39b6
  contentHash: b81c3f97c5b8e5e7ba5e00c747479f41b76d39b6
  conversationId: konspekt-deck
  timestamp: 2026-09-23T02:53:00Z
  confidence: 0.7
createdAt: 2026-09-23T02:53:00Z
updatedAt: 2026-09-23T02:53:00Z
```
# Task: Distribute the IntelliJ plugin as an installable zip

Package [[task-intellij-plugin]] as a distributable JetBrains plugin zip so a
user can install it from disk (Settings -> Plugins -> Install Plugin from Disk)
without building from source. Part of [[goal-usability]]: lowering the barrier
to operating a konspekt instance through the IDE tool window, alongside the
existing shells ([[task-implementation-zero]]).

Scope: a build that produces the plugin distribution zip, a documented install
step, and a place to publish it -- a GitHub release asset is the likely channel.
JetBrains Marketplace submission is out of scope for this task.

Success: a downloadable zip that installs into a current IntelliJ IDEA build,
renders the tool window, and refreshes on a project change -- with install
instructions in the repo.
