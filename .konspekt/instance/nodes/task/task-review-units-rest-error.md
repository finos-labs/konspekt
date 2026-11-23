```yaml
id: task-review-units-rest-error
type: task
title: Report a one-line error, not a stack trace, when tools/review-units.mjs cannot read pull requests over REST
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-23T01:29:20Z
review: proposed
provenance:
  sourceRef: ni:///sha-256;-JF9esqLGGVGyn6ZnbAh6K4Hd6AW0ux8MFTMoqYR3Vs
  conversationId: review-units-graphql-error
  timestamp: 2026-11-23T01:29:20Z
  confidence: 0.7
createdAt: 2026-11-23T01:29:20Z
updatedAt: 2026-11-23T01:29:20Z
```
# Task: Report a one-line error, not a stack trace, when tools/review-units.mjs cannot read pull requests over REST

Follows [[task-review-units-graphql-error]].

**Observed.** With an invalid `GH_TOKEN`, `node tools/review-units.mjs --check --api auto --branch origin/main` prints the one-line GraphQL fallback notice, then the REST call fails and Node prints its uncaught-error output with a stack trace. `--api rest` calls the same `restUnits()` path; it was not run.

**Cause.** `githubUnits()` converts only a forced-GraphQL failure to `ForgeError`; a failure in `restUnits()` propagates uncaught through `main()`. `defaultRef()` (when `--branch` is omitted) calls `gh` before `githubUnits()` and is also uncaught.

**Done when.** A REST failure under `--api auto` or `--api rest`, and a `defaultRef()` failure, each print one stderr line naming the mode and `gh`'s first-line reason (`failureReason()`), and exit non-zero with no stack trace. `test/review-units.test.mjs` covers the REST case with a failing REST stub.

Decomposes [[investigation-task-pr-map]].
