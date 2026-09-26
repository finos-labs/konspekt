---
platform: linkedin
format: feed
date: 2026-09-26
url:                       # live post URL, filled in once posted
announces: "IntelliJ plugin + accept/resolve write actions from the UI"
carousel: carousel.pdf     # multi-page PDF uploaded to LinkedIn as a document; assembled from images/slide-*.png
assets:
  - file: images/tool-window.png
    source: implementations/intellij-plugin (konspekt tool window, Changes tab)
    alt: konspekt tool window docked in IntelliJ — Changes tab over the open project's graph
  - file: images/goals.png
    source: implementations/intellij-plugin (Goals tab)
    alt: Goals tab — a goal decomposed into its subgraph as a layered diagram, inside the IDE
  - file: images/detail-provenance.png
    source: implementations/intellij-plugin (entity detail drawer, Provenance tab)
    alt: Entity detail drawer — the verbatim exchange a decision came from, hash-verified
  - file: images/dispositions.png
    source: implementations/intellij-plugin (entity detail drawer, Accept / Resolve)
    alt: The write actions — Accept a proposed atom, Resolve a work node — from inside the IDE
  - file: images/detail-commands-changes.png
    source: implementations/intellij-plugin (entity detail drawer, Commands / Changes tabs)
    alt: Entity detail drawer — the commands run and files changed for an entity
first_comment: |
  Repo: https://github.com/finos-labs/konspekt
  What konspekt is (the deck): https://finos-labs.github.io/konspekt/
  Install the plugin (no build): https://github.com/finos-labs/konspekt/releases/latest — Settings → Plugins → ⚙ → Install Plugin from Disk… (IntelliJ 2026.2+)
  Last week (the local read-only UI): https://www.linkedin.com/feed/update/urn:li:activity:7507169289972547584/
---

<!--
Carousel style: attach carousel.pdf as a DOCUMENT (paperclip) so its pages become
a swipeable carousel. Do NOT paste a link in the body: an uploaded document and an
auto link-preview card are mutually exclusive. Put links in the first comment (see
first_comment above). Images to capture are listed in images/CAPTURE.md.
-->

Last week I showed konspekt's local UI: a read-only window beside the session, showing project state as the agent and I write to it. Two things have changed since.

The view is now in the IDE. konspekt has an IntelliJ plugin — the same view (Changes, Stats, Goals, Decisions, and the detail drawer) as a tool window, reading the open project's .konspekt/instance in-process. No Node runtime in the session, and IDE-native change detection, so it refreshes the moment the instance on disk changes.

The window is no longer read-only. You can act on the graph from it:

- Accept a proposed atom — flip it to accepted, and its now-both-accepted edges with it.
- Resolve a work node — close it out (its status becomes resolved). Because a human verb carries its own acceptance, resolving a still-proposed node accepts it in the same step.

Both are human-only writes. The agent still only ever proposes; propose, then accept, still holds.

The plugin carries its own Kotlin reader of the konspekt serialization — a second, independent implementation of the format, kept honest against the same conformance target as the reference implementation. The HTML view is copied from that implementation at build time, so it can never fork.

Install without building: grab the prebuilt zip from the latest release and install from disk (IntelliJ 2026.2+). Open standard, reference implementation, Apache-2.0, under FINOS Labs.

Repo, the install link, and a deck on what konspekt is — in the comments.

#AI #KnowledgeGraphs #OpenSource #FINOS #konspekt #IntelliJ
