package dev.konspekt.plugin

import com.intellij.openapi.project.Project
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import java.util.concurrent.Executors

/**
 * In-process HTTP/SSE server for the tool window's JCEF browser. It serves the
 * shared view assets (copied from implementation_zero at build time) and the same
 * JSON endpoints the view expects, so the view is reused byte-for-byte.
 *
 * INCREMENT 1: assets are served and the data endpoints return an empty snapshot,
 * so the view renders (styled, "0 entities"). INCREMENT 2 will back the endpoints
 * with a Kotlin reader over [project]'s .konspekt/instance and a VFS listener.
 */
class ViewServer(private val project: Project) {
  private var server: HttpServer? = null

  fun start(): String {
    val s = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    s.executor = Executors.newCachedThreadPool { r -> Thread(r, "konspekt-view-server").apply { isDaemon = true } }

    s.createContext("/api/") { ex ->
      // Increment 1 stubs; increment 2 replaces these with the Kotlin reader.
      val body = when {
        ex.requestURI.path.startsWith("/api/entities") -> """{"cursor":"0","rows":[],"counts":null,"error":null}"""
        ex.requestURI.path.startsWith("/api/stats") -> """{"total":0,"edges":0,"accepted":0,"proposed":0,"byKind":[],"oldest":[]}"""
        ex.requestURI.path.startsWith("/api/goals") -> "[]"
        else -> """{"error":"not implemented in increment 1"}"""
      }
      sendJson(ex, body)
    }

    s.createContext("/events") { ex ->
      ex.responseHeaders.add("Content-Type", "text/event-stream")
      ex.responseHeaders.add("Cache-Control", "no-cache")
      ex.sendResponseHeaders(200, 0)
      ex.responseBody.write("event: change\ndata: {\"cursor\":\"0\"}\n\n".toByteArray())
      ex.responseBody.flush()
      // Left open; increment 2 pushes a fresh cursor on each VFS change.
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
    return "http://127.0.0.1:${s.address.port}/"
  }

  fun stop() { server?.stop(0); server = null }

  private fun sendJson(ex: HttpExchange, body: String) {
    val bytes = body.toByteArray()
    ex.responseHeaders.add("Content-Type", "application/json; charset=utf-8")
    ex.responseHeaders.add("Cache-Control", "no-store")
    ex.sendResponseHeaders(200, bytes.size.toLong())
    ex.responseBody.use { it.write(bytes) }
  }

  private fun contentType(path: String) = when {
    path.endsWith(".html") -> "text/html; charset=utf-8"
    path.endsWith(".css") -> "text/css; charset=utf-8"
    path.endsWith(".js") -> "text/javascript; charset=utf-8"
    path.endsWith(".svg") -> "image/svg+xml"
    else -> "application/octet-stream"
  }
}
