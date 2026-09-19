---
platform: linkedin
format: feed
date: 2026-09-19
url:                      # live post URL, filled in once posted
announces: "implementation_zero — the local read-only UI (Changes / Stats / Goals + detail panel)"
carousel: carousel.pdf    # 7-page PDF uploaded to LinkedIn as a document; assembled from images/slide-*.png
assets:
  - file: images/changes.png
    source: implementations/implementation-zero/app (Changes tab)
    alt: Changes tab — a rolling window over every entity with kind/status/review filters
  - file: images/stats.png
    source: implementations/implementation-zero/app (Stats tab)
    alt: Stats tab — 152 entities, 257 edges, 75% accepted, 38 open proposals
  - file: images/goals.png
    source: implementations/implementation-zero/app (Goals tab)
    alt: Goals tab — a goal decomposed into its subgraph as a layered diagram
  - file: images/detail.png
    source: implementations/implementation-zero/app (detail panel)
    alt: Detail panel — an atom's full record (type, status, review, provenance, body)
  - file: images/provenance.png
    source: implementations/implementation-zero/app (detail panel)
    alt: Detail panel — the verbatim human/assistant exchange a decision came from, hash-verified
first_comment: |
  Repo: https://github.com/finos-labs/konspekt
  Last week (queries on the command line): FILL IN with the 2026-09-13 article URL once known
---

<!--
Carousel style: attach carousel.pdf as a DOCUMENT (paperclip) so the seven pages
become a swipeable carousel. Do NOT paste a link in the body: an uploaded
document and an auto link-preview card are mutually exclusive. Put links in the
first comment (see first_comment above).
-->

Last week I said konspekt's graph queries ran on the command line, with a proper interface still ahead. That interface is here.

konspekt now has a local UI: a read-only window that sits beside the session and shows the project state as the agent and I write to it. Three tabs and a detail panel, refreshed live by a filesystem watcher.

What it shows, swipe by swipe:

- Changes: a rolling ten-row window over every entity, newest first, filtered by kind, status, and review, with presets for open work and the proposed review queue.
- Stats: the size of the project at a glance. 152 entities, 257 edges, 75% accepted, 38 open proposals, plus the oldest proposals still waiting on a human.
- Goals: each goal decomposed into its subgraph, drawn as a layered diagram where a node's border is its status and a dashed border means still proposed.
- Detail panel: open any atom for its record and the verbatim source it came from, both sides of the conversation, each hop checked by re-hashing the source against its recorded hash. The provenance of a decision, down to who said what.
- Read-only by design: the window takes no disposition, so propose then accept still holds. Nothing here writes to the graph.

It runs on a real project, konspekt's own, tracking its own build. Open standard, reference implementation, Apache-2.0, under FINOS Labs.

Next up: an IntelliJ plugin for the engineer persona, bringing the same view into the IDE, where writes arrive first.

Repo and last week's write-up in the comments.

#AI #KnowledgeGraphs #OpenSource #FINOS #konspekt
