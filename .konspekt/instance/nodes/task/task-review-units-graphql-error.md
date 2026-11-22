```yaml
id: task-review-units-graphql-error
type: task
title: Report a one-line error, not a stack trace, when tools/review-units.mjs --api graphql cannot reach GraphQL
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-22T21:52:22Z
review: proposed
provenance:
  sourceRef: ni:///sha-256;xR2twISr5zepWtPHieE0dfYF_YP_RtzRFbnzuA28gWo
  conversationId: v02-demo-release-summary
  timestamp: 2026-11-22T21:52:22Z
  confidence: 0.8
createdAt: 2026-11-22T21:52:22Z
updatedAt: 2026-11-22T21:52:22Z
```
# Task: Report a one-line error, not a stack trace, when tools/review-units.mjs --api graphql cannot reach GraphQL

Follows [[task-review-units-rest-fallback]]. Reported from the cdm-collateral adopter
(`finos-hack/cdm-collateral`, `task-konspekt-review-units-graphql-error` there), which vendors this tool at
`73b98aa`.

**Observed.** In a session where `gh api graphql` is refused, `node tools/review-units.mjs --check --api graphql`
exits 1 and prints Node's uncaught-error output: `Error: Command failed: gh api graphql -f query=...` and a stack
trace. `--api auto` on the same failure prints a one-line notice and falls back to REST.

**Cause.** In `githubUnits()`, the `catch` around `graphqlUnits(repo)` rethrows when `api === "graphql"`
(`tools/review-units.mjs` line 266 at `73b98aa`), and `main()` does not catch it.

**Done when.** With `--api graphql` forced and GraphQL unavailable, the tool prints one line on stderr naming the
mode and `gh`'s first-line reason, as the `auto` notice does (for example `review-units: GitHub GraphQL
unavailable (<reason>); --api graphql forces GraphQL; use --api auto or --api rest`), and exits non-zero with no
stack trace. `test/review-units.test.mjs` covers it with a failing GraphQL stub. Adopters take the fix by copying
the tool (`setup/init.mjs --check` then shows the drift).
