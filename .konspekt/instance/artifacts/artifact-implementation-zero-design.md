```yaml
id: artifact-implementation-zero-design
name: implementation_zero design
kind: doc
location: implementations/implementation-zero/docs/DESIGN.md
review: accepted
provenance:
  sourceRef: ni:///sha-256;_buRW-o9SfAor0TAC3LRVpiLDOysXzAGR-R06aDvXNU
  timestamp: 2026-09-19T13:00:00Z
  conversationId: app-design-101
  confidence: 0.8
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: db06867ee38876760cf3b6f2ab565ebb688a3cfd
    contentHash: db06867ee38876760cf3b6f2ab565ebb688a3cfd
createdAt: 2026-09-19T13:00:00Z
updatedAt: 2026-09-19T13:00:00Z
```
# Artifact: implementation_zero design

Design doc for the first konspekt UI implementation, at
`implementations/implementation-zero/docs/DESIGN.md`, with `architecture.svg` and
its raster export `architecture.png` beside it. Names the shell-agnostic core
(the filesystem watcher plus the localhost HTTP/SSE server) and the always-on-top
Electron shell, and records the read-only and local-only scope boundaries.

Produced by [[task-implementation-zero]]. Non-normative, like
[[artifact-ui-design]]: `spec/` governs on any conflict. The PNG is a 2x raster
export of the SVG and is regenerated from it rather than hand-edited.
