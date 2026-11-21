package dev.konspekt.plugin

import java.io.File
import java.nio.file.Files
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

// The reads behind the drawer's Connections frame and the pop-out graph
// (task-ui-atom-neighborhood-graph): /api/neighbors and /api/fullgraph. The
// matching implementation-zero assertions are in
// implementations/implementation-zero/app/test/projections.test.mjs.
class InstanceReaderNeighborsTest {

  private fun entity(dir: File, rel: String, front: String) {
    val f = File(dir, rel); f.parentFile.mkdirs()
    f.writeText("```yaml\n$front\n```\n# x\n")
  }

  private fun instance(): File {
    val dir = Files.createTempDirectory("konspekt-neighbors").toFile()
    entity(dir, "nodes/goal/goal-a.md", "id: goal-a\ntype: goal\ntitle: Goal A\nstatus: open\nreview: accepted")
    entity(dir, "nodes/task/task-1.md", "id: task-1\ntype: task\ntitle: Task one\nstatus: open\nreview: proposed")
    entity(dir, "nodes/task/task-2.md", "id: task-2\ntype: task\nstatus: resolved\nreview: accepted")
    entity(dir, "noteworthy/nw-x.md", "id: nw-x\nkind: decision\nreview: accepted")
    File(dir, "edges").mkdirs()
    File(dir, "edges/edges.md").writeText(
      """
      |# Edges
      |
      || id | kind | from | to | weight | review |
      ||----|------|------|----|--------|--------|
      || e1 | decomposes | node:goal-a | node:task-1 |  | accepted |
      || e2 | notes | node:task-1 | noteworthy:nw-x |  | proposed |
      || e3 | links | node:task-2 | node:task-1 |  | accepted |
      || e4 | notes | node:task-1 | noteworthy:nw-gone |  | accepted |
      |""".trimMargin())
    return dir
  }

  @Test
  fun neighborsListBothDirectionsSortedByKindThenDirection() {
    val g = InstanceReader.load(instance())
    val json = InstanceReader.neighborsJson(g, "task-1")
    val order = Regex("\"kind\":\"(\\w+)\",\"dir\":\"(\\w+)\",\"review\":(?:\"\\w+\"|null),\"neighbor\":\\{\"id\":\"([\\w-]+)\"")
      .findAll(json).map { it.groupValues.drop(1).joinToString(" ") }.toList()
    assertEquals(listOf("decomposes in goal-a", "links in task-2", "notes out nw-gone", "notes out nw-x"), order)
    assertTrue(json.contains("\"edge\":\"e2\",\"kind\":\"notes\",\"dir\":\"out\",\"review\":\"proposed\",\"neighbor\":{\"id\":\"nw-x\",\"kind\":\"noteworthy\""), json)
    assertTrue(json.contains("{\"id\":\"nw-gone\",\"kind\":null,\"status\":null,\"review\":null,\"title\":null,\"missing\":true}"), json)
    assertTrue(json.contains("{\"id\":\"goal-a\",\"kind\":\"goal\",\"status\":\"open\",\"review\":\"accepted\",\"title\":\"Goal A\",\"missing\":false}"), json)
    assertEquals("{\"error\":\"no such entity\"}", InstanceReader.neighborsJson(g, "nope"))
  }

  @Test
  fun fullGraphKeepsOnlyEdgesBetweenEntities() {
    val g = InstanceReader.load(instance())
    val json = InstanceReader.fullGraphJson(g)
    assertEquals(4, Regex("\"missing\":false").findAll(json).count(), json)
    assertTrue(json.contains("\"edges\":[{\"id\":\"e1\""), json)
    assertTrue(json.contains("{\"id\":\"e2\",\"kind\":\"notes\",\"from\":\"task-1\",\"to\":\"nw-x\",\"review\":\"proposed\"}"), json)
    assertTrue(!json.contains("\"e4\""), json)
    assertTrue(json.endsWith("\"dangling\":1}"), json)
  }
}
