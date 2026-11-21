package dev.konspekt.plugin

import java.io.File
import java.nio.file.Files
import java.security.MessageDigest
import java.util.Base64
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

// The reads behind the drawer's clickable references (task-ui-clickable-source-refs):
// the store location of a source or command, the command lookup, the transition
// rows for one entity, and provenance.deprecated on /api/entity. The matching
// implementation-zero assertions are in
// implementations/implementation-zero/app/test/server.test.mjs.
class InstanceReaderRefsTest {

  private fun ni(bytes: ByteArray): Pair<String, String> {
    val d = MessageDigest.getInstance("SHA-256").digest(bytes)
    val hex = d.joinToString("") { "%02x".format(it) }
    return "ni:///sha-256;" + Base64.getUrlEncoder().withoutPadding().encodeToString(d) to hex
  }

  private fun instance(store: String?): File {
    val dir = Files.createTempDirectory("konspekt-refs").toFile()
    val storeBlock = store ?: ""
    File(dir, "project.md").writeText("```yaml\nid: p\nreferences: ni\n$storeBlock```\n# p\n")
    return dir
  }

  private val gitStore = """
    |store:
    |  kind: git
    |  ref: main
    |  resolve:
    |    source: https://github.com/o/r/blob/{ref}/.konspekt/instance/sources/sha-256/{hex}.md
    |    command: https://example.org/c/{b64}
    |
  """.trimMargin()

  @Test
  fun sourceLocationExpandsStoreResolve() {
    val dir = instance(gitStore)
    val bytes = "# excerpt\n".toByteArray()
    val (ref, hex) = ni(bytes)
    File(dir, "sources/sha-256").mkdirs(); File(dir, "sources/sha-256/$hex.md").writeBytes(bytes)
    val json = InstanceReader.sourceJson(dir, ref)
    assertTrue(json.contains("\"location\":{\"uri\":\"https://github.com/o/r/blob/main/.konspekt/instance/sources/sha-256/$hex.md\",\"link\":true,\"from\":\"store.resolve.source\"}"), json)
  }

  @Test
  fun commandLookupStripsThePrefixAndUsesB64() {
    val dir = instance(gitStore)
    val bytes = "node --test\n".toByteArray()
    val (ref, hex) = ni(bytes)
    File(dir, "commands/sha-256").mkdirs(); File(dir, "commands/sha-256/$hex.md").writeBytes(bytes)
    val json = InstanceReader.commandJson(dir, "command:$ref")
    assertTrue(json.contains("\"path\":\"commands/sha-256/$hex.md\""), json)
    assertTrue(json.contains("\"uri\":\"https://example.org/c/${ref.substringAfter(';')}\",\"link\":true"), json)
    assertEquals("{\"error\":\"bad ref\"}", InstanceReader.commandJson(dir, "command:ni:///sha-256;short"))
    assertEquals("{\"error\":\"no such command\"}", InstanceReader.commandJson(dir, ni("absent".toByteArray()).first))
  }

  @Test
  fun withoutStoreResolveTheLocationIsTheLayoutPath() {
    val dir = instance(null)
    val bytes = "# excerpt\n".toByteArray()
    val (ref, hex) = ni(bytes)
    File(dir, "sources/sha-256").mkdirs(); File(dir, "sources/sha-256/$hex.md").writeBytes(bytes)
    val json = InstanceReader.sourceJson(dir, ref)
    assertTrue(json.contains("\"location\":{\"uri\":\".konspekt/instance/sources/sha-256/$hex.md\",\"link\":false,\"from\":\"layout\"}"), json)
  }

  @Test
  fun aLegacySha1RefUsesTheLayoutPath() {
    val dir = instance(gitStore)
    val sha = "1d195ff1d54002f160df6c3ccf8439f6d382c9f7"
    File(dir, "sources").mkdirs(); File(dir, "sources/$sha.md").writeText("legacy\n")
    val json = InstanceReader.sourceJson(dir, sha)
    assertTrue(json.contains("\"location\":{\"uri\":\".konspekt/instance/sources/$sha.md\",\"link\":false,\"from\":\"layout\"}"), json)
  }

  @Test
  fun transitionsListOneRefInLogOrder() {
    val dir = instance(null)
    File(dir, "transitions").mkdirs()
    File(dir, "transitions/transitions.md").writeText(
      """
      |# Transitions
      |
      || ref | field | from | to | timestamp | source | by |
      ||-----|-------|------|----|-----------|--------|----|
      || node:t | review |  | proposed | 2026-11-21T02:25:00Z |  | claude |
      || node:u | review |  | proposed | 2026-11-21T02:26:00Z |  | claude |
      || node:t | review | proposed | accepted | 2026-11-21T02:31:00Z | ni:///sha-256;x | denisurusov |
      |""".trimMargin())
    assertEquals(
      "{\"ref\":\"node:t\",\"transitions\":[" +
        "{\"field\":\"review\",\"from\":null,\"to\":\"proposed\",\"timestamp\":\"2026-11-21T02:25:00Z\",\"source\":null,\"by\":\"claude\"}," +
        "{\"field\":\"review\",\"from\":\"proposed\",\"to\":\"accepted\",\"timestamp\":\"2026-11-21T02:31:00Z\",\"source\":\"ni:///sha-256;x\",\"by\":\"denisurusov\"}]}",
      InstanceReader.transitionsJson(dir, "node:t"),
    )
  }

  @Test
  fun entityExposesDeprecatedAndProvenanceFields() {
    val dir = instance(null)
    File(dir, "nodes/task").mkdirs()
    File(dir, "nodes/task/t.md").writeText(
      """
      |```yaml
      |id: t
      |type: task
      |status: open
      |review: accepted
      |provenance:
      |  sourceRef: ni:///sha-256;abc
      |  conversationId: conv
      |  timestamp: 2026-11-21T02:25:00Z
      |  confidence: 0.8
      |  deprecated:
      |    migratedAt: 2026-11-14T19:37:32Z
      |    sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
      |    contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
      |```
      |# t
      |""".trimMargin())
    val json = InstanceReader.entityJson(InstanceReader.load(dir), dir, "t")
    assertTrue(json.contains("\"provenance\":{\"timestamp\":\"2026-11-21T02:25:00Z\",\"conversationId\":\"conv\",\"confidence\":\"0.8\"}"), json)
    assertTrue(json.contains("\"deprecated\":{\"sourceRef\":\"1d195ff1d54002f160df6c3ccf8439f6d382c9f7\",\"contentHash\":\"1d195ff1d54002f160df6c3ccf8439f6d382c9f7\",\"migratedAt\":\"2026-11-14T19:37:32Z\"}"), json)
  }
}
