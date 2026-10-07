# Transitions

Append-only log of every `review` and `status` assignment in this instance, for
entities and edges, one row per assignment in the order written
(`spec/architecture/SERIALIZATION.md` § Transitions). `ref` is `type:id` or
`edge:<id>`. An empty `from` marks a birth row. `source`, when present, is the
`sources/` excerpt holding the human acceptance or authority verb. `by`, when
present, is the principal that wrote the value; it is required on a row that
writes `accepted` once the instance declares principals
(`spec/architecture/AUTHORITY.md`).

A new instance starts with no rows: it has no atoms yet, so the first write of
each atom appends that atom's birth row. The file's presence opts the instance
into state history — an instance without it is v1-conformant and records none.

| ref | field | from | to | timestamp | source | by |
|-----|-------|------|----|-----------|--------|----|
