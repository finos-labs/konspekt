```yaml
id: task-mcp-app-surface
type: task
title: Serve the konspekt view as an MCP Apps ui:// resource
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-14T16:00:00Z
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  conversationId: app-design-101
  timestamp: 2026-09-14T16:00:00Z
  confidence: 0.6
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Task: Serve the konspekt view as an MCP Apps ui:// resource

A konspekt MCP server that answers tools and serves the view as a `ui://`
resource under the `io.modelcontextprotocol/ui` extension, so the queue renders
inline in the conversation where the human already works. The card appears where
the tool result would sit, bound to the state of that call, and an older card in
the scrollback shows older state.

Constraints to design against: the extension is bilateral and opt-in, so a host
that does not negotiate it gets text with no error anywhere, which reads as a
broken view; the iframe runs a deny-by-default CSP, so the HTML must be a single
bundled file or declare origins through `_meta.ui.csp`; and rendering is not
universal — JetBrains is absent from the client matrix, so the IDE session falls
back to text.

The text fallback is therefore part of the deliverable, not a degraded mode.

Success: the same view renders as a card in a host that supports the extension,
and the text fallback carries the queue usefully in one that does not.
