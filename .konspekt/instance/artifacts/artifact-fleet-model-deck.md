```yaml
id: artifact-fleet-model-deck
name: The fleet model in one sitting
kind: deck
location: docs/decks/fleet-model.md
createdAt: 2026-10-21T00:00:00Z
updatedAt: 2026-10-21T00:00:00Z
review: proposed
provenance:
  sourceRef: f209adbb9fab36c162ad7968322aecd89969f87a
  contentHash: f209adbb9fab36c162ad7968322aecd89969f87a
  conversationId: fleet-uat-presentation-writer
  timestamp: 2026-10-22T02:19:11.372Z
  confidence: 0.62
```
# Artifact: The fleet model in one sitting

A short deck for a developer about to write their first konspekt proposer role.
It delivers one takeaway: the fleet is safe because of a single rule — many
agents propose concurrently, each into its own outbox worktree; exactly one
committer folds those proposals onto canonical; and only the human accepts.
Six slides walk that rule end to end — why one reviewer over N agents, the
worktree-outbox layout, a proposal's life from `review: proposed` to blessed,
and where the newcomer's own role plugs in — so a reader finishes knowing what
they may write and what they must never touch.
