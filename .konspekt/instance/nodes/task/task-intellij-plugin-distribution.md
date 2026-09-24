```yaml
id: task-intellij-plugin-distribution
type: task
title: Distribute the IntelliJ plugin as an installable zip
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-23T13:10:00Z
review: proposed
provenance:
  sourceRef: b81c3f97c5b8e5e7ba5e00c747479f41b76d39b6
  contentHash: b81c3f97c5b8e5e7ba5e00c747479f41b76d39b6
  conversationId: konspekt-deck
  timestamp: 2026-09-23T02:53:00Z
  confidence: 0.7
createdAt: 2026-09-23T02:53:00Z
updatedAt: 2026-09-23T13:10:00Z
```
# Task: Distribute the IntelliJ plugin as an installable zip

Package [[task-intellij-plugin]] as a distributable JetBrains plugin zip so a
user can install it from disk (Settings -> Plugins -> Install Plugin from Disk)
without building from source. Part of [[goal-usability]]: lowering the barrier
to operating a konspekt instance through the IDE tool window, alongside the
existing shells ([[task-implementation-zero]]).

Channel decision ([[nw-plugin-zip-prebuilt-release]]): distribute a **prebuilt**
zip, maintainer-built, attached to a GitHub release. Requiring users to build
from source is rejected -- were a toolchain the price of entry, JetBrains
Marketplace would be the better channel, and Marketplace stays out of scope for
this task.

The local artifact already exists: `./gradlew buildPlugin` emits
`build/distributions/konspekt-intellij-<version>.zip`, which installs from disk.
The open work is the publish path, not the zip itself:

- **Open-ended IDE floor.** Clear `until-build` in `build.gradle.kts` so the zip
  declares `since-build = 262` with no upper bound; the IntelliJ Platform Gradle
  Plugin 2.x otherwise caps it to `262.*` (2026.2.x only). "Require a certain IDE
  version" means a floor at 2026.2, open above.
- **Release step.** Build the zip locally (CI cannot: the build targets a local
  2026.2 install, as Community 2026.2 has no downloadable SDK) and upload it as a
  GitHub release asset, with install instructions in the repo.

Success: a downloadable zip on a release that installs into IntelliJ IDEA 2026.2
or newer, renders the tool window, and refreshes on a project change -- with
install instructions in the repo.
