---
platform: linkedin
format: feed
date: 2026-11-16
url: https://www.linkedin.com/feed/update/urn:li:activity:7527776124450398208/
announces: "content addressing upgraded from git blob SHA-1 to SHA-256 and RFC 6920 ni: references, for graph-item excerpts, checkpoints and recorded commands, so content can move between stores"
carousel: carousel.pdf      # 6-page PDF uploaded to LinkedIn as a document; printed from the poster below
assets:
  - file: carousel.pdf
    source: docs/visuals/posters/konspekt-addressing-poster.html
    alt: Six slides. What is content-addressed and the new reference form; the instance directory before and after migration; an entity's provenance block before and after; a transition table cell before and after, with the old-to-new map; the path from a reference to the stored bytes; and the project.md store block that holds locations so references do not.
first_comment: |
  Spec (references): https://github.com/finos-labs/konspekt/blob/main/spec/architecture/SERIALIZATION.md#content-references
  Spec (storage): https://github.com/finos-labs/konspekt/blob/main/spec/architecture/STORAGE.md
  Change: https://github.com/finos-labs/konspekt/pull/109
  Repo: https://github.com/finos-labs/konspekt
---

We upgraded how konspekt addresses the content it stores. Everything it names by hash moved from git blob SHA-1, and the git mechanics that came with it, to SHA-256 and RFC 6920 ni: references:

- the verbatim conversation excerpts behind every graph item (decisions, tasks, concepts);
- the excerpts that checkpoints save, so a conversation can be resumed in another LLM, on another day or on another device;
- the commands recorded as provenance for engineering work;
- every table cell that cites one of these: the transition log, the checkpoint log, acceptance grants and the executed-command log.

A reference now looks like this:

ni:///sha-256;jYKKUd3-aY7e7SL8WnL-bu98ShgEeMhbC1rh8mfFdzk

Why we changed it:

1. No git mechanics in the identity. A git blob SHA-1 hashes a git-specific header together with the file, so producing or checking one meant doing what git does. SHA-256 over the raw bytes can be computed by any tool. The reference also names its algorithm, so a later hash can be added without breaking existing references. Git itself has picked SHA-256 as SHA-1's successor, planned as the default for new repositories in Git 3.0.

2. Content that can move between stores. A reference names no host, URL or database. Where content lives is declared once per instance, in project.md, as one template per kind of content. Moving an instance from git to a document store or a relational database changes that one block and rewrites no reference, and no internal hostname ends up in a repository that may be public. The git binding ships today; the document and relational bindings are specified as examples.

3. Nothing lost. The migration runs in place and only adds files. In our own repository, 140 excerpts and 106 recorded commands were copied under sha-256/. The old SHA-1 files stay, and every old reference is kept next to the new one or in an old-to-new map. Readers accept both forms.

The carousel shows the directory layout before and after, a real entity and a real table row before and after, and the path from a reference to the bytes. You decode the reference to hex, find the file through the project.md template, the directory layout or the RFC 6920 /.well-known/ni/ path, and check that the SHA-256 of what came back matches.

Spec, change and repo in the comments.

#AI #LLM #KnowledgeGraphs #OpenSource #FINOS #konspekt
