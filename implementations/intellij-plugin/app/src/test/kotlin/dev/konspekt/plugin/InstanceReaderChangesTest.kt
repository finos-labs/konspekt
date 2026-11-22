package dev.konspekt.plugin

import java.io.File
import java.nio.file.Files
import kotlin.test.Test
import kotlin.test.assertTrue

// The Changes tab's review units (spec/personas/engineer/SPEC.md § Review units):
// a `direct` row with an empty review unit (nw-direct-commits-recorded), and the
// landed commit of a squash merge (nw-landed-commit-recorded), carried through to
// /api/changes as implementation-zero's server.mjs does.
class InstanceReaderChangesTest {

  @Test
  fun directAndLandedRowsReachTheJson() {
    val dir = Files.createTempDirectory("konspekt-changes").toFile()
    val changes = File(dir, "changes").apply { mkdirs() }
    File(changes, "changed.md").writeText(
      "| entity | commit | file | timestamp |\n|---|---|---|---|\n" +
        "| task-x | aaa | f1 | 2026-01-01T00:00:00Z |\n" +
        "| task-x | bbb | f2 | 2026-01-01T00:00:00Z |\n" +
        "| task-x | ccc | f3 | 2026-01-01T00:00:00Z |\n",
    )
    File(changes, "review-units.md").writeText(
      "| review unit | state | merge commit | commit | timestamp | landed | match |\n|---|---|---|---|---|---|---|\n" +
        "|  | direct |  | aaa | 2026-01-01T00:00:00Z | aaa | same |\n" +
        "| https://x/pull/1 | merged | sss | bbb | 2026-01-02T00:00:00Z | sss | squash |\n" +
        "| https://x/pull/2 | open |  | ccc | 2026-01-03T00:00:00Z |  |  |\n",
    )
    val json = InstanceReader.changesJson(dir, "task-x")
    assertTrue(json.contains("\"reviewUnits\":[{\"unit\":\"\",\"state\":\"direct\",\"landed\":\"aaa\",\"match\":\"same\"}]"), json)
    assertTrue(json.contains("{\"unit\":\"https://x/pull/1\",\"state\":\"merged\",\"landed\":\"sss\",\"match\":\"squash\"}"), json)
    assertTrue(json.contains("{\"unit\":\"https://x/pull/2\",\"state\":\"open\",\"landed\":\"\",\"match\":\"\"}"), json)
  }
}
