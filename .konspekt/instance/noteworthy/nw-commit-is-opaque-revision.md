```yaml
id: nw-commit-is-opaque-revision
kind: decision
review: proposed
provenance:
  sourceRef: ff351a23b2e76030ec4b6a54ddc6d83e5f435393
  contentHash: ff351a23b2e76030ec4b6a54ddc6d83e5f435393
  timestamp: 2026-09-20T17:00:00Z
  conversationId: engineer-executed-provenance
  confidence: 0.75
createdAt: 2026-09-20T17:00:00Z
updatedAt: 2026-09-20T17:00:00Z
```
# Noteworthy: The changed-code commit is an opaque revision token

The `commit` column of the changed-code log (`changes/changed.md`) is a string
that identifies a revision, comparable only by the versioning backend. No reader
in the standard parses it or resolves it against a VCS: the conformance checker
validates its shape and non-emptiness only, and the app and plugin surface it as
a label. A git backend puts a commit SHA there; another backend can put its own
revision id, and nothing downstream changes.

This keeps the standard off git. Deriving the log by walking `git log` would make
generation git-specific — so rows are written push-based at commit time instead,
and no component in the core or the surfaces shells out to a VCS. Sibling to the
same decision for the changes-since cursor ([[nw-cursor-is-opaque-store-token]]);
it is what lets [[task-record-code-changes]] store commit hashes without coupling
the implementation to git.
