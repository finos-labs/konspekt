package dev.konspekt.plugin

import java.io.File
import java.time.Instant

// In-process Kotlin reader over a konspekt instance — the plugin's own
// implementation of the serialization (the second independent implementation,
// task-second-implementer). It mirrors the shapes lib/conformance.mjs (loadInstance),
// lib/views.mjs (goalState), and implementation-zero's projections.mjs produce, so
// the shared view is fed the identical JSON it expects.

data class Entity(
  val entityType: String,          // node | concept | noteworthy | artifact | waypoint
  val id: String,
  val type: String?,               // node type (goal/task/...)
  val status: String?,
  val review: String?,
  val kind: String?,               // noteworthy/waypoint kind
  val subtype: String?,            // persona-layer discriminator (asr/adr)
  val title: String?,
  val updatedAt: String?,
  val createdAt: String?,
  val summaryUpdatedAt: String?,
  val provTimestamp: String?,
  val sourceRef: String?,
  val contentHash: String?,
  val file: String,                // path relative to the instance dir
) {
  // Best timestamp for recency / age (matches projections.mjs bestTs / stats ts).
  fun bestTs(): String? = updatedAt ?: summaryUpdatedAt ?: createdAt ?: provTimestamp
  fun statsTs(): String? = provTimestamp ?: createdAt
  // Display kind: node.type for nodes, entityType otherwise.
  fun displayKind(): String = if (entityType == "node") (type ?: "node") else entityType
  // Node status where one exists (nodes always; noteworthy for assumption/constraint).
  fun rowStatus(): String? = if (entityType == "node" || entityType == "noteworthy") status else null
}

data class Edge(val id: String, val kind: String, val from: String, val to: String, val weight: String?, val review: String?)

class Graph(val entities: List<Entity>, val edges: List<Edge>) {
  val byId: Map<String, Entity> = entities.associateBy { it.id }
}

object InstanceReader {

