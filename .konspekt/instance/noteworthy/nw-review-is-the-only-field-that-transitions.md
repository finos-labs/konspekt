```yaml
id: nw-review-is-the-only-field-that-transitions
kind: fact
review: accepted
provenance:
  sourceRef: ni:///sha-256;PhChJRiub0W3x3Kwz6F-8BXoB-TJXuxOHuBEqwvN60Q
  timestamp: 2026-07-19T22:15:00Z
  confidence: 0.8
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: fdead8230bc0ff2436ef21a3b224e35a12eb57b8
    contentHash: fdead8230bc0ff2436ef21a3b224e35a12eb57b8
createdAt: 2026-07-19T22:15:00Z
updatedAt: 2026-07-19T22:40:00Z
```
# Noteworthy: review is the only field that transitions, so it is the notifiable signal

The notifier's first event set defined the signal as **creation**: an `id`
absent from the parent commit, carrying `review: accepted`. That was correct
against the instance as it stood, where every entity was born accepted.

It stopped being correct hours later. Once the atom-readiness skill was fixed so
proposals actually persist as `proposed`, an atom is born unaccepted and blessed
afterwards by an edit. A creation-keyed event then matches nothing: at birth the
`id` is new but the review is wrong, and at acceptance the review is right but
the `id` is not new.

The corrected signal is **an entity becoming `accepted`** — at birth or later —
still keyed on `id` rather than path (`nw-rename-fires-as-creation`).

The general point is sharper than the fix. `nw-state-written-at-birth-not-transitioned`
established that `status` is authored rather than moved, which is why the
authority-verb transitions make a poor thing to watch. `review` is the exception:
it is the one field in the model that genuinely changes value on an existing
entity, and it now does so on nearly every atom. A differ that wants a real
signal should watch the field that moves.

Two corollaries worth keeping. A watched event set is coupled to the *authoring
discipline*, not only to the schema — changing how atoms are written silently
invalidated a config that no schema check would have flagged. And this is direct
evidence for the low confidence on `nw-notify-config-precedes-consumer`: a
config written before its consumer went stale before the consumer existed.
