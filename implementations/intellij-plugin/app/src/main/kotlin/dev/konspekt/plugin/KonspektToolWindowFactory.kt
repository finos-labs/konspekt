package dev.konspekt.plugin

import com.intellij.icons.AllIcons
import com.intellij.ide.util.PropertiesComponent
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.ToggleAction
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.popup.JBPopupFactory
import com.intellij.openapi.ui.popup.JBPopupListener
import com.intellij.openapi.ui.popup.LightweightWindowEvent
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import java.awt.Dimension
import javax.swing.JLabel

private const val POPUP_ON_OPEN = "konspekt.popupOnOpen"

/**
 * The konspekt tool window: a JCEF browser on the in-process [ViewServer].
 *
 * Popup mode (task-plugin-pop-mode, exploratory): a title action pops the same
 * view into a floating, resizable window (a second JCEF browser on the same
 * localhost URL), and a persisted toggle opens that popup automatically on open.
 * Both frames render the one shared view (concept-view-no-fork).
 */
class KonspektToolWindowFactory : ToolWindowFactory {
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
    val content = contentFactory.createContent(browser.component, "", false)
    content.setDisposer { server.stop(); browser.dispose() }
    toolWindow.contentManager.addContent(content)

    toolWindow.setTitleActions(listOf(
      object : AnAction("Open in Floating Window", "Show the konspekt view in a floating popup", AllIcons.Actions.MoveToWindow) {
        override fun getActionUpdateThread() = ActionUpdateThread.EDT
        override fun actionPerformed(e: AnActionEvent) = openPopup(project, url)
      },
      object : ToggleAction("Pop Out on Open", "Open the floating window automatically when this tool window opens", AllIcons.General.Pin) {
        override fun getActionUpdateThread() = ActionUpdateThread.EDT
        override fun isSelected(e: AnActionEvent) = PropertiesComponent.getInstance().getBoolean(POPUP_ON_OPEN, false)
        override fun setSelected(e: AnActionEvent, state: Boolean) = PropertiesComponent.getInstance().setValue(POPUP_ON_OPEN, state)
      },
    ))

    if (PropertiesComponent.getInstance().getBoolean(POPUP_ON_OPEN, false)) openPopup(project, url)
  }

  private fun openPopup(project: Project, url: String) {
    val popupBrowser = JBCefBrowser(url)
    popupBrowser.component.preferredSize = Dimension(480, 760)
    val popup = JBPopupFactory.getInstance()
      .createComponentPopupBuilder(popupBrowser.component, popupBrowser.component)
      .setTitle("konspekt")
      .setResizable(true)
      .setMovable(true)
      .setRequestFocus(true)
      .setDimensionServiceKey(project, "konspekt.popup", false)
      .createPopup()
    popup.addListener(object : JBPopupListener {
      override fun onClosed(event: LightweightWindowEvent) { popupBrowser.dispose() }
    })
    popup.showCenteredInCurrentWindow(project)
  }
}