  private fun stripQuotes(s: String): String {
    val t = s.trim()
    return if (t.length >= 2 && ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'"))))
      t.substring(1, t.length - 1) else t
  }

  private val KV = Regex("^([A-Za-z0-9_\$.-]+):\\s*(.*)$")

  // Parse the fenced ```yaml front-matter into a flat map keyed by the full
  // dotted path of each scalar ("summary.updatedAt", "provenance.sourceRef",
  // "provenance.deprecated.sourceRef", ...), at any nesting depth, so a nested
  // key never overwrites a shallower one with the same name. Enough for the
  // fields the view needs: sequence items ("- ...") and folded/literal block
  // scalars are skipped. The authoritative parser is lib/conformance.mjs.
  internal fun parseFront(text: String): Map<String, String> {
    val t = text.replace("\r\n", "\n").trimStart()
    val fence = Regex("(?s)^```ya?ml\\n(.*?)\\n```").find(t) ?: return emptyMap()
    val out = HashMap<String, String>()
    val path = ArrayDeque<Pair<Int, String>>() // (indent, key) of each open map
    var skipDeeperThan = -1                     // inside a block scalar or a sequence
    for (raw in fence.groupValues[1].split("\n")) {
      if (raw.isBlank() || raw.trim().startsWith("#")) continue
      val indent = raw.length - raw.trimStart().length
      if (skipDeeperThan >= 0) {
        if (indent > skipDeeperThan) continue
        skipDeeperThan = -1
      }
      val trimmed = raw.trim()
      while (path.isNotEmpty() && path.last().first >= indent) path.removeLast()
      if (trimmed.startsWith("- ") || trimmed == "-") {
        // A sequence item: skip it and anything nested under it.
        skipDeeperThan = indent
        continue
      }
      val m = KV.find(trimmed) ?: continue
      val key = m.groupValues[1]; val rest = m.groupValues[2].trim()
      val full = (path.map { it.second } + key).joinToString(".")
      when {
        rest == ">" || rest == ">-" || rest == "|" || rest == "|-" -> skipDeeperThan = indent
        rest.isEmpty() -> path.addLast(indent to key)
        else -> out[full] = stripQuotes(rest)
      }
    }
    return out
  }

  // Origin locators (SERIALIZATION.md § Sources): the `provenance.locators`
  // sequence of maps, which parseFront skips. Each item becomes a flat map of
  // its scalar fields (uri, kind, retrievedAt, ...). Only a `locators` key that
  // is a direct child of the top-level `provenance` map counts, so a nested
  // block such as `provenance.deprecated` cannot contribute one.
  internal fun parseLocators(text: String): List<Map<String, String>> {
    val t = text.replace("\r\n", "\n").trimStart()
    val fence = Regex("(?s)^```ya?ml\\n(.*?)\\n```").find(t) ?: return emptyList()
    val out = ArrayList<MutableMap<String, String>>()
    var inProv = false; var provChild = -1; var inLoc = false; var locIndent = -1
    for (raw in fence.groupValues[1].split("\n")) {
      if (raw.isBlank() || raw.trim().startsWith("#")) continue
      val indent = raw.length - raw.trimStart().length
      val trimmed = raw.trim()
      if (indent == 0) { inProv = trimmed == "provenance:"; provChild = -1; inLoc = false; continue }
      if (!inProv) continue
      val item = trimmed.startsWith("- ") || trimmed == "-"
      // YAML allows the sequence at the key's own indent ("locators:\n  - uri: ...").
      if (inLoc && (indent > locIndent || item)) {
        val body = if (item) trimmed.removePrefix("-").trim() else trimmed
        if (item) out.add(LinkedHashMap())
        val m = KV.find(body) ?: continue
        if (out.isNotEmpty()) out.last()[m.groupValues[1]] = stripQuotes(m.groupValues[2])
        continue
      }
      if (provChild < 0) provChild = indent
      if (indent != provChild) continue
      inLoc = trimmed == "locators:"
      locIndent = indent
    }
    return out
  }

  private fun entityFrom(entityType: String, f: File, rel: String): Entity {
    val fr = parseFront(f.readText())
    return Entity(
      entityType = entityType,
      id = fr["id"] ?: f.name.removeSuffix(".md"),
      type = fr["type"],
      status = fr["status"],
      review = fr["review"],
      kind = fr["kind"],
      subtype = fr["subtype"],
      title = fr["title"] ?: fr["label"],
      updatedAt = fr["updatedAt"],
      createdAt = fr["createdAt"],
      summaryUpdatedAt = fr["summary.updatedAt"],
      provTimestamp = fr["provenance.timestamp"],
      sourceRef = fr["provenance.sourceRef"],
      contentHash = fr["provenance.contentHash"],
      file = rel,
    )
  }

  fun load(instanceDir: File): Graph {
    val entities = ArrayList<Entity>()
    fun addFlat(entityType: String, dirName: String) {
      val dir = File(instanceDir, dirName)
      dir.listFiles()?.filter { it.name.endsWith(".md") }?.sortedBy { it.name }?.forEach {
        entities.add(entityFrom(entityType, it, "$dirName/${it.name}"))
      }
    }
    File(instanceDir, "nodes").listFiles()?.filter { it.isDirectory }?.sortedBy { it.name }?.forEach { td ->
      td.listFiles()?.filter { it.name.endsWith(".md") }?.sortedBy { it.name }?.forEach {
        entities.add(entityFrom("node", it, "nodes/${td.name}/${it.name}"))
      }
    }
    addFlat("concept", "concepts")
    addFlat("noteworthy", "noteworthy")
    addFlat("artifact", "artifacts")
    addFlat("waypoint", "waypoints")

    val edges = ArrayList<Edge>()
    val ef = File(instanceDir, "edges/edges.md")
    if (ef.isFile) {
      for (line in ef.readText().replace("\r\n", "\n").split("\n")) {
        val t = line.trim()
        if (!t.startsWith("|")) continue
        val cells = t.trim('|').split("|").map { it.trim() }
        if (cells.size < 4 || cells[0] == "id" || cells[0].startsWith("---")) continue
        edges.add(Edge(cells[0], cells.getOrElse(1) { "" }, cells.getOrElse(2) { "" },
          cells.getOrElse(3) { "" }, cells.getOrNull(4), cells.getOrNull(5)))
      }
    }
    return Graph(entities, edges)
  }

  // ---------- helpers ----------
  private fun stripType(s: String) = if (s.contains(":")) s.substringAfter(":") else s
  private fun millis(iso: String?): Long = if (iso == null) 0L else try { Instant.parse(iso).toEpochMilli() } catch (e: Exception) { 0L }
  private val KIND_ORDER = listOf("goal", "investigation", "experiment", "topic", "task", "note",
    "concept", "noteworthy", "artifact", "waypoint")

  private fun esc(s: String): String {
    val b = StringBuilder(s.length + 8)
    for (c in s) when (c) {
      '\\' -> b.append("\\\\"); '"' -> b.append("\\\"")
      '\n' -> b.append("\\n"); '\r' -> b.append("\\r"); '\t' -> b.append("\\t")
      else -> if (c < ' ') b.append("\\u%04x".format(c.code)) else b.append(c)
    }
    return b.toString()
  }
  private fun q(s: String?): String = if (s == null) "null" else "\"${esc(s)}\""

  // ---------- projections (emit the JSON the view consumes) ----------

  fun entitiesJson(g: Graph, cursor: String): String {
    val rows = g.entities.map {
      Triple(it, it.bestTs(), it)
    }.sortedWith(compareByDescending<Triple<Entity, String?, Entity>> { millis(it.second) }.thenBy { it.first.id })
    val rowsJson = rows.joinToString(",") { (e, ts, _) ->
      "{\"id\":${q(e.id)},\"kind\":${q(e.displayKind())},\"status\":${q(e.rowStatus())},\"review\":${q(e.review)},\"updatedAt\":${q(ts)}}"
    }
    return "{\"cursor\":${q(cursor)},\"rows\":[$rowsJson],\"counts\":{\"edges\":${g.edges.size}},\"error\":null}"
  }

  fun statsJson(g: Graph): String {
    data class KC(var total: Int = 0, var accepted: Int = 0, var proposed: Int = 0)
    val groups = LinkedHashMap<String, KC>()
    var accepted = 0; var proposed = 0
    val now = System.currentTimeMillis()
    data class Old(val id: String, val kind: String, val ageDays: Long)
    val olds = ArrayList<Old>()
    for (e in g.entities) {
      val k = e.displayKind()
      val kc = groups.getOrPut(k) { KC() }
      kc.total++
      when (e.review) { "accepted" -> { kc.accepted++; accepted++ }; "proposed" -> { kc.proposed++; proposed++ } }
      if (e.review == "proposed") {
        val ts = e.statsTs(); if (ts != null) olds.add(Old(e.id, k, maxOf(0L, (now - millis(ts)) / 86_400_000L)))
      }
    }
    val byKind = KIND_ORDER.filter { groups.containsKey(it) }.joinToString(",") {
      val kc = groups[it]!!; "{\"kind\":${q(it)},\"total\":${kc.total},\"accepted\":${kc.accepted},\"proposed\":${kc.proposed}}"
    }
    val oldest = olds.sortedByDescending { it.ageDays }.take(10).joinToString(",") {
      "{\"id\":${q(it.id)},\"kind\":${q(it.kind)},\"ageDays\":${it.ageDays}}"
    }
    return "{\"total\":${g.entities.size},\"edges\":${g.edges.size},\"accepted\":$accepted,\"proposed\":$proposed,\"byKind\":[$byKind],\"oldest\":[$oldest]}"
  }

  private class GoalState(val rootId: String) {
    var total = 0; val byStatus = LinkedHashMap<String, Int>(); var proposed = 0
    val order = ArrayList<String>(); val depth = HashMap<String, Int>(); val parents = HashMap<String, MutableSet<String>>()
  }

  private fun walkGoal(g: Graph, goalId: String): GoalState {
    val st = GoalState(goalId)
    val children = HashMap<String, MutableList<String>>()
    for (e in g.edges) if (e.kind == "decomposes") {
      val from = stripType(e.from); val to = stripType(e.to)
      children.getOrPut(from) { ArrayList() }.add(to)
      st.parents.getOrPut(to) { LinkedHashSet() }.add(from)
    }
    val seen = HashSet<String>()
    fun dfs(id: String, d: Int) {
      if (id in seen) { if (d < (st.depth[id] ?: Int.MAX_VALUE)) st.depth[id] = d; return }
      seen.add(id); st.depth[id] = d; st.order.add(id)
      for (c in children[id] ?: emptyList()) dfs(c, d + 1)
    }
    dfs(goalId, 0)
    for (id in st.order) if (id != goalId) {
      val n = g.byId[id]
      st.total++
      val s = n?.status ?: "(none)"; st.byStatus[s] = (st.byStatus[s] ?: 0) + 1
      if (n?.review == "proposed") st.proposed++
    }
    return st
  }

  private fun rollupJson(st: GoalState): String {
    val bs = st.byStatus.entries.joinToString(",") { "${q(it.key)}:${it.value}" }
    return "{\"total\":${st.total},\"byStatus\":{$bs},\"proposed\":${st.proposed}}"
  }

  fun goalsJson(g: Graph): String {
    val goals = g.entities.filter { it.entityType == "node" && it.type == "goal" }
      .sortedWith(compareBy({ if (it.review == "accepted") 0 else 1 }, { it.id }))
    val arr = goals.joinToString(",") { gl ->
      val st = walkGoal(g, gl.id)
      "{\"id\":${q(gl.id)},\"title\":${q(gl.title ?: gl.id)},\"status\":${q(gl.status)},\"review\":${q(gl.review)},\"rollup\":${rollupJson(st)}}"
    }
    return "[$arr]"
  }

  fun graphJson(g: Graph, goalId: String): String {
    val root = g.byId[goalId] ?: return "{\"error\":\"no entity with id \\\"${esc(goalId)}\\\"\"}"
    if (root.entityType != "node") return "{\"error\":\"${esc(goalId)} is a ${root.entityType}, not a work node\"}"
    val st = walkGoal(g, goalId)
    val nodes = st.order.joinToString(",") { id ->
      val n = g.byId[id]
      val ps = (st.parents[id] ?: emptySet()).joinToString(",") { q(it) }
      "{\"id\":${q(id)},\"depth\":${st.depth[id] ?: 0},\"type\":${q(n?.type)},\"status\":${q(n?.status)},\"review\":${q(n?.review)},\"title\":${q(n?.title)},\"parents\":[$ps],\"missing\":${n == null}}"
    }
    val rootJson = "{\"id\":${q(root.id)},\"depth\":0,\"type\":${q(root.type)},\"status\":${q(root.status)},\"review\":${q(root.review)},\"title\":${q(root.title)},\"parents\":[],\"missing\":false}"
    return "{\"root\":$rootJson,\"nodes\":[$nodes],\"rollup\":${rollupJson(st)}}"
  }

  fun entityJson(g: Graph, instanceDir: File, id: String): String {
    val e = g.byId[id] ?: return "{\"error\":\"no such entity\"}"
    val f = File(instanceDir, e.file)
    if (!f.isFile) return "{\"error\":\"file missing\"}"
    val acceptedBy = acceptedByOf(instanceDir, "${e.entityType}:${e.id}")
    val text = f.readText()
    val locators = parseLocators(text).joinToString(",") { l ->
      "{" + l.entries.joinToString(",") { (k, v) -> "${q(k)}:${q(v)}" } + "}"
    }
    // provenance.deprecated (SERIALIZATION.md § Migration): the legacy SHA-1
    // sourceRef / contentHash kept after migration, which the view also links.
    val fr = parseFront(text)
    val nz = { k: String -> fr[k]?.takeIf { it.isNotEmpty() } }
    val prov = "{\"timestamp\":${q(nz("provenance.timestamp"))},\"conversationId\":${q(nz("provenance.conversationId"))},\"confidence\":${q(nz("provenance.confidence"))}}"
    val depKeys = listOf("sourceRef", "contentHash", "migratedAt")
    val dep = if (depKeys.any { nz("provenance.deprecated.$it") != null })
      "{" + depKeys.joinToString(",") { "${q(it)}:${q(nz("provenance.deprecated.$it"))}" } + "}" else "null"
    return "{\"id\":${q(e.id)},\"file\":${q(e.file)},\"markdown\":${q(text)},\"review\":${q(e.review)},\"status\":${q(e.status)},\"entityType\":${q(e.entityType)},\"sourceRef\":${q(e.sourceRef)},\"contentHash\":${q(e.contentHash)},\"provenance\":$prov,\"deprecated\":$dep,\"acceptedBy\":${q(acceptedBy)},\"locators\":[$locators]}"
  }

  // Where a content-addressed file lives in the store, for the view's "location
  // in store" line (spec/architecture/SERIALIZATION.md § Store and locators). For
  // an `ni:` reference, project.md `store.resolve.<kind>` is expanded with the
  // reference's {hex} and {b64} and with {ref} = `store.ref`. A legacy SHA-1
  // reference, an instance without the template, or a template naming {ref} with
  // no `store.ref` falls back to the layout path relative to the repository root.
  // `link` is true only for an http(s) URI. Mirrors implementation-zero locationOf.
  internal fun locationJson(instanceDir: File, kind: String, ref: String, rel: String): String {
    val hex = niHex(ref)
    val pf = File(instanceDir, "project.md")
    val front = if (pf.isFile) parseFront(pf.readText()) else emptyMap()
    val tpl = front["store.resolve.$kind"]?.takeIf { it.isNotEmpty() }
    val storeRef = front["store.ref"]?.takeIf { it.isNotEmpty() }
    if (hex != null && tpl != null && (storeRef != null || !tpl.contains("{ref}"))) {
      val b64 = ref.substring("ni:///sha-256;".length)
      val uri = tpl.replace("{hex}", hex).replace("{b64}", b64).replace("{ref}", storeRef ?: "")
      val link = Regex("^https?://", RegexOption.IGNORE_CASE).containsMatchIn(uri)
      return "{\"uri\":${q(uri)},\"link\":$link,\"from\":${q("store.resolve.$kind")}}"
    }
    // The plugin reads <project>/.konspekt/instance, so the repository-root-relative
    // layout path is that prefix plus the instance-relative path.
    return "{\"uri\":${q(".konspekt/instance/$rel")},\"link\":false,\"from\":\"layout\"}"
  }

  // One transition-log row to append: an assignment of `field` on `ref`.
  private data class TransRow(val ref: String, val field: String, val from: String, val to: String)

  // Declared principals (authority/principals.md, `id` column). Empty when the
  // instance ships no authority table — then writes record no `by` and need no
  // principal, matching the implementation-zero server's authorize().
  private fun declaredPrincipals(instanceDir: File): List<String> {
    val f = File(File(instanceDir, "authority"), "principals.md")
    if (!f.isFile) return emptyList()
    val ids = mutableListOf<String>()
    for (line in f.readText().replace("\r\n", "\n").split("\n")) {
      val t = line.trim()
      if (!t.startsWith("|")) continue
      val cells = t.trim('|').split("|").map { it.trim() }
      if (cells.isEmpty() || cells[0] == "id" || cells[0].startsWith("---")) continue
      if (cells[0].isNotEmpty()) ids.add(cells[0])
    }
    return ids
  }

  // The principal that accepted `ref` (type:id), read from the latest review ->
  // accepted row in the transition log, or null when none is recorded (or the
  // instance ships no log / no `by` column). Powers the view's "Accepted by".
  private fun acceptedByOf(instanceDir: File, ref: String): String? {
    val f = File(File(instanceDir, "transitions"), "transitions.md")
    if (!f.isFile) return null
    var by: String? = null
    for (line in f.readText().replace("\r\n", "\n").split("\n")) {
      val t = line.trim()
      if (!t.startsWith("|")) continue
      val cells = t.trim('|').split("|").map { it.trim() }
      if (cells.size < 4 || cells[0] == "ref" || cells[0].startsWith("---")) continue
      if (cells[0] != ref || cells[1] != "review" || cells[3] != "accepted") continue
      by = if (cells.size >= 7 && cells[6].isNotEmpty()) cells[6] else null
    }
    return by
  }

  // Two-way auto-accept every proposed edge touching `id` whose other endpoint is
  // also accepted (the just-dispositioned id counts as accepted). Mirrors the
  // implementation-zero server. Returns the ids of the edges whose review was
  // flipped, so the caller can log a transition row for each (their prior review
  // is always "proposed").
  private fun autoAcceptEdges(instanceDir: File, g: Graph, id: String): List<String> {
    val edgesFile = File(File(instanceDir, "edges"), "edges.md")
    if (!edgesFile.isFile) return emptyList()
    val flippedEdges = mutableListOf<String>()
    val out = edgesFile.readText().replace("\r\n", "\n").split("\n").map { line ->
      val t = line.trim()
      if (!t.startsWith("|")) return@map line
      val cells = t.trim('|').split("|").map { it.trim() }
      if (cells.size < 6 || cells[0] == "id" || cells[0].startsWith("---")) return@map line
      if (cells[5] != "proposed") return@map line
      val from = cells[2]; val to = cells[3]
      val fromId = if (from.contains(":")) from.substringAfter(":") else from
      val toId = if (to.contains(":")) to.substringAfter(":") else to
      if (fromId != id && toId != id) return@map line
      val other = if (fromId == id) toId else fromId
      val otherAccepted = other == id || (g.byId[other]?.review == "accepted")
      if (!otherAccepted) return@map line
      flippedEdges.add(cells[0])
      "| ${cells[0]} | ${cells[1]} | $from | $to | ${cells[4]} | accepted |"
    }
    if (flippedEdges.isNotEmpty()) edgesFile.writeText(out.joinToString("\n"))
    return flippedEdges
  }

  // Append one transition-log row per state assignment, in the SAME write that
  // set the value (spec/architecture/SERIALIZATION.md § Transitions). `timestamp`
  // is now, `source` is empty (a UI write is not tied to a sources/ excerpt).
  // No-op when the instance ships no log: an instance without
  // transitions/transitions.md records no history and is v1-conformant, and
  // writing a partial log here would strand every other entity against the
  // agreement rule. The scaffolder seeds an empty log into a new instance.
  // Mirrors the implementation-zero server's appendTransitions. `by` is the acting
  // principal; its cell is written only when the instance declares principals, so a
  // log in an instance without them keeps its six-column rows (server parity).
  private fun appendTransitions(instanceDir: File, rows: List<TransRow>, by: String, authorityPresent: Boolean) {
    if (rows.isEmpty()) return
    val file = File(File(instanceDir, "transitions"), "transitions.md")
    if (!file.isFile) return
    val ts = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS).toString()
    val tail = if (authorityPresent) " $by |" else ""
    val appended = rows.joinToString("\n") { "| ${it.ref} | ${it.field} | ${it.from} | ${it.to} | $ts |  |$tail" }
    file.writeText(file.readText().trimEnd('\n') + "\n" + appended + "\n")
  }

