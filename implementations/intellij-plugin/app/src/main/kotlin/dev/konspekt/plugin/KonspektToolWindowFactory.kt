package dev.konspekt.plugin

import com.intellij.icons.AllIcons
import com.intellij.ide.util.PropertiesComponent
import com.intellij.openapi.Disposable
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.DefaultActionGroup
import com.intellij.openapi.actionSystem.ToggleAction
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.FrameWrapper
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.openapi.wm.ex.ToolWindowManagerListener
import com.intellij.ui.content.ContentFactory
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ide.BrowserUtil
import com.intellij.ui.jcef.JBCefBrowser
import org.cef.browser.CefBrowser
import org.cef.browser.CefFrame
import org.cef.handler.CefLifeSpanHandlerAdapter
import org.cef.handler.CefRequestHandlerAdapter
import org.cef.network.CefRequest
import java.awt.BorderLayout
import java.awt.Dimension
import javax.swing.JLabel
import javax.swing.JPanel

private const val POPUP_ON_OPEN = "konspekt.popupOnOpen"

/**
 * The konspekt tool window: a JCEF browser on the in-process [ViewServer].
 *
 * Popup mode (task-plugin-pop-mode, exploratory): a title action detaches the
 * same view into a real floating window (a [FrameWrapper], so it carries native
 * minimize/maximize/close and a remembered size) and hides the docked window,
 * so the user sees one UI, not two. A persisted toggle repeats that on every
 * open. Because that auto-pop hides the docked window before its title actions
 * can be reached, the floating window carries its own toolbar with a Dock
 * button and the same toggle, so there is always a way back to the docked view.
 * Both frames render the one shared view (concept-view-no-fork).
 */
class KonspektToolWindowFactory : ToolWindowFactory {
  private var frame: FrameWrapper? = null

  override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
    val contentFactory = ContentFactory.getInstance()
    if (!JBCefApp.isSupported()) {
      toolWindow.contentManager.addContent(
        contentFactory.createContent(JLabel("JCEF is not available in this IDE runtime; the konspekt view needs it."), "", false))
      return
    }

    val server = ViewServer(project)
    val url = server.start()
    val browser = JBCefBrowser(url)
    openExternalLinksInSystemBrowser(browser, url)
    val content = contentFactory.createContent(browser.component, "", false)
    content.setDisposer { server.stop(); browser.dispose() }
    toolWindow.contentManager.addContent(content)

    toolWindow.setTitleActions(listOf(
      object : AnAction("Open in Floating Window", "Show the konspekt view in a floating window", AllIcons.Actions.MoveToWindow) {
        override fun getActionUpdateThread() = ActionUpdateThread.EDT
        override fun actionPerformed(e: AnActionEvent) = popOut(project, toolWindow, url)
      },
      popOutOnOpenToggle(),
    ))

    // createToolWindowContent runs only once (the content is cached), so the
    // "Pop Out on Open" toggle cannot be honored from here — it would fire at
    // most once per IDE session. Re-evaluate it on every show instead.
    project.messageBus.connect(toolWindow.disposable).subscribe(
      ToolWindowManagerListener.TOPIC,
      object : ToolWindowManagerListener {
        override fun toolWindowShown(shown: ToolWindow) {
          if (shown === toolWindow && PropertiesComponent.getInstance().getBoolean(POPUP_ON_OPEN, false)) {
            popOut(project, toolWindow, url)
          }
        }
      })
  }

  private fun popOutOnOpenToggle() =
    object : ToggleAction("Pop Out on Open", "Open the floating window automatically when this tool window opens", AllIcons.General.Pin) {
      override fun getActionUpdateThread() = ActionUpdateThread.EDT
      override fun isSelected(e: AnActionEvent) = PropertiesComponent.getInstance().getBoolean(POPUP_ON_OPEN, false)
      override fun setSelected(e: AnActionEvent, state: Boolean) = PropertiesComponent.getInstance().setValue(POPUP_ON_OPEN, state)
    }

  /**
   * Detach the view into a single floating window and hide the docked tool
   * window, so the user sees one UI, not two. A call while the window is already
   * open just re-hides the docked window and raises the floating one.
   */
  private fun popOut(project: Project, toolWindow: ToolWindow, url: String) {
    frame?.let { toolWindow.hide(); return }

    val popupBrowser = JBCefBrowser(url)
    openExternalLinksInSystemBrowser(popupBrowser, url)

    // Dock button turns off auto-pop and returns to the docked tool window —
    // the only way back once the docked title actions are out of reach.
    val group = DefaultActionGroup()
    group.add(object : AnAction("Dock", "Turn off pop-out and return to the docked tool window", AllIcons.General.CollapseComponent) {
      override fun getActionUpdateThread() = ActionUpdateThread.EDT
      override fun actionPerformed(e: AnActionEvent) {
        PropertiesComponent.getInstance().setValue(POPUP_ON_OPEN, false)
        frame?.close()
        toolWindow.show(null)
      }
    })
    group.add(popOutOnOpenToggle())
    val toolbar = ActionManager.getInstance().createActionToolbar("KonspektPopup", group, true)

    val panel = JPanel(BorderLayout())
    toolbar.targetComponent = panel
    panel.add(toolbar.component, BorderLayout.NORTH)
    panel.add(popupBrowser.component, BorderLayout.CENTER)
    panel.preferredSize = Dimension(480, 760)

    val w = FrameWrapper(project, dimensionKey = "konspekt.popup", isDialog = false, title = "konspekt", component = panel)
    Disposer.register(w, Disposable { popupBrowser.dispose(); frame = null })
    frame = w
    w.show()
    toolWindow.hide()
  }
}

/**
 * Send http(s) links in the shared view to the system browser.
 *
 * The view marks external links (a store location, an origin locator) with
 * `target="_blank"`. JCEF handles that as a popup and, with no handler, opens
 * it in a new bare Chromium window. The life-span handler cancels the popup and
 * hands the URL to [BrowserUtil]. The request handler does the same for a
 * user-initiated top-level navigation away from the view server's origin, so a
 * link without a target does not replace the view.
 */
private fun openExternalLinksInSystemBrowser(browser: JBCefBrowser, viewUrl: String) {
  val viewOrigin = originOf(viewUrl)
  fun isExternal(target: String?): Boolean {
    if (target == null) return false
    val scheme = target.substringBefore(':', "").lowercase()
    return (scheme == "http" || scheme == "https") && originOf(target) != viewOrigin
  }
  val client = browser.jbCefClient
  client.addLifeSpanHandler(object : CefLifeSpanHandlerAdapter() {
    override fun onBeforePopup(b: CefBrowser?, frame: CefFrame?, targetUrl: String?, targetFrameName: String?): Boolean {
      if (isExternal(targetUrl)) BrowserUtil.browse(targetUrl!!)
      return true // never open a JCEF popup window
    }
  }, browser.cefBrowser)
  client.addRequestHandler(object : CefRequestHandlerAdapter() {
    override fun onBeforeBrowse(b: CefBrowser?, frame: CefFrame?, request: CefRequest?, userGesture: Boolean, isRedirect: Boolean): Boolean {
      val target = request?.url
      if (userGesture && frame?.isMain == true && isExternal(target)) {
        BrowserUtil.browse(target!!)
        return true
      }
      return false
    }
  }, browser.cefBrowser)
}

private fun originOf(url: String): String =
  try { java.net.URI(url).let { "${it.scheme}://${it.authority}".lowercase() } } catch (_: Exception) { "" }
