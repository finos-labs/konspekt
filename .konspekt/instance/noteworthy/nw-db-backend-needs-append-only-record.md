```yaml
id: nw-db-backend-needs-append-only-record
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
# Noteworthy: A database backend has to buy back what git gives free

Git supplies history, attribution and diff without being asked, and konspekt
leans on all three: acceptance is evidenced by a commit, and review happens over
a diff.

A document or relational backend has none of that by default. To be conformant it
has to carry an explicit append-only record of every write and who made it, and
to produce something reviewable in place of the diff. Whether that record is
required by the storage interface or left to implementations is open, but a
backend without it loses the property the project is built on.
