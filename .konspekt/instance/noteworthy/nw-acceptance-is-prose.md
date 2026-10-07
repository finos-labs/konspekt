```yaml
id: nw-acceptance-is-prose
kind: decision
review: accepted
provenance:
  conversationId: authority-verb-usage-2026-10-07
  timestamp: 2026-10-07T17:05:00Z
  confidence: 0.9
createdAt: 2026-10-07T17:05:00Z
updatedAt: 2026-10-07T17:05:00Z
```
# Noteworthy: acceptance is prose in v1; a named accept verb is deferred to async

In v1, plain acceptance is not a verb. A human accepting a maintainer's proposal
as it stands says so in the conversation, and the atom's `review` lands
`accepted` with no status change. Acceptance is a data-level `review` transition
the entity already carries, asserted where the human works and identical on every
binding (`spec/architecture/REVIEW.md`, `spec/architecture/TRANSPORT.md`); it
needs no vocabulary.

The six authority verbs (`pin`, `validate`, `refute`, `resolve`, `abandon`,
`lift`) are the exceptions: status transitions reconciliation detects poorly from
prose, so the human names them. Each carries acceptance and also moves a status
axis. `accept` is the common act every one of them contains, which is why the
spec's `Human vocabulary (v1)` table does not list it.

A named `accept <ref>` verb is deferred to an asynchronous binding, where no human
is present to accept in prose and a statusless atom (a concept, a fact, an edge)
has no authority verb to carry acceptance. A host may still surface an Accept
control in the synchronous UI: the button, the resulting status `accepted`, and
the prose that drives them are one `review` transition seen three ways.

Under single-individual synchronous authority this instance exercises only prose
acceptance and `resolve`. That is the expected shape: the revision verbs
presuppose contested claims or long-horizon drift that a propose-only agent behind
a hard accept gate rarely produces.

Notes [[investigation-authority-verb-usage]].
