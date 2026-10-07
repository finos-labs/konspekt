# Grants

Append-only log of accept rights in this instance
(`spec/architecture/AUTHORITY.md`). Each row grants or revokes the right of one
principal to accept the atoms inside one scope. `scope` is `*` for the entire
graph or `type:id` for one entity and its subgraph.

Backfill note: the first row records the accept authority this instance has had
since its first commit on 2026-06-21, one human holding the grantor role and the
accept right for the entire graph (`nw-instance-single-individual-authority`).
It has no `source`, because that arrangement predates this table.

| scope | acceptor | action | grantor | timestamp | source |
|-------|----------|--------|---------|-----------|--------|
| * | denisurusov | grant | denisurusov | 2026-06-21T12:10:53Z |  |
