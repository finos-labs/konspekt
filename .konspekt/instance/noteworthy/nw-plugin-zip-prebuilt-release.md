```yaml
id: nw-plugin-zip-prebuilt-release
kind: decision
review: proposed
provenance:
  sourceRef: d880e928f6971045863a1798a8a6585adfb011b9
  contentHash: d880e928f6971045863a1798a8a6585adfb011b9
  conversationId: konspekt-deck
  timestamp: 2026-09-23T13:10:00Z
  confidence: 0.85
createdAt: 2026-09-23T13:10:00Z
updatedAt: 2026-09-23T13:10:00Z
```
# Noteworthy: the IntelliJ plugin ships as a prebuilt zip on a GitHub release

The plugin is distributed as a **maintainer-built, prebuilt `.zip`** attached to
a GitHub release. A user installs it from disk (Settings -> Plugins -> Install
Plugin from Disk) and needs only a supported IDE. Requiring end users to build
from source is rejected: if a build toolchain were the price of entry, JetBrains
Marketplace would be the better channel, and Marketplace stays out of scope for
[[task-intellij-plugin-distribution]].

The zip must declare an **open-ended IDE floor**: `since-build = 262` with
`until-build` cleared, so it installs on 2026.2 and every newer build. The
IntelliJ Platform Gradle Plugin 2.x otherwise defaults `until-build` to the
`sinceBuild` branch (`262.*`), which caps the zip to 2026.2.x only.

CI cannot build the artifact — the build targets a local 2026.2 install because
Community 2026.2 has no downloadable SDK — but a build-once-locally-and-upload
release does not need CI. This is the channel side of
[[task-intellij-plugin-distribution]] and applies to [[task-intellij-plugin]].
