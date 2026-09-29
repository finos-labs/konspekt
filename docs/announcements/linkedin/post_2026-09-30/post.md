---
platform: linkedin
format: feed
date: 2026-09-30
url:                       # live post URL, filled in once posted
announces: "provenance completeness — the fifth invariant (conversation binding)"
assets:                    # text-forward post; the article carries the cover image
  - file: images/invariants.png
    source: docs/index.html (deck slide 15 — Invariants)
    alt: The five invariants konspekt's design holds to; the fifth is provenance completeness
first_comment: |
  Full write-up (article): FILL IN once the article is published
  The invariant (spec): https://github.com/finos-labs/konspekt/blob/main/spec/architecture/BINDING.md
  Repo: https://github.com/finos-labs/konspekt
---

<!--
Publish the article (article.md / article.html) FIRST, then paste its URL into
first_comment above before posting this feed teaser. The invariants image
(images/invariants.png) is the article's cover; attach it to this post too, or
keep this post text-only and let the article carry the image.
-->

Run a project through an AI and one failure is easy to miss: a whole conversation that leaves no trace in the record. Work happened, decisions were made, and the graph shows nothing.

konspekt now rules that state out. A new invariant — provenance completeness — requires every atom to bind: anchored to its verbatim source and attached to the graph through an entity. A conversation resolves to entities, or it is recorded as a deliberate decision not to bind. There is no third state where work happened silently.

Binding is referential integrity: it checks that an atom points at an entity that exists, the way a foreign key requires a valid parent. It makes no judgment about whether the atom is correct — that is acceptance, and acceptance stays human. And it is checked when an atom is extracted, so it never blocks a proposal at the save step.

A CI binding audit backs that up: on every push and pull request it walks the commits and flags any work that changed the project but binds to no entity, so an uncaptured conversation is caught after the fact.

Each instance sets the policy. Optional: a human may decline to bind, and the decline is recorded. Required: no conversation goes untracked — the setting for audit and enterprise use. konspekt's own project runs in required, where each session opens by attaching the conversation to an entity before any durable work begins.

The fifth invariant, alongside four already in the spec. Full write-up and the spec in the comments.

#AI #KnowledgeGraphs #Accountability #OpenSource #FINOS #konspekt
