```yaml
id: nw-backend-is-mcp-client-on-web
kind: constraint
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  timestamp: 2026-09-14T16:00:00Z
  conversationId: app-design-101
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Noteworthy: On the web path the host backend is the MCP client

For a remote connector on a hosted chat surface, the MCP client is the vendor's
backend, not the browser page. Tool calls and `ui://` resource reads both leave
the vendor's infrastructure, and the rendered HTML is handed down to the browser
over the ordinary chat connection.

Two consequences. The konspekt server must be reachable from the vendor backend,
which rules out localhost for that path and forces a tunnel or a hosted
deployment. And anything the rendered card does travels back up through the host
as a tool call, because the page has no route to the server and no credentials
for it. The local shell and the IDE are the opposite case.
