package dev.konspekt.plugin

import java.nio.file.Files
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

// Origin locators (spec/architecture/SERIALIZATION.md § Sources) as the plugin's
// /api/entity returns them to the shared view's Provenance tab. The matching
// implementation-zero assertion is in implementations/implementation-zero/app/test/server.test.mjs.
class InstanceReaderLocatorsTest {

  private fun fm(yaml: String) = "```yaml\n$yaml\n```\n# body\n"

  private val nested = """
    |id: x
    |provenance:
    |  sourceRef: ni:///sha-256;abc
    |  locators:
    |    - uri: https://github.com/o/r/blob/c/x.md
    |      kind: git-permalink
    |      retrievedAt: 2026-11-14T12:00:00Z
    |    - uri: "https://example.org/y"
    |  deprecated:
    |    sourceRef: deadbeef
    |createdAt: 2026-11-14T00:00:00Z
  """.trimMargin()

  @Test
  fun readsANestedSequenceOfMaps() {
    assertEquals(
      listOf(
        mapOf("uri" to "https://github.com/o/r/blob/c/x.md", "kind" to "git-permalink", "retrievedAt" to "2026-11-14T12:00:00Z"),
        mapOf("uri" to "https://example.org/y"),
      ),
      InstanceReader.parseLocators(fm(nested)),
    )
  }

  @Test
  fun readsASequenceAtTheKeysOwnIndent() {
    val yaml = "provenance:\n  locators:\n  - uri: https://a.test/1\n    kind: url\n  timestamp: t"
    assertEquals(listOf(mapOf("uri" to "https://a.test/1", "kind" to "url")), InstanceReader.parseLocators(fm(yaml)))
  }

  @Test
  fun ignoresLocatorsOutsideTheTopLevelProvenanceMap() {
    val yaml = "provenance:\n  sourceRef: s\n  deprecated:\n    locators:\n      - uri: https://no.test\nlocators:\n  - uri: https://top.test"
    assertEquals(emptyList(), InstanceReader.parseLocators(fm(yaml)))
  }

  @Test
  fun returnsEmptyForAnInlineEmptyListOrNoProvenance() {
    assertEquals(emptyList(), InstanceReader.parseLocators(fm("provenance:\n  locators: []")))
    assertEquals(emptyList(), InstanceReader.parseLocators(fm("id: x")))
  }

  @Test
  fun acceptsCrlfLineEndings() {
    assertEquals(2, InstanceReader.parseLocators(fm(nested).replace("\n", "\r\n")).size)
  }

  @Test
  fun entityJsonCarriesTheLocatorsArray() {
    val inst = Files.createTempDirectory("konspekt-loc").toFile()
    try {
      val concepts = inst.resolve("concepts").apply { mkdirs() }
      concepts.resolve("concept-x.md").writeText(fm("id: concept-x\nreview: proposed\n" + nested.removePrefix("id: x\n")))
      concepts.resolve("concept-y.md").writeText(fm("id: concept-y\nreview: proposed"))
      val g = InstanceReader.load(inst)
      val jx = InstanceReader.entityJson(g, inst, "concept-x")
      assertTrue(
        jx.endsWith(""","locators":[{"uri":"https://github.com/o/r/blob/c/x.md","kind":"git-permalink","retrievedAt":"2026-11-14T12:00:00Z"},{"uri":"https://example.org/y"}]}"""),
        jx,
      )
      val jy = InstanceReader.entityJson(g, inst, "concept-y")
      assertTrue(jy.endsWith(""","locators":[]}"""), jy)
    } finally {
      inst.deleteRecursively()
    }
  }
}
