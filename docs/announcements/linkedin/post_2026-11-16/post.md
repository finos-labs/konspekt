---
platform: linkedin
format: feed
date: 2026-11-16
url:
announces: "provenance references move to RFC 6920 ni:///sha-256 content addresses; project.md declares where content lives"
carousel: carousel.pdf      # 6-page PDF uploaded to LinkedIn as a document; printed from the poster below
assets:
  - file: carousel.pdf
    source: docs/visuals/posters/konspekt-addressing-poster.html
    alt: Six slides. The new reference form; the instance directory before and after migration; an entity's provenance block before and after; a transition table cell before and after, with the old-to-new map; the path from a reference to the stored bytes; and the project.md store block that holds locations instead of the atoms.
first_comment: |
  Spec (references): https://github.com/finos-labs/konspekt/blob/main/spec/architecture/SERIALIZATION.md#content-references
  Spec (storage): https://github.com/finos-labs/konspekt/blob/main/spec/architecture/STORAGE.md
  Change: https://github.com/finos-labs/konspekt/pull/109
  Repo: https://github.com/finos-labs/konspekt
---

Every item in a konspekt graph (a decision, a task, a concept) cites the exact conversation text it was extracted from. That text is stored in your repository and named by its hash. The name used to be a git blob SHA-1. It is now an RFC 6920 content address over SHA-256:

ni:///sha-256;jYKKUd3-aY7e7SL8WnL-bu98ShgEeMhbC1rh8mfFdzk

Why we changed it:

1. Identity from the bytes alone. A git blob SHA-1 hashes a git-specific header together with the file, and git has picked SHA-256 as SHA-1's successor, planned as the default for new repositories in Git 3.0. SHA-256 over the raw bytes can be computed by any tool without git. The reference also names its algorithm, so a later hash can be added without breaking existing references.

2. No locations in the graph. A reference names no host, URL or database. Where the content lives is declared once, in project.md, as one template per kind of content. Moving an instance from git to a document store or a relational database changes that block and rewrites no item, and no internal hostname ends up in a repository that may be public.

3. Nothing lost. The migration runs in place and only adds files. In our own repository, 140 source excerpts and 106 recorded commands were copied under sha-256/. The old SHA-1 files stay, and every old reference is kept next to the new one or in an old-to-new map. Readers accept both forms.

The carousel shows the directory layout before and after, a real entity and a real table row before and after, and the path from a reference to the bytes. You decode the reference to hex, find the file through the project.md template, the directory layout or the RFC 6920 /.well-known/ni/ path, and check that the SHA-256 of what came back matches.

Spec, change and repo in the comments.

#AI #LLM #KnowledgeGraphs #OpenSource #FINOS #konspekt
