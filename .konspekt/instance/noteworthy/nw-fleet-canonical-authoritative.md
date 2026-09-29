```yaml
id: nw-fleet-canonical-authoritative
kind: decision
review: accepted
provenance:
  sourceRef: 77bc1cbe2ce94b1bff2412cc27581f4385bc7851
  contentHash: 77bc1cbe2ce94b1bff2412cc27581f4385bc7851
  conversationId: fleet-spec-review
  timestamp: 2026-09-29T02:51:44Z
  confidence: 0.9
createdAt: 2026-09-29T02:51:44Z
updatedAt: 2026-09-29T02:51:44Z
```
# Noteworthy: canonical is authoritative; the fleet proposed ref is a derived index

The committer folds each verified proposal **onto canonical** as `review:
proposed`, so proposal state lives in the instance tree the shipped readers
already open (implementation-zero, the IntelliJ plugin), reconciling fleet mode
with `REVIEW.md` ("the durable instance is a mix of accepted and proposed").

**Canonical is authoritative for proposal state.** The durable `proposed` ref is
a **derived index** — pending / accepted / rejected with canonical-commit
pointers — that the writer may rebuild by scanning `review` fields and accept
records. Because canonical holds the payload, a crash between the fold commit and
a `proposed`-ref update cannot make the store lie: the ref is refreshed from
canonical, never canonical from the ref.

This supersedes [[nw-fleet-durable-proposed-ref]], whose core survives: proposals
still outlast an agent's worktree teardown (canonical, not the ref, now provides
that durability), and rejected stays a first-class retained state. What narrows
is the ref's role — from the authoritative payload record to a rebuildable state
index. Acceptance folds in place: bless is a field-only commit that flips
`review` to `accepted` and appends the accept record, re-copying no source and
re-authoring no prose.

Scopes [[task-agent-fleet]]; supersedes [[nw-fleet-durable-proposed-ref]].
