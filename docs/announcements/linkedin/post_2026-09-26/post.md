---
platform: linkedin
format: feed
date: 2026-09-26
url: https://www.linkedin.com/feed/update/urn:li:activity:7509961935828840448/
announces: "IntelliJ plugin + accept/resolve write actions from the UI"
carousel: carousel.pdf     # multi-page PDF uploaded to LinkedIn as a document; assembled from the images/*.png below, in order
assets:
  - file: images/plugin_tool_button.png
    source: implementations/intellij-plugin (docked tool window, Decisions tab)
    alt: konspekt docked as an IntelliJ tool window on the right edge — Decisions tab, with the pop-out and pin controls in the title bar
  - file: images/plugin_popup_mode.png
    source: implementations/intellij-plugin (floating window, Goals tab)
    alt: The same view detached into a floating window over the IDE — Goals tab, a goal decomposed into its subgraph; Dock and pin controls at the top left
  - file: images/task_write_commands.png
    source: implementations/intellij-plugin (entity detail drawer, Accept / Resolve)
    alt: The write actions — Accept a proposed atom, Resolve a work node — on a proposed node's detail drawer, from inside the IDE
  - file: images/files_changed.png
    source: implementations/intellij-plugin (entity detail drawer, Changes tab)
    alt: Entity detail drawer — the Changes tab listing the files changed in the commit recorded for a work node
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

Last week I showed konspekt's local UI: a read-only window beside the session, showing project state as the agent 
and I write to it. Two things have changed since:

The view is now working in the IDE. konspekt has an IntelliJ plugin — the same view (Changes, Stats, Goals, Decisions, 
and the detail drawer) as a tool window, reading the open project's .konspekt/instance in-process. No Node runtime in the session, and IDE-native change detection, so it refreshes the moment the instance on disk changes. It docks against the editor, or pops out into a floating window with its own minimize/maximize/close and a remembered size — a pin sets whether it pops out on open, a Dock button returns it, and both frames render the one shared view.

The window is no longer read-only:

- Accept a proposed atom — flip it to accepted, and its now-both-accepted edges with it.
- Resolve a work node — close it out (its status becomes resolved). Because a human verb carries its own acceptance, resolving a still-proposed node accepts it in the same step.

The plugin carries its own Kotlin reader of the konspekt serialization — a second, independent implementation of the format, kept honest against the same conformance target as the reference implementation. The HTML view is copied from that implementation at build time, so it can never fork.

Install without building: grab the prebuilt zip from the latest release and install from disk (IntelliJ 2026.2+). Open standard, reference implementation, Apache-2.0, under FINOS Labs.

Repo, the installation link, and a deck on what konspekt is — in the comments.

#AI #KnowledgeGraphs #OpenSource #FINOS #konspekt #IntelliJ
