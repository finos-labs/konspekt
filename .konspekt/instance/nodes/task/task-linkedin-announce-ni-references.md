```yaml
id: task-linkedin-announce-ni-references
type: task
title: November 2026 LinkedIn post — ni:///sha-256 content addressing and store resolution
status: open
review: accepted
provenance:
  sourceRef: ni:///sha-256;oAxv9bFMykg1mRc_Tqtbg8Y4jejYjbWZ9e73FK81Pqk
  conversationId: linkedin-ni-references
  timestamp: 2026-11-15T15:01:50Z
  confidence: 0.8
createdAt: 2026-11-15T15:01:50Z
updatedAt: 2026-11-15T15:05:34Z
```
# Task: November 2026 LinkedIn post — ni:///sha-256 content addressing and store resolution

Draft and publish a feed post (no article) announcing the addressing change
delivered by [[task-ni-references]]: provenance and command references move
from git blob SHA-1 to RFC 6920 `ni:///sha-256;<base64url>`, stored files are
named by the hex digest under `sha-256/`, the migration is in place and keeps
every old reference, and `project.md` declares the store and a `resolve`
template per kind of content so atoms carry no store locations.

The post carries a carousel (`carousel.pdf`) rendered from a new poster under
`docs/visuals/posters/`, showing three things: the instance directory structure
before and after migration; before-and-after examples of an entity's provenance
block and a transition `source` cell; and the discovery path from an `ni:`
reference to the stored bytes (the `project.md` `resolve` template, the layout
convention, and the RFC 6920 `/.well-known/ni/` read path), ending in the
verify probe. It lives under `docs/announcements/linkedin/post_2026-11-16/`.
A post is published when its directory merges into `main`; the live URL is
recorded once posted.

Decomposes [[goal-usability]].
