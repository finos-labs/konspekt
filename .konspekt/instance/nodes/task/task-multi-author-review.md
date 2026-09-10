```yaml
id: task-multi-author-review
type: task
title: Support multiple human authors on one instance
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-08-28T11:49:13Z
review: proposed
provenance:
  sourceRef: 59f0929da44315acea7393b38a6a9db554f5d523
  contentHash: 59f0929da44315acea7393b38a6a9db554f5d523
  timestamp: 2026-08-28T11:49:13Z
  confidence: 0.9
createdAt: 2026-08-28T11:49:13Z
updatedAt: 2026-08-28T11:49:13Z
```
# Task: Support multiple human authors on one instance

Today one person proposes and accepts. Open the model to several people on one
instance without weakening propose→accept.

Open questions, roughly in dependency order:

**Where accept authority lives.** A maintainers list in `project.md` names who
can flip `review` to accepted. Keeping it in config rather than the backing
store means the store stays read/write only and the authority does not move
when the transport does.

**No proposer accepts.** Neither a human nor an agent can accept its own or
another's proposal; the maintainers list is the only source of the accept
right.

**Concurrent writes to the edge table.** Several authors pushing at once produce
non-fast-forward conflicts on the single `edges.md`. Retry covers two writers,
not a room of them. Per-author proposal branches merged on accept, or a write
queue, are the candidates — this is the hardest open part and is shared with
`task-agent-fleet`.

Success is two people proposing and one designated maintainer accepting on the
same instance with no lost edges.
