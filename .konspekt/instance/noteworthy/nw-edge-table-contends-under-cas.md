```yaml
id: nw-edge-table-contends-under-cas
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
# Noteworthy: One edge table makes per-atom CAS behave per file

Per-atom granularity only pays off where atoms are separately addressable. The
single edge table is one file, so two writers adding unrelated rows collide every
time even though their rows are disjoint — under compare and swap that becomes
the common rejection, not the rare one.

Either the API merges rows inside the edge table, or edges shard by owning node
so ordinary per-atom checks suffice. Sharding was already in view for multi-writer
work; concurrency makes it load-bearing rather than tidy.
