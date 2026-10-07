---
platform: linkedin
format: feed
date: 2026-10-07
url: https://www.linkedin.com/feed/update/urn:li:activity:7513739203726348288/
announces: "acceptance made accountable — authority, the transition log, and basis: accepted"
assets:                    # text-forward post; the article carries any cover image
first_comment: |
  Full write-up (article): https://www.linkedin.com/pulse/provenance-completeness-konspekt-denis-urusov-tadlc
  Authority (spec): https://github.com/finos-labs/konspekt/blob/main/spec/architecture/AUTHORITY.md
  Acceptance before work (spec): https://github.com/finos-labs/konspekt/blob/main/spec/architecture/REVIEW.md
  Repo: https://github.com/finos-labs/konspekt
---

<!--
Publish the article (article.md / article.html) FIRST, then paste its URL into
first_comment above before posting this feed teaser.
-->
Who accepted this?

Last time, konspekt closed the gap where an AI conversation produces nothing the record can see — every piece of work now binds to the graph. But binding only checks that an atom points at something real. It says nothing about whether the work was approved. That is acceptance, and acceptance stays human — said in plain words in the conversation, with no special command to learn.

The work since then makes acceptance accountable.

konspekt now keeps an append-only transition log: every change of review or status is one row, in order — proposed → accepted, open → resolved — and each acceptance names the principal who made the call. The UI shows "Accepted by —" on every atom's details.

Who may accept is declared, not assumed. An instance lists its principals and grants: which identity may accept which part of the graph. An agent proposes; it never accepts its own work. Our own project runs single-individual authority — one human holds the grant — and a second adopter writes two small tables to say something different.

And acceptance now comes first. Under basis: accepted, an entity is accepted before any work binds to it — enforced by the validator, a commit-time audit, and an edit-time hook. Work no longer attaches to things nobody signed off on.

Alongside this, konspekt's agent model is moving to an MCP-mode fleet: several agents proposing into one graph, one human accepting. The authority model is what makes that safe — many proposers, named acceptors.

Repo and spec in the comments.

#AI #KnowledgeGraphs #Accountability #OpenSource #FINOS #konspekt
