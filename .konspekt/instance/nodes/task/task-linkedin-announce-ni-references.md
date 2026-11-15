```yaml
id: task-linkedin-announce-ni-references
type: task
title: November 2026 LinkedIn post — content addressing upgraded from git SHA-1 to SHA-256 and ni: references
status: resolved
review: accepted
provenance:
  sourceRef: ni:///sha-256;oAxv9bFMykg1mRc_Tqtbg8Y4jejYjbWZ9e73FK81Pqk
  conversationId: linkedin-ni-references
  timestamp: 2026-11-15T15:01:50Z
  confidence: 0.8
createdAt: 2026-11-15T15:01:50Z
updatedAt: 2026-11-15T16:57:46Z
```
# Task: November 2026 LinkedIn post — content addressing upgraded from git SHA-1 to SHA-256 and ni: references

Draft and publish a feed post (no article) announcing the content-addressing
upgrade delivered by [[task-ni-references]]. Everything konspekt names by hash
moves from git blob SHA-1, and the git mechanics that came with it, to SHA-256
over the raw bytes, cited as RFC 6920 `ni:///sha-256;<base64url>` references.
That covers the source excerpts behind graph items, the excerpts checkpoints
save, the recorded commands, and every log cell that cites one of them
(transitions, checkpoints, grants, the executed-command log). A reference names
no host or store, and `project.md` declares where content lives, so an
instance can move between stores without rewriting references. The migration
is in place and keeps every old reference.

The post carries a carousel (`carousel.pdf`) rendered from
`docs/visuals/posters/konspekt-addressing-poster.html`. It shows what is
content-addressed; the directory structure before and after migration;
before-and-after examples of an entity's provenance block and a transition
`source` cell; the path from an `ni:` reference to the stored bytes (the
`project.md` `resolve` template, the layout convention, the RFC 6920
`/.well-known/ni/` read path), ending in the verify probe; and store
resolution in `project.md`. It lives under
`docs/announcements/linkedin/post_2026-11-15/`. A post is published when its
directory merges into `main`; the live URL is recorded once posted.

Published on LinkedIn 2026-11-15; the URL is in `post.md` and the
announcements README.

Decomposes [[goal-usability]].
