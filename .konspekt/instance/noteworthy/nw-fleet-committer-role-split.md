```yaml
id: nw-fleet-committer-role-split
kind: decision
review: accepted
provenance:
  sourceRef: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  contentHash: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  conversationId: fleet-implementation
  timestamp: 2026-09-28T23:07:00Z
  confidence: 0.95
createdAt: 2026-09-28T23:07:00Z
updatedAt: 2026-09-28T23:07:00Z
```
# Noteworthy: the committer splits into a deterministic writer and an LLM review assistant

"Committer" carries two roles that must stay apart. The **write path is
deterministic**: appending a proposal, and on human approval writing the
admitted atoms to canonical, is hash-verify, atomic append, DCO trailer,
post-write SHA recheck. No model sits on that path, so the graph never lands
partially wired and the accepted commit carries the human `Signed-off-by`.

The **"which proposals can I commit" interface is a separate LLM review
assistant**. It reads the queue, clusters and summarizes, surfaces dependency
edges and near-duplicate hints, and relays the human's selection to the
deterministic committer. It holds **no write authority to canonical**; it asks
and reports.

The single human acceptor is intact: the assistant speaks, the human's answer is
the accept, the deterministic committer executes only the named subset. The
natural-language review surface sits on the read side, never on the write side.

Scopes [[task-agent-fleet]]; the human-only accept default is
[[nw-human-only-accept-default]].
