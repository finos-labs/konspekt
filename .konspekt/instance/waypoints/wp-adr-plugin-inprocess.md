```yaml
id: wp-adr-plugin-inprocess
kind: decision
subtype: adr
timestamp: 2026-09-20T12:00:00Z
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
# Waypoint: IntelliJ plugin renders the shared view in-process (Option B)

The IntelliJ plugin ([[task-intellij-plugin]]) renders the shared view in a JCEF
tool window backed **in-process** by a Kotlin reader — not by an external Node
server. Option A (JCEF pointed at `implementation_zero`'s running Node server) was
rejected as effectively the already-built "run Node outside the IDE" path.

The transport between JCEF and the plugin is an in-process JVM HTTP/SSE server
(the JDK's `com.sun.net.httpserver`, zero extra dependencies), so the shared view
is reused byte-for-byte, copied from `implementation-zero` at build time — the
strongest guarantee of [[concept-view-no-fork]]. The minimum supported IDE is
2026.2 (build 262), built against the local install because Community 2026.2 is
not a downloadable SDK.

The decision statement is this body; its force is the inbound `drives` edge from
[[concept-view-no-fork]], and its consequences are the plugin project under
`implementations/intellij-plugin/` and its Kotlin reader — the project's second
independent implementation of the serialization ([[task-second-implementer]]).
