```yaml
id: nw-fleet-in-place-canonical
kind: decision
review: accepted
provenance:
  sourceRef: e20f035d350f11acbad9c6e02511b56b80ef8ca6
  contentHash: e20f035d350f11acbad9c6e02511b56b80ef8ca6
  conversationId: fleet-uat-committer-2026-10-22
  timestamp: 2026-10-22T12:44:01.258Z
  confidence: 0.85
createdAt: 2026-10-22T12:44:01.258Z
updatedAt: 2026-10-22T12:44:01.258Z
```
# Noteworthy: the UAT uses the primary repo in place as canonical

Decision taken for the 2026-10-21 fleet dogfood UAT: `fleet_uat_test` is checked
out in the primary repo `C:/Users/denis/IdeaProjects/konspekt` and used directly
as the committer's canonical worktree — no separate or forked canonical worktree.

This works because the committer commits via `commitAll` = `git add -A`
(`implementations/fleet/app/git.mjs`), so the canonical tree must be kept clean;
`.konspekt-fleet/` (the runtime index) is gitignored (`.gitignore:10`), so
`git status` stays clean after a pass. Scoped to the dogfood UAT; not a standard
requirement — a second adopter is free to run a dedicated canonical worktree.

Ventured against [[task-fleet-worktree-committer]].