  // A human disposition from the UI: accept a proposed entity — flip its review
  // proposed -> accepted in the working tree, then two-way auto-accept its now-
  // both-accepted edges. Working-tree only; no git commit. Idempotent.
  fun acceptEntity(instanceDir: File, g: Graph, id: String, principal: String): String {
    val e = g.byId[id] ?: return "{\"error\":\"no such entity\"}"
    val f = File(instanceDir, e.file)
    if (!f.isFile) return "{\"error\":\"file missing\"}"
    val principals = declaredPrincipals(instanceDir)
    val authorityPresent = principals.isNotEmpty()
    val authErr = authorizeWrite(principals, authorityPresent, principal)
    if (authErr != null) return authErr
    val prevReview = e.review ?: ""
    val txt = f.readText()
    val flipped = txt.replace(Regex("(?m)^review:[ \\t]*proposed[ \\t]*$"), "review: accepted")
    val didFlip = flipped != txt
    if (didFlip) f.writeText(flipped)
    val flippedEdges = autoAcceptEdges(instanceDir, g, id)
    val rows = mutableListOf<TransRow>()
    if (didFlip) rows.add(TransRow("${e.entityType}:$id", "review", prevReview, "accepted"))
    for (eid in flippedEdges) rows.add(TransRow("edge:$eid", "review", "proposed", "accepted"))
    appendTransitions(instanceDir, rows, principal, authorityPresent)
    return "{\"entity\":${q(id)},\"accepted\":true,\"edges\":${flippedEdges.size}}"
  }

