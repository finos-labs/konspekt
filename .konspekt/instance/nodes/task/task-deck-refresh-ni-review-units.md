```yaml
id: task-deck-refresh-ni-review-units
type: task
title: Bring docs/index.html up to date with ni references, review units, and the November drawer and checkpoint work
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-22T20:42:29Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;aLddcpZlOgCsqnO_1WfiSum0hA4yZAWpSEsXLxOvaOQ
  conversationId: deck-refresh
  timestamp: 2026-11-22T20:42:29Z
  confidence: 0.85
createdAt: 2026-11-22T20:42:29Z
updatedAt: 2026-11-22T20:42:29Z
```
# Task: Bring docs/index.html up to date with ni references, review units, and the November drawer and checkpoint work

The deck's last content edit was 2026-11-07. Since then [[task-ni-references]],
[[task-ui-clickable-source-refs]], [[task-ui-atom-neighborhood-graph]] and the
review-unit work under [[investigation-task-pr-map]] have shipped. Update the
deck to match:

- **How an entry enters the graph.** Show the content hash as
  `sources/sha-256/<hex>.md`, cited as `ni:///sha-256;<base64url>`.
- **Provenance.** Channel files under `sources/sha-256/` and
  `commands/sha-256/`; one line on the RFC 6920 `ni:` reference, the
  per-instance resolution rule in `project.md`, and the lossless migration
  (old refs kept in a `deprecated` block). Add review units as a fourth entry
  beside changed code: `changes/review-units.md`, written by
  `tools/review-units.mjs`, covering direct and landed commits, checked in CI.
- **Entity detail.** Keep one slide and redraw the drawer mock: clickable
  `ni:` references, the stacked source view with store location, the
  Provenance tab as a reference index, pull requests, and the Connections list
  with its pop-out graph.
- **Control verbs.** Rename the sync/persist family to orchestration verbs, as
  `TRANSPORT.md` does, and add `checkpoint` / `resume`
  ([[task-session-checkpoint]]).
- **In practice.** Name `checkpoint` and `resume` on the model-switch and
  next-week cards.
- **Where it goes next.** Mark `ni:` references and store resolution
  delivered under Portability, and review units delivered under
  Accountability.
- **Questions we hear.** Note that references resolve the same way in any
  store through the per-instance rule.

Decomposes [[goal-adoption]].
