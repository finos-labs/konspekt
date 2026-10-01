---
platform: linkedin
format: feed
date: 2026-09-30
url: https://www.linkedin.com/feed/update/urn:li:activity:7511212521635082241/
announces: "provenance completeness — the fifth invariant (conversation binding)"
assets:                    # text-forward post; the article carries the cover image
  - file: images/invariants.png
    source: docs/index.html (deck slide 15 — Invariants)
    alt: The five invariants konspekt's design holds to; the fifth is provenance completeness
first_comment: |
  Full write-up (article): https://www.linkedin.com/pulse/provenance-completeness-konspekt-denis-urusov-gbzic
  The invariant (spec): https://github.com/finos-labs/konspekt/blob/main/spec/architecture/BINDING.md
  Repo: https://github.com/finos-labs/konspekt
---

<!--
Publish the article (article.md / article.html) FIRST, then paste its URL into
first_comment above before posting this feed teaser. The invariants image
(images/invariants.png) is the article's cover; attach it to this post too, or
keep this post text-only and let the article carry the image.
-->
When you work through a project with an AI, it's easy to lose something without noticing: a whole conversation that never makes it into the record. You thought things through, you made real decisions — and afterward the graph shows none of it. Konspekt now has a setting — optional or required — that binds each human–AI conversation to a graph node, so that work stops slipping through.

A new invariant — provenance completeness — requires every atom to bind: anchored to its verbatim source and attached to the graph through an entity. A conversation resolves to entities, or it is recorded as a deliberate decision not to bind. There is no third state where work happened silently.

Binding is referential integrity: it checks that an atom points at an entity that exists, the way a foreign key requires a valid parent. It makes no judgment about whether the atom is correct — that is acceptance, and acceptance stays human. And it is checked when an atom is extracted, so it never blocks a proposal at the save step.

A CI binding audit backs that up, and under required it breaks the build. The workflow `.github/workflows/konspekt-binding-audit.yml` runs `tools/binding-audit.mjs` on every push and pull request, walking each commit from a baseline to HEAD. A commit that changed the project outside the instance but binds to no entity — no matching row in the changed-code log — fails the job and turns the build red. It reports at the commit boundary and never blocks a save.

Each instance sets the policy. Optional: a human may decline to bind, and the decline is recorded. Required: no conversation goes untracked — the setting for audit and enterprise use. Konspekt's own project runs in required, where each session opens by attaching the conversation to an entity before any durable work begins — the load-then-bind loop written into the instance's operating policy (`.konspekt/OPERATING.md`).

The fifth invariant, alongside four already in the spec. Full write-up and the spec in the comments.

#AI #KnowledgeGraphs #Accountability #OpenSource #FINOS #konspekt