  // Accept authority guard before a write (spec/architecture/AUTHORITY.md). Returns
  // an error-JSON string to refuse, or null to allow. When the instance declares
  // principals, the acting principal is required and must be declared — mirroring
  // the implementation-zero server's authorize(), which refuses a write without
  // KONSPEKT_PRINCIPAL. Full grant-scope checking stays in lib/conformance.mjs
  // (acceptance-without-grant), which runs on persist.
  private fun authorizeWrite(principals: List<String>, authorityPresent: Boolean, principal: String): String? {
    if (!authorityPresent) return null
    if (principal.isEmpty())
      return "{\"error\":${q("this instance declares principals; set KONSPEKT_PRINCIPAL=<principal id> for the IDE")}}"
    if (!principals.contains(principal))
      return "{\"error\":${q("$principal is not declared in authority/principals.md")}}"
    return null
  }

  // A human authority verb from the UI: resolve a work node -> status: resolved in
  // the working tree (spec/data-model: `resolve <node>` sets status -> resolved).
  // A human verb carries its own acceptance, so a still-proposed node is also
  // flipped review -> accepted, with the same two-way edge auto-accept. Nodes only;
  // a no-op success on a node already resolved; refused on an abandoned node.
  // Working-tree only; no git commit. Mirrors the implementation-zero server.
  fun resolveEntity(instanceDir: File, g: Graph, id: String, principal: String): String {
    val e = g.byId[id] ?: return "{\"error\":\"no such entity\"}"
    if (e.entityType != "node") return "{\"error\":\"resolve applies to work nodes only\"}"
    val f = File(instanceDir, e.file)
    if (!f.isFile) return "{\"error\":\"file missing\"}"
    if (e.status == "resolved") return "{\"entity\":${q(id)},\"resolved\":true,\"accepted\":false,\"edges\":0}"
    if (e.status == "abandoned") return "{\"error\":\"an abandoned node cannot be resolved\"}"
    val principals = declaredPrincipals(instanceDir)
    val authorityPresent = principals.isNotEmpty()
    val authErr = authorizeWrite(principals, authorityPresent, principal)
    if (authErr != null) return authErr
    val prevStatus = e.status ?: ""
    val prevReview = e.review ?: ""
    var txt = f.readText()
    val withStatus = txt.replace(Regex("(?m)^status:[ \\t]*(?:open|active)[ \\t]*$"), "status: resolved")
    if (withStatus == txt) return "{\"error\":\"no open or active status line to resolve\"}"
    txt = withStatus
    var accepted = false
    if (e.review == "proposed") { txt = txt.replace(Regex("(?m)^review:[ \\t]*proposed[ \\t]*$"), "review: accepted"); accepted = true }
    f.writeText(txt)
    val flippedEdges = if (accepted) autoAcceptEdges(instanceDir, g, id) else emptyList()
    val rows = mutableListOf(TransRow("${e.entityType}:$id", "status", prevStatus, "resolved"))
    if (accepted) {
      rows.add(TransRow("${e.entityType}:$id", "review", prevReview, "accepted"))
      for (eid in flippedEdges) rows.add(TransRow("edge:$eid", "review", "proposed", "accepted"))
    }
    appendTransitions(instanceDir, rows, principal, authorityPresent)
    return "{\"entity\":${q(id)},\"resolved\":true,\"accepted\":$accepted,\"edges\":${flippedEdges.size}}"
  }

