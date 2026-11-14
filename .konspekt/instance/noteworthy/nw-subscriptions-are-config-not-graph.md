```yaml
id: nw-subscriptions-are-config-not-graph
kind: constraint
status: active
review: accepted
provenance:
  sourceRef: ni:///sha-256;jP89OKyOY1aDWLN50poVvAREdWHc6ccXM4sWOn5tup0
  timestamp: 2026-07-19T14:30:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 05f79ce4a294a4a0251a6feef26b5a1d287ea16e
    contentHash: 05f79ce4a294a4a0251a6feef26b5a1d287ea16e
createdAt: 2026-07-19T14:30:00Z
updatedAt: 2026-07-19T14:30:00Z
```
# Noteworthy: notification subscriptions are repo config, never graph

Notification subscriptions live in `.konspekt/notify.yml`, a sibling of
`instance/` — never inside the graph. Who wants an email is a fact about a
consumer, not a fact about the project. Admitting it to the entity set would
require a Person entity, which drags assignment, ownership, and permissions
behind it, and would put per-consumer preference into shared project state.

Config-as-code in the repo is still right: versioned, diffable, reviewable, the
CODEOWNERS shape. A conformant reader ignores the file entirely, so an instance
with no notifier is still complete and the manual re-upload probe still passes.

Corollary: no `important: true` flag on entities. Notability is already curated
at write time — the decision rule promotes a decision to a Waypoint only if it
is an inflection point worth seeing on the timeline. A notifier reads that
existing signal rather than duplicating it.
