```yaml
id: nw-multifile-push-clobbers-silently
kind: constraint
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  timestamp: 2026-09-14T16:00:00Z
  conversationId: app-design-101
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Noteworthy: Multi-file push overwrites without complaining

A single-file update through the GitHub API requires the file's current blob SHA
and fails if the file moved. The multi-file push does not: it reads the branch
tip at push time, builds a tree from the contents supplied, and commits with that
tip as parent. The ref update is a clean fast-forward and succeeds — while
replacing any change made since the caller read those files, in a perfectly valid
commit with no conflict and no error.

This matters because atomic multi-file commits are a konspekt requirement: entity,
edges and source land together, so writing one file at a time is not an option.
The konspekt R/W API therefore checks every file's blob SHA against what the
caller read, aborts if any differs, and only then builds the tree and updates the
ref without force.
