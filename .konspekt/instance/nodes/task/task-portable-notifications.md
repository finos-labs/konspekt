```yaml
id: task-portable-notifications
type: task
title: Make notifications portable
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-07-19T23:50:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;ZFFCepedzS1zf-wWLU7oQBR3JUztxpxErxkoxbAPFfQ
  timestamp: 2026-07-19T23:35:00Z
  confidence: 0.75
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: b38b180d7178d8ca8c41044782fbd0158fd5de05
    contentHash: b38b180d7178d8ca8c41044782fbd0158fd5de05
createdAt: 2026-07-19T23:35:00Z
updatedAt: 2026-07-19T23:50:00Z
```
# Task: Make notifications portable

The notifier works on this instance and nowhere else. Get it to the point where
any konspekt instance can turn it on, without making GitHub a requirement of
adopting konspekt.

Open questions, roughly in dependency order:

**What is standard and what is scaffolding.** `notify.yml` and the event set
are host-neutral: subscriptions, three events, a reference-only payload. The
differ is Node plus git. Only the delivery step is GitHub-specific. If that
split is real, the first two are candidates for the spec and the third stays an
example binding — but the split is asserted, not yet drawn anywhere.

**How an existing instance opts in.** `init.mjs` scaffolds and refuses to
overwrite, so it cannot retrofit; this is the concrete case behind
`concept-instance-upgradeability`.

**The hardcoded instance path.** `konspekt-notify.mjs` pins
`.konspekt/instance`. It should read the location rather than assume it.

**Installation through a connector is blocked.** GitHub apps need an explicit
`workflows` permission to write `.github/workflows/`, which the MCP used here
does not hold — this instance's own workflow had to be moved by hand. Any
adopter driving konspekt through an MCP hits the same wall, so the setup path
has to account for it rather than discover it.

**Whether a drifting instance can even be watched.** The differ reads `id` and
`review` from fenced YAML front-matter. An instance that drifts on either
produces zero events silently, which is indistinguishable from nothing having
happened. `code_tracer` is unverified against the conformance checker, so this
is untested rather than known-good.

Success is a second instance receiving a notification it did not have a
hand-built workflow for.
