```yaml
id: nw-notification-payload-is-reference-only
kind: constraint
status: active
review: accepted
provenance:
  sourceRef: ni:///sha-256;jP89OKyOY1aDWLN50poVvAREdWHc6ccXM4sWOn5tup0
  timestamp: 2026-07-19T14:45:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 05f79ce4a294a4a0251a6feef26b5a1d287ea16e
    contentHash: 05f79ce4a294a4a0251a6feef26b5a1d287ea16e
createdAt: 2026-07-19T14:45:00Z
updatedAt: 2026-07-19T14:45:00Z
```
# Noteworthy: notification payloads carry references, not content

A notification carries entity `id`, type, the event, a link to the commit, and a
link to the source excerpt under `sources/`. It does not carry entity body text.

The reason is an access asymmetry. Repo watchers hold repo access by definition;
an address in `notify.yml` holds whatever the payload hands it. On a private
instance, anyone who can land a change to that file can subscribe an address they
control and begin receiving project content without ever holding repo access —
the config file becomes an exfiltration path. Reference-only payloads close it:
reading anything substantive requires following a link and authenticating.

The sources link resolves correctly for entities born accepted, where
construction and acceptance are the same act. Where an entity's state later
changes, the fired verb must write a new source excerpt for that exchange and
`provenance` must be repointed at it, so provenance always justifies the current
state. Entities predating the content-addressing discipline carry only a
`conversationId` and need a fallback.
