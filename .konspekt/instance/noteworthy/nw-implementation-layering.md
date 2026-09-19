```yaml
id: nw-implementation-layering
kind: decision
review: accepted
provenance:
  sourceRef: db06867ee38876760cf3b6f2ab565ebb688a3cfd
  contentHash: db06867ee38876760cf3b6f2ab565ebb688a3cfd
  timestamp: 2026-09-19T12:00:00Z
  conversationId: app-design-101
  confidence: 0.7
createdAt: 2026-09-19T12:00:00Z
updatedAt: 2026-09-19T12:00:00Z
```
# Noteworthy: Ship the UI in three local-first layers before enterprise

The konspekt UI application is built in an ordered sequence, each layer reusing
the one HTML view behind a transport adapter ([[nw-one-view-two-transports]])
and adding one capability:

1. **Local read-only** ([[task-implementation-zero]]) — a standalone process
   watches the working tree and renders the view; no writes.
2. **Local read/write in the IDE** ([[task-intellij-plugin]]) — an IntelliJ
   plugin renders the same view in a tool window and calls the write path
   in-process, so disposition and the authority verbs work locally.
3. **Enterprise** ([[task-enterprise-persistence]]) — a document or relational
   backend behind the storage interface and a hosted server, deferred until the
   two local layers exist.

The order is local-first because the local shells need no host cooperation, no
tunnel, and no hosted deployment, and because a read-only reflector is the
smallest surface that delivers value while leaving `propose→accept` trivially
intact. Enterprise last because it is the only layer that adds transport and
persistence work the local layers do not require.
