```yaml
id: task-presentation-refresh
type: task
title: Refresh presentation materials for the plugin, UI writes, and binding
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-26T17:00:00Z
review: proposed
provenance:
  sourceRef: 4395f3ccb8e1747ca13f2869046c1cc71972422a
  contentHash: 4395f3ccb8e1747ca13f2869046c1cc71972422a
  conversationId: presentation-and-binding
  timestamp: 2026-09-26T17:00:00Z
  confidence: 0.7
createdAt: 2026-09-26T17:00:00Z
updatedAt: 2026-09-26T17:00:00Z
```
# Task: Refresh presentation materials for the plugin, UI writes, and binding

Update the outward-facing presentation surfaces to reflect three shipped
additions: the IntelliJ plugin, the accept/resolve write actions from the UI, and
provenance completeness (the fifth invariant). Touched the deck (`docs/index.html`
— the five-across invariants slide with V, the write-action slides), the overview
(`docs/overview.html` / `overview.svg` and re-rendered previews), the hand-authored
poster (`konspekt-how-it-works-poster.html`), the generated posters (regenerated),
and `README.md` / `WHITEPAPER.md` / `ROADMAP.md`. Also corrected stale
`denisurusov/*` links to `finos-labs/*` in the overview.

Decomposes [[goal-usability]] (adoption through legible presentation). Delivered
on the `docs-presentation-refresh` branch and merged.
