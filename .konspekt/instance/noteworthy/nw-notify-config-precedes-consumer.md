```yaml
id: nw-notify-config-precedes-consumer
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;YXrU034gCgq-j1C61KzXJSKD5nk5JQbnTIoWwA0rqMs
  timestamp: 2026-07-19T21:10:00Z
  confidence: 0.55
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 5234c7ba18c1c14c71aaf05c56d9475adfb96da0
    contentHash: 5234c7ba18c1c14c71aaf05c56d9475adfb96da0
createdAt: 2026-07-19T21:10:00Z
updatedAt: 2026-07-19T22:40:00Z
```
# Noteworthy: the notification config was written before any consumer of it

`.konspekt/notify.yml` was created with no watcher implementing it. The claim is
that this is the right order: the file is the contract a watcher will be written
against, and the reasoning behind its three constraints — subscriptions are
config not graph, events are creation and supersedes, payloads are
reference-only — is captured in its comments while it is freshest, rather than
left for a future author to reconstruct from the graph.

**Why the confidence is low.** The opposite case is real and this instance has
already recorded it. A specification nothing executes drifts from whatever
eventually executes it, which is the dual-authority failure `nw-derive-not-copy`
warns about, and the same shape as the finding that `REVIEW.md` specified a
review queue that had never run. An unread config file is exactly that pattern:
carefully reasoned, unexercised, and therefore unfalsified. Writing it may have
bought clarity now at the cost of a document that looks authoritative while
never having been tested against a consumer.

The counter-argument is that a config file is cheap to change and carries no
behaviour, so the drift risk is bounded — unlike a spec that implementers
conform to. Whether that distinction holds is the part this atom is least sure
of.

**Disposition.** Accepted 2026-07-19, after the watcher was written — and the
ordering claim was partly falsified in the interval. The event set in
`notify.yml` went stale before any consumer had read it, because the authoring
discipline changed underneath it (`nw-review-is-the-only-field-that-transitions`).
Accepted as an accurate record of the reasoning and its outcome, not as a
vindication of it: the 0.55 was, if anything, generous.
