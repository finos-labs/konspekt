```yaml
id: nw-fleet-sandbox-committer-egress
kind: decision
review: accepted
provenance:
  sourceRef: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  contentHash: 5f34d6cb478b39588f700dc7cd3d731d9c6efe2e
  conversationId: fleet-implementation
  timestamp: 2026-09-28T23:07:00Z
  confidence: 0.9
createdAt: 2026-09-28T23:07:00Z
updatedAt: 2026-09-28T23:07:00Z
```
# Noteworthy: the fleet runs in a sandbox with the committer host as the declared egress

The fleet is designed to run **inside a sandbox** (an OpenShell-style egress
sandbox) with the **committer host as the single allowed egress**. Agents make
suggestions to the committer host rather than each pushing to a git remote, so
the egress surface is one narrow expected destination instead of N.

N agents writing to one shared host they are all allowed to use is exactly the
cross-sandbox pattern an egress monitor flags (fan-in and write-volume drift).
konspekt's answer lives one layer up, in the content: every write is an
origin-tagged, content-addressed proposal, inert until a single human acceptor
accepts it. The coordination repo **is** the record, so there is no covert side
channel to go dark. The committer host is therefore **declared as expected
egress** so a fleet detector does not flag normal operation.

Enforcement of the sandbox and its egress stays **outside konspekt's scope**;
konspekt supplies the accountable payload on that egress. The two stack as
separate layers.

Scopes [[task-agent-fleet]].
