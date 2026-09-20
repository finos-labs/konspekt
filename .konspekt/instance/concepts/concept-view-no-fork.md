```yaml
id: concept-view-no-fork
subtype: asr
label: One view across all surfaces
aliases: [shared view no fork, one HTML view behind a transport adapter, disposition must not drift]
review: accepted
provenance:
  sourceRef: f02d18ef587d9270ee87345d74834b74c21236f7
  contentHash: f02d18ef587d9270ee87345d74834b74c21236f7
  timestamp: 2026-09-20T12:00:00Z
  conversationId: intellij-plugin
  confidence: 0.8
createdAt: 2026-09-20T12:00:00Z
updatedAt: 2026-09-20T12:00:00Z
```
# Concept: One view across all surfaces

The konspekt HTML view and its disposition logic are a single implementation
shared by every shell — the local `implementation_zero` window, the IntelliJ
plugin, and the `ui://` card — behind a transport adapter, never forked per
surface. A shell may vary only its transport (local HTTP/SSE, an in-process JVM
server, or host tool calls); it may not vary the view or its accept/reject
semantics.

This is architecturally significant because it is the constraint every shell
decision answers to: if the view or its disposition logic forked, accept would
mean something different on different surfaces. Its significance is carried by
the `drives` edge to each ADR it forces, not by a stored flag. It generalizes
[[nw-one-view-two-transports]] from a two-transport observation into the
requirement that holds across all surfaces.
