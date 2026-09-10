```yaml
id: task-signed-accepts
type: task
title: Signed accepts via a legally-bound persona
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-08T11:45:54Z
review: proposed
provenance:
  sourceRef: 679628fa02a009b6f129ff8805300eedefc5b699
  contentHash: 679628fa02a009b6f129ff8805300eedefc5b699
  timestamp: 2026-09-08T11:45:54Z
  confidence: 0.85
createdAt: 2026-09-08T11:45:54Z
updatedAt: 2026-09-08T11:45:54Z
```
# Task: Signed accepts via a legally-bound persona

Optionally require that a maintainer's accept be signed by a key. Off by
default; on wherever the legally-bound persona is assigned.

Open questions, roughly in dependency order:

**Personas generalize to a role with attached rules.** The engineer persona
attaches authoring rules; the legally-bound persona attaches a rule on the
accept operation — the accept must be signed. One concept, two uses.

**Assignment is both per-maintainer and instance-wide.** A single maintainer
can carry it, or an instance can require every maintainer carry it, mixing
bound and unbound acceptors otherwise.

**The persona attaches signing only.** What the key proves about real-world
identity is left to the external system that issued it; handle-to-person
binding is out of scope, with the key as the plug-in point.

Success is that an accept from a bound maintainer is invalid unless signed, and
the conformance checker rejects the unsigned case.
