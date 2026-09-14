```yaml
id: nw-mongo-enterprise-postgres-oss
kind: decision
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  timestamp: 2026-09-14T16:00:00Z
  conversationId: app-design-101
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Noteworthy: MongoDB for enterprise, Postgres for open source

The store layer must not be git-only. Both database backends are kept: MongoDB as
the enterprise option and Postgres as the open-source one, with git remaining the
reference implementation.

Each satisfies the storage interface natively. Mongo: conditional update for
per-atom compare and swap, multi-document transactions for atomic multi-atom
writes, change-stream resume tokens for the cursor. Postgres: JSONB with GIN
indexes for documents, transactions for atomicity, a version column for compare
and swap, logical decoding for the cursor.

The licence difference is the reason for the split rather than a tie-breaker:
MongoDB's SSPL is not an OSI-approved licence, which matters for a foundation
project and for adopters whose policies stop there. Postgres carries no such
constraint.

One consequence: today's uncontrolled write paths — a git CLI and a GitHub
connector — have nowhere to land on a database backend, which leaves the R/W API
as the only route in.
