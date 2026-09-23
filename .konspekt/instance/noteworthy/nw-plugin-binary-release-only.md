```yaml
id: nw-plugin-binary-release-only
kind: decision
review: proposed
provenance:
  sourceRef: 43e6b92f9ae97a2e0aca9e3c889bd21b3f991009
  contentHash: 43e6b92f9ae97a2e0aca9e3c889bd21b3f991009
  conversationId: konspekt-deck
  timestamp: 2026-09-23T13:40:00Z
  confidence: 0.85
createdAt: 2026-09-23T13:40:00Z
updatedAt: 2026-09-23T13:40:00Z
```
# Noteworthy: the plugin binary ships only as a release asset, not vendored

The IntelliJ plugin binary is not vendored in `distribution/` and is not installed
by `setup/init.mjs`. It ships only as a GitHub release asset; a user downloads the
zip and installs it from disk.

`distribution/` is a generated projection of the outward-facing standard subset
(`spec/`, `setup/`, maintainer skills) that `distribute.mjs` derives from root and
deliberately excludes `implementations/`, the dogfood instance, and `visual/`. A
hand-built binary -- one CI cannot even produce -- would reintroduce the
dual-authority drift the projection exists to prevent, so the binary stays out.

`init.mjs` writes files into the target **repo** (`.konspekt/`, agent files,
components under the working directory). The IDE plugins directory is machine- and
IDE-version-specific and outside its remit, and installing a plugin is not a file
copy. So `init.mjs` does not touch the IDE.

What travels instead is a **pointer**: the adopter kit README under `setup/` (which
is projected into `distribution/`) points at the release and the install-from-disk
step. Refines [[nw-plugin-zip-prebuilt-release]] for
[[task-intellij-plugin-distribution]] and the adopter kit ([[task-adoption-path]]).
