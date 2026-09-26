package dev.konspekt.plugin

import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFileManager
import com.intellij.openapi.vfs.newvfs.BulkFileListener
import com.intellij.openapi.vfs.newvfs.events.VFileEvent
import com.intellij.util.messages.MessageBusConnection
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpServer
import java.io.File
import java.io.IOException
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.URLDecoder
import java.util.Collections
import java.util.concurrent.Executors

/**
 * In-process HTTP/SSE server for the tool window's JCEF browser. Serves the shared
 * view assets (copied from implementation_zero at build time) and the same JSON
 * endpoints the view expects, backed by [InstanceReader] over the open project's
 * .konspekt/instance. The writes are POST /api/accept (propose -> accept) and POST
 * /api/resolve (the `resolve` authority verb, status -> resolved on a node) — human
 * dispositions, working-tree only. A VFS listener pushes a fresh cursor over SSE on
 * each change under the instance, so the view refreshes live.
 */
class ViewServer(private val project: Project) {
  private var server: HttpServer? = null
  private var vfs: MessageBusConnection? = null
  private val clients = Collections.synchronizedSet(HashSet<OutputStream>())
  @Volatile private var cursor: String = "0"
  private var seq = 0L

  private fun instanceDir(): File? {
    val base = project.basePath ?: return null
    val dir = File(base, ".konspekt/instance")
    return if (dir.isDirectory) dir else null
  }

  fun start(): String {
    val s = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    s.executor = Executors.newCachedThreadPool { r -> Thread(r, "konspekt-view-server").apply { isDaemon = true } }

    s.createContext("/api/") { ex ->
      val dir = instanceDir()
      if (dir == null) { sendJson(ex, "{\"error\":\"no .konspekt/instance in the open project\"}"); return@createContext }
      val g = try { InstanceReader.load(dir) } catch (e: Exception) {
        sendJson(ex, "{\"error\":${jsonStr(e.message ?: "load failed")}}"); return@createContext
      }
      val path = ex.requestURI.path
      // Writes: accept a proposed entity, or resolve a work node (human
      // dispositions). POST only.
      if (path.startsWith("/api/accept")) {
        if (ex.requestMethod != "POST") { ex.sendResponseHeaders(405, -1); ex.close(); return@createContext }
        val result = InstanceReader.acceptEntity(dir, g, param(ex, "entity") ?: "")
        cursor = "${System.currentTimeMillis()}-${++seq}"; notifyClients()
        sendJson(ex, result); return@createContext
      }
      if (path.startsWith("/api/resolve")) {
        if (ex.requestMethod != "POST") { ex.sendResponseHeaders(405, -1); ex.close(); return@createContext }
        val result = InstanceReader.resolveEntity(dir, g, param(ex, "entity") ?: "")
        cursor = "${System.currentTimeMillis()}-${++seq}"; notifyClients()
        sendJson(ex, result); return@createContext
      }
      val json = when {
        path.startsWith("/api/entities") -> InstanceReader.entitiesJson(g, cursor)
        path.startsWith("/api/stats")    -> InstanceReader.statsJson(g)
        path.startsWith("/api/goals")    -> InstanceReader.goalsJson(g)
        path.startsWith("/api/graph")    -> InstanceReader.graphJson(g, param(ex, "goal") ?: "")
        path.startsWith("/api/entity")   -> InstanceReader.entityJson(g, dir, param(ex, "id") ?: "")
        path.startsWith("/api/source")   -> InstanceReader.sourceJson(dir, param(ex, "ref") ?: "")
        path.startsWith("/api/commands") -> InstanceReader.commandsJson(dir, param(ex, "entity") ?: "")
        path.startsWith("/api/changes")  -> InstanceReader.changesJson(dir, param(ex, "entity") ?: "")
        path.startsWith("/api/asradr")   -> InstanceReader.asradrJson(g)
        else -> "{\"error\":\"not found\"}"
      }
      sendJson(ex, json)
    }

    s.createContext("/events") { ex ->
      ex.responseHeaders.add("Content-Type", "text/event-stream")
      ex.responseHeaders.add("Cache-Control", "no-cache")
      ex.sendResponseHeaders(200, 0)
      val out = ex.responseBody
      try { out.write(event(cursor)); out.flush(); clients.add(out) }
      catch (e: IOException) { runCatching { out.close() } }
    }

    s.createContext("/") { ex ->
      val rel = if (ex.requestURI.path == "/" || ex.requestURI.path == "/view") "/view/index.html"
      else "/view" + ex.requestURI.path
      val bytes = javaClass.getResourceAsStream(rel)?.readBytes()
      if (bytes == null) { ex.sendResponseHeaders(404, -1); ex.close(); return@createContext }
      ex.responseHeaders.add("Content-Type", contentType(rel))
      ex.sendResponseHeaders(200, bytes.size.toLong())
      ex.responseBody.use { it.write(bytes) }
    }

    s.start()
    server = s

    // Live refresh: bump the cursor and notify SSE clients when files under the
    // instance change (the IDE VFS is the plugin's change source).
    val base = project.basePath?.replace('\\', '/')
    if (base != null) {
      val conn = project.messageBus.connect()
      conn.subscribe(VirtualFileManager.VFS_CHANGES, object : BulkFileListener {
        override fun after(events: List<VFileEvent>) {
          val hit = events.any { it.path.replace('\\', '/').contains("$base/.konspekt/instance/") }
          if (hit) { cursor = "${System.currentTimeMillis()}-${++seq}"; notifyClients() }
        }
      })
      vfs = conn
    }

    return "http://127.0.0.1:${s.address.port}/"
  }

