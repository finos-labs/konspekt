# Principals

The identities declared by this instance (`spec/architecture/AUTHORITY.md`).
`kind` is `human` or `agent`. `roles` lists `grantor` for a principal that may
issue and revoke grants. `key` is reserved for the signing key that
`task-signed-accepts` will define and is empty until then.

Fleet proposer handles are declared here as grantless agent principals: they
hold no grant, so they propose and never accept, and the committer records the
proposing handle in the transition `by` column at fold (`task-agent-fleet`).

| id | kind | roles | key |
|----|------|-------|-----|
| denisurusov | human | grantor |  |
| claude | agent |  |  |
| spec-writer | agent |  |  |
| skill-builder | agent |  |  |
| presentation-writer | agent |  |  |
