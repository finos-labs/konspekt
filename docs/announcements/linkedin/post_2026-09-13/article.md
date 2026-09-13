---
platform: linkedin
format: article
date: 2026-09-13
url:                      # article's permanent URL, filled in once published
title: "konspekt: a visual guide to the type system, and a more proactive LLM maintainer"
cover: images/graph-example.png
assets:
  - file: images/type-system-poster.png
    source: docs/visuals/posters/konspekt-type-system-poster.html
    alt: konspekt type-system poster
  - file: images/graph-example.png
    source: docs/visuals/konspekt-graph-example.svg
    alt: konspekt example graph
---

<!--
LinkedIn Articles do not import Markdown. Paste each section into the Article
editor and apply formatting with the toolbar:
- "#" -> Article title field
- "##" -> Heading 2
- "- " -> bullet list
- links -> select text, use the link button
- image markers ">> [IMAGE ...]" -> insert the named PNG at that point and
  type the caption underneath it
Cover image: images/graph-example.png
-->

# konspekt: a visual guide to the type system, and a more proactive LLM maintainer

Last week we reposted our [FINOS Labs blog introducing konspekt](https://lnkd.in/p/gspJNgc7): a portable, git-backed typed knowledge graph for AI project state.

Since then, we have shaped up the roadmap: accountability, collaboration, curated context, following the thread, observability, portability, and usability. We have focused on adoption through usability and took two steps toward that.

## 1. A visual guide to the data model

The data model itself has not changed; what was missing was a way to teach it. Every atom in the graph is one of a small, closed set of types, and each type answers one question:

- Is it work (goal, investigation, experiment, topic, task, note)?
- A finding (fact, statement, decision, assumption, constraint)?
- A moment on the timeline (decision, milestone, pivot)?

There is now one sheet that lays this out:

>> [IMAGE images/type-system-poster.png] caption: The konspekt type system — the one question that selects each type.

— plus a worked example: a small project where every box is a typed atom and every line is one edge in a single table.

>> [IMAGE images/graph-example.png] caption: One goal, worked in the open — every box a typed atom, every line one edge.

## 2. A more proactive LLM maintainer

The LLM that watches a session got sharper rules for when something has settled enough to capture, and which type to reach for. That second part matters more than it looks. With no rule separating an experiment from an investigation, or a constraint from a fact, the LLM never proposes the rarer types, so they sit empty and the data model loses half its vocabulary in practice. The new rules close that gap. The human still accepts every atom; the LLM only proposes.

## Two new queries over the graph

We also added two queries over the graph, run from the command line for now with a proper interface still ahead: goal state (the sub-graph under a goal, every node with its status) and provenance chain (for any atom, the source it came from and everything it replaced, each hop checked by re-hashing the source against its recorded hash).

All of it is on main: [github.com/finos-labs/konspekt](https://github.com/finos-labs/konspekt)

#AI #KnowledgeGraphs #OpenSource #FINOS #konspekt
