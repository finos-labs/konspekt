# Principals

The identities declared by this instance (`spec/architecture/AUTHORITY.md`).
`kind` is `human` or `agent`. `roles` lists `grantor` for a principal that may
issue and revoke grants. `key` is reserved for the signing key that
`task-signed-accepts` will define and is empty until then.

| id | kind | roles | key |
|----|------|-------|-----|
| denisurusov | human | grantor |  |
| claude | agent |  |  |
