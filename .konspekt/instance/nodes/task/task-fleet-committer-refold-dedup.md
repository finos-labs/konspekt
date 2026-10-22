```yaml
id: task-fleet-committer-refold-dedup
type: task
title: Idempotent fold — stop re-fold clobbering blessed atoms
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-22T12:44:01.258Z
review: accepted
provenance:
  sourceRef: 5fbdc335b46a98612258524b7ce6b82d08a1eb6d
  contentHash: 5fbdc335b46a98612258524b7ce6b82d08a1eb6d
  conversationId: fleet-uat-committer-2026-10-22
  timestamp: 2026-10-22T12:44:01.258Z
  confidence: 0.85
createdAt: 2026-10-22T12:44:01.258Z
updatedAt: 2026-10-22T12:44:01.258Z
```
# Task: Idempotent fold — stop re-fold clobbering blessed atoms

Make `foldProposal` (`implementations/fleet/app/fold.mjs`) idempotent so a
`run-pass` over an outbox whose proposal was already folded does not clobber a
blessed atom back to `review: proposed` or duplicate its rows
([[nw-fleet-refold-clobbers-blessed]]).

Candidate approaches: dedup by proposal id already folded onto canonical, and/or
an incremental-outbox read that skips consumed proposals. Either removes the
manual consume-after-fold workaround now required between passes.

Decomposes [[task-fleet-worktree-committer]].
