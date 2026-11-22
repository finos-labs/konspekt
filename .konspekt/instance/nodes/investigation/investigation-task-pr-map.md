```yaml
id: investigation-task-pr-map
type: investigation
title: Task-to-pull-request traceability as a general konspekt practice
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-22T15:44:03Z
review: proposed
provenance:
  sourceRef: ni:///sha-256;V4ue5VrR-HzhOFhkTtP6xvzqKqDGszyxRwY0MkHjWII
  conversationId: task-pr-map
  timestamp: 2026-11-22T15:44:03Z
  confidence: 0.7
createdAt: 2026-11-22T15:44:03Z
updatedAt: 2026-11-22T15:44:03Z
```
# Investigation: Task-to-pull-request traceability as a general konspekt practice

**Question.** Should konspekt, in its spec or in a skill, make a map from each
task to the pull requests that delivered it a general practice, and if so, in
what form?

**Origin.** On `cdm-collateral` the human kept
`docs/analysis/cdm-workflow-task-map.md`, a hand-maintained table in which
each workflow row names its task and the pull request that built it (#5 to
#66). The human reports it was useful for traceability.

**What konspekt records today.** The engineer changed-code log
(`changes/changed.md`) binds each commit and file to an entity, and
`tools/binding-audit.mjs` checks that log. Nothing records the pull request,
which is the unit that is reviewed and merged, and the CDM map is maintained
by hand outside the instance.

**To determine.**

- Whether a pull request reference belongs in the instance as stored data
  (for example a log of entity, pull request URL, merge commit, timestamp),
  or is derived from the commits already bound (a forge query from commit to
  pull request) and rendered as a generated projection, the way `ROADMAP.md`
  is.
- Whether the practice is standard (persona `SPEC.md` and `registry.mjs`),
  host policy (`OPERATING.md`), or a skill only, and whether it stays
  forge-neutral, since a pull request is a forge concept and not a git one.
- How it holds up under squash and rebase merges, which replace the bound
  commit SHAs on `main`, and under direct-to-main work, which has no pull
  request.
- Whether the CDM map's other columns (workflow, CDM status, live spec) are
  project-specific and stay out of the general form.

Decomposes [[goal-accountability]].
