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

  // Parse the fenced ```yaml front-matter into a flat map, nesting one level as
  // "parent.key" (summary.updatedAt, provenance.timestamp, ...). Enough for the
  // fields the view needs; folded/literal block scalars are skipped.
  private fun parseFront(text: String): Map<String, String> {
    val t = text.replace("\r\n", "\n").trimStart()
    val fence = Regex("(?s)^```ya?ml\\n(.*?)\\n```").find(t) ?: return emptyMap()
    val out = HashMap<String, String>()
    var parent: String? = null
    for (raw in fence.groupValues[1].split("\n")) {
      if (raw.isBlank() || raw.trim().startsWith("#")) continue
      val indent = raw.length - raw.trimStart().length
      val m = KV.find(raw.trim()) ?: continue
      val key = m.groupValues[1]; val rest = m.groupValues[2]
      if (indent == 0) {
        if (rest.isEmpty() || rest == ">" || rest == ">-" || rest == "|" || rest == "|-") parent = key
        else { out[key] = stripQuotes(rest); parent = null }
      } else if (parent != null && rest.isNotEmpty()) {
        out["$parent.$key"] = stripQuotes(rest)
      }
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
    return "{\"id\":${q(e.id)},\"file\":${q(e.file)},\"markdown\":${q(f.readText())},\"review\":${q(e.review)},\"status\":${q(e.status)},\"entityType\":${q(e.entityType)},\"sourceRef\":${q(e.sourceRef)},\"contentHash\":${q(e.contentHash)}}"
  }

  // Two-way auto-accept every proposed edge touching `id` whose other endpoint is
  // also accepted (the just-dispositioned id counts as accepted). Mirrors the
  // implementation-zero server. Returns the number of edge rows changed.
  private fun autoAcceptEdges(instanceDir: File, g: Graph, id: String): Int {
    val edgesFile = File(File(instanceDir, "edges"), "edges.md")
    if (!edgesFile.isFile) return 0
    var edgesChanged = 0
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
      edgesChanged++
      "| ${cells[0]} | ${cells[1]} | $from | $to | ${cells[4]} | accepted |"
    }
    if (edgesChanged > 0) edgesFile.writeText(out.joinToString("\n"))
    return edgesChanged
  }

  // A human disposition from the UI: accept a proposed entity — flip its review
  // proposed -> accepted in the working tree, then two-way auto-accept its now-
  // both-accepted edges. Working-tree only; no git commit. Idempotent.
  fun acceptEntity(instanceDir: File, g: Graph, id: String): String {
    val e = g.byId[id] ?: return "{\"error\":\"no such entity\"}"
    val f = File(instanceDir, e.file)
    if (!f.isFile) return "{\"error\":\"file missing\"}"
    val txt = f.readText()
    val flipped = txt.replace(Regex("(?m)^review:[ \\t]*proposed[ \\t]*$"), "review: accepted")
    if (flipped != txt) f.writeText(flipped)
    return "{\"entity\":${q(id)},\"accepted\":true,\"edges\":${autoAcceptEdges(instanceDir, g, id)}}"
  }

  // A human authority verb from the UI: resolve a work node -> status: resolved in
  // the working tree (spec/data-model: `resolve <node>` sets status -> resolved).
  // A human verb carries its own acceptance, so a still-proposed node is also
  // flipped review -> accepted, with the same two-way edge auto-accept. Nodes only;
  // a no-op success on a node already resolved; refused on an abandoned node.
  // Working-tree only; no git commit. Mirrors the implementation-zero server.
  fun resolveEntity(instanceDir: File, g: Graph, id: String): String {
    val e = g.byId[id] ?: return "{\"error\":\"no such entity\"}"
    if (e.entityType != "node") return "{\"error\":\"resolve applies to work nodes only\"}"
    val f = File(instanceDir, e.file)
    if (!f.isFile) return "{\"error\":\"file missing\"}"
    if (e.status == "resolved") return "{\"entity\":${q(id)},\"resolved\":true,\"accepted\":false,\"edges\":0}"
    if (e.status == "abandoned") return "{\"error\":\"an abandoned node cannot be resolved\"}"
    var txt = f.readText()
    val withStatus = txt.replace(Regex("(?m)^status:[ \\t]*(?:open|active)[ \\t]*$"), "status: resolved")
    if (withStatus == txt) return "{\"error\":\"no open or active status line to resolve\"}"
    txt = withStatus
    var accepted = false
    if (e.review == "proposed") { txt = txt.replace(Regex("(?m)^review:[ \\t]*proposed[ \\t]*$"), "review: accepted"); accepted = true }
    f.writeText(txt)
    val edges = if (accepted) autoAcceptEdges(instanceDir, g, id) else 0
    return "{\"entity\":${q(id)},\"resolved\":true,\"accepted\":$accepted,\"edges\":$edges}"
  }

  fun sourceJson(instanceDir: File, ref: String): String {
    if (!Regex("^[0-9a-f]{7,64}$").matches(ref)) return "{\"error\":\"bad ref\"}"
    val f = File(File(instanceDir, "sources"), "$ref.md")
    if (!f.isFile) return "{\"error\":\"no such source\"}"
    return "{\"ref\":${q(ref)},\"markdown\":${q(f.readText())}}"
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
        val cf = File(File(instanceDir, "commands"), "$hash.md")
        val md = if (cf.isFile) cf.readText() else "(command text missing)"
        rows.add("{\"command\":${q(hash)},\"markdown\":${q(md)}}")
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

  // ASRs (concepts subtype asr) with the ADRs each drives; count is all ASRs+ADRs.
  fun asradrJson(g: Graph): String {
    val drives = g.edges.filter { it.kind == "drives" }
    val asrs = g.entities.filter { it.entityType == "concept" && it.subtype == "asr" }.map { a ->
      val adrs = drives.filter { stripType(it.from) == a.id }.mapNotNull { g.byId[stripType(it.to)] }
        .joinToString(",") { "{\"id\":${q(it.id)},\"review\":${q(it.review)}}" }
      "{\"id\":${q(a.id)},\"label\":${q(a.title ?: a.id)},\"review\":${q(a.review)},\"adrs\":[$adrs]}"
    }
    val adrCount = g.entities.count { it.entityType == "waypoint" && it.subtype == "adr" }
    return "{\"count\":${asrs.size + adrCount},\"asrs\":[${asrs.joinToString(",")}]}"
  }
}
