```yaml
id: task-edge-traversal-layout
type: task
title: Edges traversable by node
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-27T00:35:00Z
review: accepted
provenance:
  sourceRef: 2eda5a31d3d853894be5b0933ce34a60694d9f21
  contentHash: 2eda5a31d3d853894be5b0933ce34a60694d9f21
  timestamp: 2026-09-27T00:10:00Z
  confidence: 0.9
createdAt: 2026-09-27T00:10:00Z
updatedAt: 2026-09-27T00:35:00Z
```
# Task: Edges traversable by node

The single flat edge table (`edges/edges.md`) must be read whole to answer any
traversal, because there is no per-node neighbor lookup. In the re-establishment
pilot this cost about 19 KB of transport tax on one question, read only to reach
a handful of edge rows. Give edge storage a way to fetch a node's neighborhood
without scanning the whole table.

Directions to weigh:

**Shard by owning node.** The shard-by-owning-node idea raised for write
contention (`nw-edge-table-contends-under-cas`) also serves reads: a node's
outbound edges live together and are fetched without the rest.

**Edges-by-node query on the storage interface.** `task-enterprise-persistence`
defines read, write, list and content-address; add a neighbor query so a store
can serve a node's edges directly, with git's whole-file read as the reference
fallback.

**Keep the single logical table.** Whatever the physical layout, the edge set
stays one typed table semantically; sharding or indexing is a storage concern,
not a schema change, so `task-serialization-format` and the conformance checker
stay authoritative.

Success is fetching a node's edges without reading unrelated rows, on at least
one store, with the conformance checker still seeing one edge table.
