```yaml
id: nw-payload-reference-only-admits-enums
kind: decision
review: accepted
provenance:
  sourceRef: 35a73e563bcbe637251e64a523dbbb5cccd6cca7
  contentHash: 35a73e563bcbe637251e64a523dbbb5cccd6cca7
  timestamp: 2026-07-20T17:00:00Z
  confidence: 0.85
createdAt: 2026-07-20T17:00:00Z
updatedAt: 2026-07-20T17:00:00Z
```
# Noteworthy: the reference-only payload admits enum metadata, not text

Supersedes `nw-notification-payload-is-reference-only`, which is upheld in
substance and widened by exactly one carve-out.

The rule stands: a notification carries entity id, entity type, event, commit
URL, and a link to the source excerpt — never entity body text. The reason is
unchanged and is a security reason, not a tidiness one. Repo watchers hold repo
access by definition; an address in `notify.yml` holds whatever the payload
hands it, so on a private instance anyone able to land a change to that file
could subscribe an address they control and receive project content without ever
holding repo access. Reference-only closes that path.

**The carve-out: an event may carry the enum values it is about.** The
`status_changed` event is the case that forces it — "status_changed: task-foo"
with no values is not a notification, it is a ping. So the payload carries
`open -> resolved`.

This does not reopen the exfiltration path, and the test is what the payload
leaks to someone with no repo access. `open -> resolved` leaks nothing: the
vocabulary is fixed, published in the spec, and identical across every konspekt
instance in the world. An entity's `text` or `definition` is the opposite — it
is the project. The line is **closed vocabulary vs. authored content**, not
"metadata vs. body," which would be too loose: `location` on an artifact is
metadata and does leak repo structure.

Scope, so this does not creep. Admitted: `status`, and `review` if an event ever
needs it. Not admitted, without a further decision: `title`, `name`, `label`,
`summary`, `text`, `definition`, `location`, `aliases`. If a future event needs
one of those to be intelligible, that is a signal the event is wrong, not that
the rule should widen again.

**Deliberately amended rather than stretched.** A security constraint that
quietly accumulates exceptions stops being a constraint. Each widening should
cost a superseding atom that states what was admitted and why.
