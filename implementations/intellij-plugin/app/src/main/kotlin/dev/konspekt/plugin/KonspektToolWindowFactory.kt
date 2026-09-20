package dev.konspekt.plugin

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import javax.swing.JLabel

/**
 * The konspekt tool window: a JCEF browser rendering the shared view served by an
 * in-process HTTP/SSE server ([ViewServer]) over the open project's instance.
 * Third shell behind the same view (ASR: one view across surfaces).
 */
class KonspektToolWindowFactory : ToolWindowFactory {
  override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
    val contentFactory = ContentFactory.getInstance()

    if (!JBCefApp.isSupported()) {
      val label = JLabel("JCEF is not available in this IDE runtime; the konspekt view needs it.")
      toolWindow.contentManager.addContent(contentFactory.createContent(label, "", false))
      return
    }

    val server = ViewServer(project)
    val url = server.start()
    val browser = JBCefBrowser(url)

    val content = contentFactory.createContent(browser.component, "", false)
    // Stop the in-process server and dispose the browser when the tool window closes.
    content.setDisposer {
      server.stop()
      browser.dispose()
    }
    toolWindow.contentManager.addContent(content)
  }
}