  // The hex digest of an RFC 6920 `ni:///sha-256;<base64url>` reference, or null
  // when `ref` is not one. The digest must be 43 base64url characters that decode
  // to 32 bytes (lib/conformance.mjs parseNiRef applies the same rule).
  fun niHex(ref: String): String? {
    val prefix = "ni:///sha-256;"
    if (!ref.startsWith(prefix)) return null
    val b64 = ref.substring(prefix.length)
    if (!Regex("^[A-Za-z0-9_-]{43}$").matches(b64)) return null
    val bytes = try { java.util.Base64.getUrlDecoder().decode(b64) } catch (e: IllegalArgumentException) { return null }
    if (bytes.size != 32) return null
    if (java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes) != b64) return null
    return bytes.joinToString("") { "%02x".format(it) }
  }

  // The instance-relative path of a content-addressed file in `dir` (sources or
  // commands): an `ni:` reference maps to `<dir>/sha-256/<hex>.md`, a legacy hex
  // git blob SHA to `<dir>/<sha>.md`, anything else to null.
  fun contentRel(dir: String, ref: String): String? {
    val hex = niHex(ref)
    if (hex != null) return "$dir/sha-256/$hex.md"
    if (Regex("^[0-9a-f]{7,64}$").matches(ref)) return "$dir/$ref.md"
    return null
  }

  fun sourceJson(instanceDir: File, ref: String): String {
    val rel = contentRel("sources", ref) ?: return "{\"error\":\"bad ref\"}"
    val f = File(instanceDir, rel)
    if (!f.isFile) return "{\"error\":\"no such source\"}"
    return "{\"ref\":${q(ref)},\"path\":${q(rel)},\"markdown\":${q(f.readText())},\"location\":${locationJson(instanceDir, "source", ref, rel)}}"
  }

  // One recorded command's verbatim text by its reference: `command:ni:///sha-256;…`,
  // a bare `ni:` URI, or a legacy hex SHA. Mirrors implementation-zero /api/command.
  fun commandJson(instanceDir: File, rawRef: String): String {
    val ref = rawRef.removePrefix("command:")
    val rel = contentRel("commands", ref) ?: return "{\"error\":\"bad ref\"}"
    val f = File(instanceDir, rel)
    if (!f.isFile) return "{\"error\":\"no such command\"}"
    return "{\"ref\":${q(ref)},\"path\":${q(rel)},\"markdown\":${q(f.readText())},\"location\":${locationJson(instanceDir, "command", ref, rel)}}"
  }

  // The transition-log rows for one ref (`type:id` or `edge:<id>`), in log order
  // (SERIALIZATION.md § Transitions): | ref | field | from | to | timestamp | source | by |.
  // Empty when the instance ships no log. Mirrors implementation-zero /api/transitions.
  fun transitionsJson(instanceDir: File, ref: String): String {
    val f = File(File(instanceDir, "transitions"), "transitions.md")
    val rows = ArrayList<String>()
    if (f.isFile) {
      for (line in f.readText().replace("\r\n", "\n").split("\n")) {
        val t = line.trim()
        if (!t.startsWith("|")) continue
        val cells = t.trim('|').split("|").map { it.trim() }
        if (cells.size < 4 || cells[0] == "ref" || cells[0].startsWith("---") || cells[0] != ref) continue
        val cell = { i: Int -> cells.getOrNull(i)?.takeIf { it.isNotEmpty() } }
        rows.add("{\"field\":${q(cells[1])},\"from\":${q(cell(2))},\"to\":${q(cells[3])},\"timestamp\":${q(cell(4))},\"source\":${q(cell(5))},\"by\":${q(cell(6))}}")
      }
    }
    return "{\"ref\":${q(ref)},\"transitions\":[${rows.joinToString(",")}]}"
  }

  // Related commands for an entity: the commands/executed.md rows whose entity is
  // this one, in execution order, each resolved to its verbatim text.
  fun commandsJson(instanceDir: File, entity: String): String {
    val log = File(File(instanceDir, "commands"), "executed.md")
    val rows = ArrayList<String>()
    if (log.isFile) {
      for (line in log.readText().replace("\r\n", "\n").split("\n")) {
        val t = line.trim()
        if (!t.startsWith("|")) continue
        val cells = t.trim('|').split("|").map { it.trim() }
        if (cells.size < 2 || cells[0] == "entity" || cells[0].startsWith("---") || cells[0] != entity) continue
        val hash = cells[1]
        val rel = contentRel("commands", hash)
        val cf = rel?.let { File(instanceDir, it) }
        val md = if (cf != null && cf.isFile) cf.readText() else "(command text missing)"
        val pathJson = if (rel != null) q(rel) else "null"
        rows.add("{\"command\":${q(hash)},\"path\":$pathJson,\"markdown\":${q(md)}}")
      }
    }
    return "{\"entity\":${q(entity)},\"commands\":[${rows.joinToString(",")}]}"
  }

  // Related code changes for an entity: the changes/changed.md rows whose entity
  // is this one, in commit order, grouped by commit. `commit` is an opaque
  // revision token (nw-commit-is-opaque-revision) — never resolved against git.
  fun changesJson(instanceDir: File, entity: String): String {
    val log = File(File(instanceDir, "changes"), "changed.md")
    val byCommit = LinkedHashMap<String, MutableList<String>>()
    if (log.isFile) {
      for (line in log.readText().replace("\r\n", "\n").split("\n")) {
        val t = line.trim()
        if (!t.startsWith("|")) continue
        val cells = t.trim('|').split("|").map { it.trim() }
        if (cells.size < 3 || cells[0] == "entity" || cells[0].startsWith("---") || cells[0] != entity) continue
        byCommit.getOrPut(cells[1]) { ArrayList() }.add(cells[2])
      }
    }
    val groups = byCommit.entries.map { (commit, files) ->
      "{\"commit\":${q(commit)},\"files\":[${files.joinToString(",") { q(it) }}]}"
    }
    return "{\"entity\":${q(entity)},\"changes\":[${groups.joinToString(",")}]}"
  }

  // ASRs (concepts subtype asr) with the ADRs each drives, plus `undriven`: every
  // ADR that no ASR drives, so the view lists all `adrCount` ADRs. `superseded`
  // marks an ADR that is the `to` of a supersedes edge. count is all ASRs+ADRs.
  // Mirrors implementation-zero's /api/asradr.
  fun asradrJson(g: Graph): String {
    val drives = g.edges.filter { it.kind == "drives" }
    val superseded = g.edges.filter { it.kind == "supersedes" }.map { stripType(it.to) }.toSet()
    fun adrRow(w: Entity) = "{\"id\":${q(w.id)},\"review\":${q(w.review)},\"superseded\":${w.id in superseded}}"
    val asrList = g.entities.filter { it.entityType == "concept" && it.subtype == "asr" }
    val asrIds = asrList.map { it.id }.toSet()
    val asrs = asrList.map { a ->
      val adrs = drives.filter { stripType(it.from) == a.id }.mapNotNull { g.byId[stripType(it.to)] }
        .joinToString(",") { adrRow(it) }
      "{\"id\":${q(a.id)},\"label\":${q(a.title ?: a.id)},\"review\":${q(a.review)},\"adrs\":[$adrs]}"
    }
    val driven = drives.filter { stripType(it.from) in asrIds }.map { stripType(it.to) }.toSet()
    val allAdrs = g.entities.filter { it.entityType == "waypoint" && it.subtype == "adr" }
    val undriven = allAdrs.filter { it.id !in driven }.joinToString(",") { adrRow(it) }
    return "{\"count\":${asrs.size + allAdrs.size},\"adrCount\":${allAdrs.size}," +
      "\"asrs\":[${asrs.joinToString(",")}],\"undriven\":[$undriven]}"
  }
}
