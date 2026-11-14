```yaml
id: task-sources-sha256-migration
type: task
title: Re-address existing sources from git blob SHA to SHA-256
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-28T23:07:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;9a-2bwqAaDR9W-1XIh9bWxEF9kI6ylpFNMOWxYTI9IM
  conversationId: fleet-implementation
  timestamp: 2026-09-28T23:07:00Z
  confidence: 0.9
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
    contentHash: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
createdAt: 2026-09-28T23:07:00Z
updatedAt: 2026-11-14T18:50:36Z
```
# Task: Re-address existing sources from git blob SHA to SHA-256

Fleet payloads address the source excerpt by SHA-256 over the verbatim excerpt
([[nw-fleet-sha256-source-addressing]]), applied to new proposals only. The
existing `.konspekt/instance/sources/<gitBlobSHA>.md` files keep their git-blob
names. This task re-addresses the back catalogue so the whole instance uses one
transport-independent scheme.

The work:

**Re-hash and rename.** For each existing `sources/<gitBlobSHA>.md`, compute
SHA-256 over the verbatim excerpt and rename to `sources/<sha256>.md`.

**Rewrite references.** Every atom whose `provenance.sourceRef` / `contentHash`
names a git blob SHA is updated to the new SHA-256, in the same change, so no
reference dangles.

**Tooling.** The conformance checker and any source-addressing tooling move to
SHA-256, so a re-hash check confirms the migration and future writes use the new
scheme.

This is the change [[task-enterprise-persistence]] needs, since a
transport-independent content hash is what lets a source move between git and an
enterprise store as a re-hash check rather than a rename. It also settles the
addressing seam in [[task-provenance-model]].

Success is every source addressed by SHA-256, every reference updated, and the
checker green.

**Superseded plan (2026-11-14).** The rename-and-overwrite steps above predate
the in-place decision in [[investigation-source-uris]]. The migration is carried
out by [[task-ni-references]]: references move to `ni:///sha-256` URIs, each
excerpt is copied to `sources/sha-256/<hex>.md`, old references are kept under
`provenance.deprecated` or in `deprecated.md`, and old SHA-1 files are kept.
Where the steps above conflict with that task, that task applies.
