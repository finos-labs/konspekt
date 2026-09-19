```yaml
id: nw-implementations-directory
kind: decision
review: accepted
provenance:
  sourceRef: db06867ee38876760cf3b6f2ab565ebb688a3cfd
  contentHash: db06867ee38876760cf3b6f2ab565ebb688a3cfd
  timestamp: 2026-09-19T13:00:00Z
  conversationId: app-design-101
  confidence: 0.8
createdAt: 2026-09-19T13:00:00Z
updatedAt: 2026-09-19T13:00:00Z
```
# Noteworthy: implementations live under /implementations/[name]/{docs,app}

The konspekt UI implementations live in a repo-root `implementations/` directory,
one subdirectory per implementation, each holding `docs/` (design docs and
diagrams) and `app/` (implementation code). The first resident is
`implementation-zero/` ([[task-implementation-zero]]); the IntelliJ plugin
([[task-intellij-plugin]]) and enterprise persistence
([[task-enterprise-persistence]]) are planned as sibling directories under the
same convention.

This is repo layout, not the standard: `spec/` owns the data model and transport
contract, and nothing under `implementations/` constrains another implementer.
The layout sits beside the existing repo surfaces (`spec/`, `setup/`,
`distribution/`, `.konspekt/`) recorded in `AGENTS.md`.
