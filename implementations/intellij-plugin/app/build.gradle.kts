// konspekt IntelliJ plugin — build script (IntelliJ Platform Gradle Plugin 2.x).
//
// Floor = IDE 2026.2 (build 262). It builds against the locally installed IDE
// (localIdePath in gradle.properties) rather than a downloaded SDK, because
// Community 2026.2 is not published as a downloadable SDK and the local install
// is the reliable 2026.2 target that matches what runs. Needs a JDK 21 toolchain
// (org.gradle.java.home in gradle.properties points at the JBR-with-JCEF 21).

plugins {
  // Kotlin must be >= the platform's bundled Kotlin (2026.2 ships 2.4.x); an
  // older compiler cannot read the platform's 2.4.0 metadata.
  kotlin("jvm") version "2.4.0"
  id("org.jetbrains.intellij.platform") version "2.19.0"
}

group = providers.gradleProperty("pluginGroup").get()
version = providers.gradleProperty("pluginVersion").get()

repositories {
  mavenCentral()
  intellijPlatform { defaultRepositories() }
}

dependencies {
  intellijPlatform {
    // Build against the locally installed 2026.2 IDE. Set localIdePath in your
    // ~/.gradle/gradle.properties (see gradle.properties for the how/why).
    local(
      providers.gradleProperty("localIdePath").orNull
        ?: error("Set 'localIdePath' to your IntelliJ 2026.2 install in " +
          "~/.gradle/gradle.properties, or pass -PlocalIdePath=<path>.")
    )
    // JCEF (JBCefBrowser / JBCefApp) is a bundled plugin in 2026.2, not core.
    bundledPlugin("com.intellij.modules.jcef")
  }
}

kotlin { jvmToolchain(21) }

intellijPlatform {
  // No Settings/configurable UI, so skip the searchable-options indexing pass
  // (it launches a headless IDE and fails internally under this local build).
  buildSearchableOptions = false
  pluginConfiguration {
    name = providers.gradleProperty("pluginName")
    ideaVersion {
      sinceBuild = providers.gradleProperty("pluginSinceBuild")
    }
  }
}

// Single source for the view (ASR: one view across all surfaces). Copy
// implementation_zero's view into generated resources at build time so the plugin
// carries no forked copy; the copied dir is git-ignored.
val copyView = tasks.register<Copy>("copyView") {
  from(layout.projectDirectory.dir("../../implementation-zero/app/view"))
  into(layout.buildDirectory.dir("generated-resources/view"))
}
sourceSets["main"].resources.srcDir(layout.buildDirectory.dir("generated-resources"))
tasks.named("processResources") { dependsOn(copyView) }
