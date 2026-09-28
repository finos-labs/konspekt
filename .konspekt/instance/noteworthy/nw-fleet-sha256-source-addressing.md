```yaml
id: nw-fleet-sha256-source-addressing
kind: decision
review: accepted
provenance:
  sourceRef: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  contentHash: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  conversationId: fleet-implementation
  timestamp: 2026-09-28T23:07:00Z
  confidence: 0.9
createdAt: 2026-09-28T23:07:00Z
updatedAt: 2026-09-28T23:07:00Z
```
# Noteworthy: fleet payloads address the source excerpt by SHA-256

A fleet proposal payload addresses its source excerpt by **SHA-256 over the
verbatim excerpt**, carried in the payload frontmatter. The committer maps that
hash to the canonical source filename on accept. This moves source addressing
off the git blob SHA and onto a transport-independent hash, which is the change
[[task-enterprise-persistence]] needs, so the fleet payload stays
forward-consistent with the storage interface.

The switch applies to **new proposals only**. Existing `sources/<gitBlobSHA>.md`
files keep their names until a dedicated migration pass re-addresses them, so the
fleet spec does not carry a repo-wide rename. That migration is tracked as
[[task-sources-sha256-migration]] under [[goal-collaboration]].

Scopes [[task-agent-fleet]]; refines [[task-provenance-model]]; forward-consistent
with [[task-enterprise-persistence]].
