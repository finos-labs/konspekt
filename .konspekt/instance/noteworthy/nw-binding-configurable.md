```yaml
id: nw-binding-configurable
kind: decision
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.75
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Noteworthy: Binding requirement is configurable per instance

Whether an unbound conversation is a legal state is set per instance via
`binding: required | optional`. Under `optional` (dogfooding), "none / not this
one" is a valid answer, recorded as a waypoint marking the declined binding, so
the absence is itself queryable and mandatory binding does not push trivial chats
out to an untracked tool. Under `required` (enterprise / audit), there is no
legal unbound path. The opening ask is unconditional either way; the config only
decides whether a decline is an accepted answer.

Placement: recorded in **both** the portable `project.md` (as a spec-defined
field, so conformance can read it) and named in `.konspekt/OPERATING.md` (this
instance's chosen value and how the declined-binding waypoint is written).
