---
platform: linkedin
format: feed
date: 2026-10-23
url: https://lnkd.in/p/gbiG3h94
announces: "the agent fleet runs — a second, unrelated repo adopted it; acceptance authority is now a setup precondition"
carousel: carousel.pdf      # full fleet poster as a swipeable LinkedIn document
assets:
  - file: images/fleet.png
    source: docs/visuals/posters/konspekt-fleet-poster.html (header + Figure 1)
    alt: The fleet layout — proposer agents writing to their own outbox branches, one deterministic committer folding proposals onto the canonical graph, one human accepting
  - file: carousel.pdf
    source: docs/visuals/posters/konspekt-fleet-poster.html (full poster)
first_comment: |
  Full write-up (article): <paste the published Article URL here before posting>
  Authority (spec): https://github.com/finos-labs/konspekt/blob/main/spec/architecture/AUTHORITY.md
  Fleet (code): https://github.com/finos-labs/konspekt/tree/main/implementations/fleet
  Repo: https://github.com/finos-labs/konspekt
---

<!--
Publish the article (article.md / article.html) FIRST, then paste its URL into
first_comment above before posting this feed teaser. Attach images/fleet.png, or
keep this post text-only and let the article carry the figure.
-->
We have reached an important milestone, making Konspekt work with a fleet of agents. All agents propose into the 
same Konspekt graph, and a single human accepts them. The authority model ensures that this is safe.

A separate project adopted it: cdm-collateral, a repository modeling collateral under the Common Domain Model, unrelated to konspekt's own code. A proposer agent wrote design documents to its own outbox; a deterministic committer verified each one and folded it onto the shared graph as "proposed." I reviewed and accepted two of them. Each atom carries its verbatim source, the agent that proposed it, and me as the named acceptor.

Standing it up in a second repo exposed a gap the home repo never would: that project had never declared who may accept, so my first acceptance was recorded with no name on it. So the named acceptor is now a configuration element of setup, enforced in a blocking way — a fleet will not stand up until an authority is declared and the approver's identity is set.

The write-up covers how it fits together (link in the comments):

- One reviewer over many agents — N+1 git worktrees over one object store, one deterministic committer, no model on the write path
- Spec-driven setup — a single committed config file declares the fleet; filesystem paths and the runtime index are derived, not stored 
- An explicit on-disk layout — the canonical worktree in place, proposers under a `-fleet` sibling directory, all sharing one `.git`
- Agents are skills — five fleet skills in a vendor-neutral location; each agent's role names its skill, and its entity types are its propose-grant 
- Acceptance authority as a blocking setup element — setup refuses, and a new `doctor` command checks, until a named acceptor is declared and configured 
- Moving the canonical branch — switching a fleet's branch is a defined operation the committer follows, and `doctor`/`run-pass` refuse if the worktree and config disagree
- Proven by an adopter — a repo sharing none of konspekt's code ran the whole propose–verify–fold–accept loop

Many proposers, one accountable human — now checked before the first agent runs.

Repo, spec, and the full write-up in the comments.

#AI #KnowledgeGraphs #Accountability #OpenSource #FINOS #konspekt
