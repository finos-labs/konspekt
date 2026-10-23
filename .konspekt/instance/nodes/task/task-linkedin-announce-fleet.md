```yaml
id: task-linkedin-announce-fleet
type: task
title: LinkedIn announcement — the agent fleet
status: open
review: accepted
provenance:
  sourceRef: 21166f62a7f6132ae86eec5030cea52adae3bf01
  contentHash: 21166f62a7f6132ae86eec5030cea52adae3bf01
  conversationId: fleet-adopter-authority-preflight
  timestamp: 2026-10-23T19:12:41Z
  confidence: 0.8
createdAt: 2026-10-23T19:12:41Z
updatedAt: 2026-10-23T19:12:41Z
```
# Task: LinkedIn announcement — the agent fleet

Draft and publish the 2026-10-23 LinkedIn announcement covering the agent fleet:
one reviewer over many proposer agents, a deterministic committer with no model
on the write path, spec-driven setup from a committed config, the explicit
worktree layout, the fleet skills and the skill–persona map, and acceptance
authority as a blocking setup precondition — proven by a second repository
(cdm-collateral) adopting the fleet end to end.

The deliverable is the post directory `docs/announcements/linkedin/post_2026-10-23/`:
a feed `post.md` with a feature bullet list cross-referencing the article, a
long-form `article.md`, the fleet-poster cover `images/fleet.png`, and the
full-poster `carousel.pdf`. Published when the post directory merges to `main`.

Decomposes [[goal-usability]]. Continues the announcement line after
[[task-linkedin-announce-2026-10]] (acceptance & authority).