  fun stop() {
    vfs?.disconnect(); vfs = null
    synchronized(clients) { clients.forEach { runCatching { it.close() } }; clients.clear() }
    server?.stop(0); server = null
  }

  private fun notifyClients() {
    val line = event(cursor)
    synchronized(clients) {
      val dead = ArrayList<OutputStream>()
      for (out in clients) try { out.write(line); out.flush() } catch (e: IOException) { dead.add(out) }
      clients.removeAll(dead.toSet())
    }
  }

  private fun event(c: String) = "event: change\ndata: {\"cursor\":\"$c\"}\n\n".toByteArray()

  private fun param(ex: HttpExchange, key: String): String? {
    val qs = ex.requestURI.query ?: return null
    for (p in qs.split("&")) {
      val i = p.indexOf('='); if (i < 0) continue
      if (p.substring(0, i) == key) return URLDecoder.decode(p.substring(i + 1), "UTF-8")
    }
    return null
  }

  private fun sendJson(ex: HttpExchange, body: String) {
    val bytes = body.toByteArray()
    ex.responseHeaders.add("Content-Type", "application/json; charset=utf-8")
    ex.responseHeaders.add("Cache-Control", "no-store")
    ex.sendResponseHeaders(200, bytes.size.toLong())
    ex.responseBody.use { it.write(bytes) }
  }

  private fun jsonStr(s: String): String {
    val b = StringBuilder("\"")
    for (c in s) when (c) { '\\' -> b.append("\\\\"); '"' -> b.append("\\\""); '\n' -> b.append("\\n"); '\r' -> b.append("\\r"); '\t' -> b.append("\\t"); else -> if (c < ' ') b.append("\\u%04x".format(c.code)) else b.append(c) }
    return b.append("\"").toString()
  }

  private fun contentType(path: String) = when {
    path.endsWith(".html") -> "text/html; charset=utf-8"
    path.endsWith(".css") -> "text/css; charset=utf-8"
    path.endsWith(".js") -> "text/javascript; charset=utf-8"
    path.endsWith(".svg") -> "image/svg+xml"
    else -> "application/octet-stream"
  }
}
