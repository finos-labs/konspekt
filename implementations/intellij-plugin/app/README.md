# konspekt IntelliJ plugin — app

A JetBrains plugin that renders the shared konspekt view in a tool window via
JCEF, reading the open project's `.konspekt/instance` in-process (no Node). The
design is in `../docs/DESIGN.md`; the graph tracks the work as
`task-intellij-plugin`.

## Install (no build)

Most people do not build this. Download the prebuilt plugin zip from the latest
release and install it from disk:

1. Get `konspekt-intellij-<version>.zip` from the releases page:
   <https://github.com/finos-labs/konspekt/releases/latest>
2. In **IntelliJ IDEA 2026.2 or newer**: Settings → Plugins → ⚙ →
   *Install Plugin from Disk…* → the downloaded zip, then restart when prompted.

The sections below are for building the plugin from source.

## Requirements

- **IntelliJ IDEA 2026.2 or newer** — this is the minimum supported IDE
  (`pluginSinceBuild = 262`); older IDEs are intentionally unsupported.
- **A JBR-with-JCEF 21** to run the Gradle build (Gradle 9.7.1 needs a supported
  JDK). Point the build at it via `JAVA_HOME` or `org.gradle.java.home` in your
  `~/.gradle/gradle.properties` — not committed to the repo.
- **Gradle** via the bundled wrapper (`./gradlew`, Gradle 9.7.1). Kotlin 2.4 and
  the IntelliJ Platform Gradle Plugin are declared in `build.gradle.kts`.

## Build target — the local install

Community 2026.2 is not published as a downloadable SDK, so the build targets the
**locally installed IDE** via `local(localIdePath)`. `localIdePath` is
machine-specific and is NOT committed — set it in your
**`~/.gradle/gradle.properties`** (Gradle merges it) or pass `-PlocalIdePath=<path>`:

    localIdePath=C:/Program Files/JetBrains/IntelliJ IDEA 2026.2

The build fails with a clear message if it is unset. (The install whose
`product-info.json` reports 2026.2 may sit in a stale-named folder, e.g.
`…/IntelliJ IDEA 2025.3` after an in-place upgrade.)

## Build and run

```
./gradlew buildPlugin     # -> implementations/intellij-plugin/app/build/distributions/konspekt-intellij-0.0.11.zip
./gradlew runIde          # launches a sandbox IDE; open the "konspekt" tool window (right edge)
```

Install the built zip into your own IDE: Settings → Plugins → ⚙ →
*Install Plugin from Disk…* →
`implementations/intellij-plugin/app/build/distributions/konspekt-intellij-0.0.11.zip`.

## Status

**Increment 1 (verified building green against 2026.2):** the plugin builds, adds
a right-side **konspekt** tool window, starts an in-process HTTP/SSE server, and
renders the shared view via JCEF. Data endpoints return an empty snapshot, so the
view shows its chrome (tabs, filters) with "0 entities". Runtime (`runIde` /
install) is the remaining manual check.

**Increment 2 (implemented and runtime-verified against 2026.2):**
`InstanceReader.kt` parses the open project's `.konspekt/instance` (a second,
independent implementation of the serialization — the `task-second-implementer`
milestone) and backs `/api/entities`, `/api/stats`, `/api/goals`, `/api/graph`,
`/api/entity`, `/api/source`. A VFS listener pushes a fresh cursor over SSE on
each instance change, so Changes / Stats / Goals and the entity detail drawer
populate and refresh live. It reads the instance of whichever project is open in
the IDE. Confirmed rendering and live refresh from the installed-from-disk zip.

**Writes (human dispositions, working-tree only):** `POST /api/accept`
(`task-ui-simple-actions`) and `POST /api/resolve` (`task-ui-resolve-action`, the
`resolve` authority verb → `status: resolved`). Both are exercised from the tool
window's entity drawer; the model never calls them.

**Later:** the remaining authority verbs (`abandon` / `validate` / `refute` /
`pin` / `lift`) and reject, under `task-task-workthrough-ui`.

## One-view guarantee

The view is not copied into the repo. `build.gradle.kts`'s `copyView` task copies
`../../implementation-zero/app/view` into generated resources at build time, so
the plugin can never carry a forked view (ASR: one view across all surfaces).
