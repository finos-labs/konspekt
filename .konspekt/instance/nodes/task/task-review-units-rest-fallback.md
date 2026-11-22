```yaml
id: task-review-units-rest-fallback
type: task
title: Let tools/review-units.mjs read pull requests over REST when GraphQL is unavailable
status: active
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-22T21:00:39Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;7fDk8KRnrurwcVIAX4yj0zd3K7wkWqIOae7DthaIgLM
  conversationId: deck-refresh
  timestamp: 2026-11-22T21:00:39Z
  confidence: 0.85
createdAt: 2026-11-22T21:00:39Z
updatedAt: 2026-11-22T21:00:39Z
```
# Task: Let tools/review-units.mjs read pull requests over REST when GraphQL is unavailable

`tools/review-units.mjs` reads the forge only through `gh api graphql` and
`gh repo view` (also GraphQL), so a session whose GitHub access is REST-only
cannot run it. A Claude Code cloud session is one; the deck-refresh session of
2026-11-22 ([[task-deck-refresh-ni-review-units]]) needed a wrapper to
regenerate the log.

- **Option.** `--api auto|graphql|rest`, default `auto`: GraphQL first,
  REST when the GraphQL call fails, with a one-line notice when it falls back.
- **REST path.** Pull requests from
  `GET repos/{repo}/pulls?state=all&sort=created&direction=asc` (paginated),
  mapped to the same unit shape: `merged_at` set means `merged`;
  `merge_commit_sha` only when merged; timestamp `merged_at`, else
  `closed_at`, else `created_at`. Commits per pull request from
  `GET repos/{repo}/pulls/{n}/commits`, one call each.
- **No other GraphQL dependency.** The default branch from
  `gh api repos/{repo} -q .default_branch`; the repository, when `--repo` is
  omitted, from the `origin` remote URL.
- **Test.** A pure `restUnit(pr, commits)` mapping in
  `test/review-units.test.mjs`, covering an open and a closed unmerged pull
  request.
- **Acceptance.** On konspekt, `--api rest` and `--api graphql` produce
  identical logs.

Lands as a direct push to `main`. The conformance component ships the tool
([[task-conformance-ships-review-units]]), so cdm-collateral picks it up at its
next kit refresh.

Decomposes [[investigation-task-pr-map]].
