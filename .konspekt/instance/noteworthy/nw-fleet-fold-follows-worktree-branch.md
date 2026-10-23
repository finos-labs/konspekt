```yaml
id: nw-fleet-fold-follows-worktree-branch
kind: decision
review: proposed
provenance:
  sourceRef: 09bb72e8c8aabdc7e1e84614f1036a3667788db6
  contentHash: 09bb72e8c8aabdc7e1e84614f1036a3667788db6
  conversationId: fleet-adopter-authority-preflight
  timestamp: 2026-10-23T19:46:29Z
  confidence: 0.75
createdAt: 2026-10-23T19:46:29Z
updatedAt: 2026-10-23T19:46:29Z
```
# Noteworthy: folds follow the canonical worktree's current branch, not the configured canonicalBranch

The committer folds onto the canonical worktree's **current** branch. `commitAll`
commits in the canonical worktree without checking out any branch; `canonicalBranch`
in `.konspekt/fleet/config/fleet.json` is used only by `setup` (to fork the outbox
branches) and as attach/`doctor` metadata (`loadFromConfig` takes
`cfg.canonicalBranch || currentBranch(canonicalPath)`). The two can therefore
silently disagree — switch the worktree's branch without updating the config and
folds go to the new branch while `doctor` still reports the old one.

So switching the canonical branch has to move three things together: check out the
new branch in the canonical worktree (what actually redirects the fold target);
set `canonicalBranch` in the config to match; and refresh each proposer outbox
branch onto the new canonical by merging it in, so the proposer authors against the
new graph (binding resolves) and loads current skills. `teardown` + re-`setup` does
not achieve the refresh — `setup` creates outbox branches with `newBranch` and fails
on an existing one, and deleting the branch first drops un-folded proposals. The
proposer handle and its outbox branch name are keyed to the handle, not the canonical
branch, so they do not change. The procedure is written into the committer role
(`fleet-committer`, § Switching the canonical branch).

Proposed hardening: `run-pass` and `doctor` should assert the canonical worktree is
on the configured `canonicalBranch` and refuse on mismatch, turning the silent
disagreement into a loud one.

Scopes [[task-agent-fleet]]; relates to [[nw-fleet-config-is-setup-driver]] and
[[nw-fleet-proposer-skill-drift]].
