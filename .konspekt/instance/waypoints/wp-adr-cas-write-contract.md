```yaml
id: wp-adr-cas-write-contract
kind: decision
subtype: adr
timestamp: 2026-09-20T20:00:00Z
review: proposed
provenance:
  sourceRef: df46fa543395c9f188893c8944453acff0a841bb
  contentHash: df46fa543395c9f188893c8944453acff0a841bb
  timestamp: 2026-09-20T20:00:00Z
  conversationId: cas-cursor-design
  confidence: 0.75
createdAt: 2026-09-20T20:00:00Z
updatedAt: 2026-09-20T20:00:00Z
```
# Waypoint: Versioned R/W contract with a scale-dependent edge-contention strategy

Adopt a compare-and-swap read/write contract as the concurrency seam: read →
`(content, version)`; write `(content, base_version)` → `ok | reject(current)`;
plus an opaque changes-since cursor. Backend-neutral — each binding realizes it.

**git binding.** An atomic multi-file write checks every file's blob SHA against
what the caller read and aborts if any differ, then builds the tree and updates the
ref without force ([[nw-multifile-push-clobbers-silently]]). The single `edges.md`
defeats per-file CAS because disjoint rows share one file
([[nw-edge-table-contends-under-cas]]); resolve it by **row-merge (C1)** — union by
edge id, replay the caller's added/changed rows onto the new base, and reject only
when two writers edit the **same** edge id (typically a `review` flip, which should
reach a human anyway). No serialization change; the reader is untouched.

**Scale.** C1 is sufficient for the non-enterprise case — one human and N agents.
At enterprise scale contention moves into an **underlying datastore** whose native
per-row CAS gives per-atom addressability directly (the "C2" outcome), rather than
hand-sharding git files into per-node edge files. Such a backend must buy back the
history, attribution, and diff git gives for free
([[nw-db-backend-needs-append-only-record]]).

Forced by [[concept-versioned-write-seam]]; consequences are a versioned R/W API in
`spec/architecture/` and its git binding. Marks [[task-atom-versioning-cas]]; shared
with [[task-multi-author-review]] and [[task-agent-fleet]]. Implementation is a later
branch; this records the decision.
