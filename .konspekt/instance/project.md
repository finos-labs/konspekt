```yaml
id: project-konspekt
goal: >-
  A portable, human-readable record of a project's evolving state across
  generative-AI conversations and platforms.
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-06-21T13:00:00Z
personas: [engineer]
binding: required
basis: accepted
references: ni
store:
  kind: git
  ref: main
  resolve:
    source: https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/sources/sha-256/{hex}.md
    command: https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/commands/sha-256/{hex}.md
    entity: https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/{path}
    edges: https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/edges/edges.md
    checkpoints: https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/checkpoints/checkpoints.md
locators:
  allow: []
createdAt: 2026-06-21T13:00:00Z
updatedAt: 2026-10-07T13:57:53Z
```
# konspekt

Three goals that converge on one artifact: help people follow gen-AI
conversations by externalizing project state; port projects across platforms
via a platform-neutral representation; and make that curated record a
high-quality input back to the LLM. Impact-primary and open-source —
adoption, even by copying, is the win.

Index: `nodes/`, `concepts/`, `noteworthy/`, `artifacts/`, `waypoints/`,
`edges/`.
