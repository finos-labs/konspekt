```yaml
id: nw-jcef-no-js-dialogs
kind: constraint
review: proposed
provenance:
  sourceRef: 0508aa2acf48b1f31daafe98a465f29f3a00a487
  contentHash: 0508aa2acf48b1f31daafe98a465f29f3a00a487
  timestamp: 2026-09-20T19:00:00Z
  conversationId: ui-simple-actions
  confidence: 0.85
createdAt: 2026-09-20T19:00:00Z
updatedAt: 2026-09-20T19:00:00Z
```
# Noteworthy: The plugin's JCEF browser has no JS-dialog handler

`window.confirm()`, `window.alert()`, and `window.prompt()` do not work in the
IntelliJ JCEF browser: with no `CefJSDialogHandler` installed, the calls silently
return (confirm/prompt return false/null) and no dialog appears. The same code
works in Electron and a plain browser, so the failure is invisible until the view
runs inside the plugin — the Accept button appeared to do nothing there while the
resize worked.

Because the view is shared across all surfaces ([[concept-view-no-fork]]), it must
not depend on any surface-specific browser API. Confirmations and messages are
built in the DOM (an inline confirm, an inline error line), never as native
dialogs. Applies to any future UI action ([[task-ui-simple-actions]]).
