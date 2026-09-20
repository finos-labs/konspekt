```yaml
id: wp-adr-changed-log
kind: decision
subtype: adr
timestamp: 2026-09-20T17:00:00Z
review: accepted
provenance:
  sourceRef: ff351a23b2e76030ec4b6a54ddc6d83e5f435393
  contentHash: ff351a23b2e76030ec4b6a54ddc6d83e5f435393
  timestamp: 2026-09-20T17:00:00Z
  conversationId: engineer-executed-provenance
  confidence: 0.8
createdAt: 2026-09-20T17:00:00Z
updatedAt: 2026-09-20T17:00:00Z
```
# Waypoint: Record code changes as a push-based, VCS-neutral changed-code log

Committed code changes are recorded in `changes/changed.md`, an append-only table
`| entity | commit | file |`: one row per (entity, commit, file), `entity` any
entity id, `commit` the revision that carried the change, `file` a repo-relative
path it touched. **Row order is commit order** — no per-row timestamp. This
parallels the executed-command log ([[wp-adr-executed-log]]), so a task carries
both what commands ran and what code changed.

Unlike commands, the change itself is not stored: it already lives in git,
recoverable by `commit` ([[nw-derive-not-copy]]). Only the legible projection
(which files) and the pointer (which commit) are kept. `commit` is an **opaque
revision token** ([[nw-commit-is-opaque-revision]]): the conformance checker
validates its shape only and no reader resolves it against a VCS, so the standard
stays VCS-neutral.

Rows are written **push-based at commit time** (the maintainer already holds the
SHA and file list from the commit just made), so a row trails its commit by one.
The rejected alternative was deriving the log by walking `git log --name-only` and
parsing `<entity-id>:` subject prefixes — lower friction, but it would make
generation git-specific, which the standard must avoid. Bookkeeping commits (only
`.konspekt/instance/**` or this log) are excluded; unmapped commits are dropped.

Forced by [[concept-record-all-executed]]; consequences are
`spec/personas/engineer/SPEC.md`, `spec/architecture/SERIALIZATION.md`,
`registry.mjs` (a `changeLog` declaration), `lib/conformance.mjs` (shape-only
validation), and a Changes tab in the detail drawer across both surfaces. Marks
[[task-record-code-changes]].
