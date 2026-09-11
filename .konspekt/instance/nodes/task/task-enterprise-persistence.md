```yaml
id: task-enterprise-persistence
type: task
title: A durable store other than git
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-08-28T11:49:13Z
review: proposed
provenance:
  sourceRef: 59f0929da44315acea7393b38a6a9db554f5d523
  contentHash: 59f0929da44315acea7393b38a6a9db554f5d523
  timestamp: 2026-08-28T11:49:13Z
  confidence: 0.9
createdAt: 2026-08-28T11:49:13Z
updatedAt: 2026-08-28T11:49:13Z
```
# Task: A durable store other than git

git is one backing store. Some adopters need an enterprise database or object
store with the same guarantees. Define a storage interface so git is one
implementation and the enterprise store another, with neither special-cased.

Open questions, roughly in dependency order:

**The interface surface.** Read blob; atomic write of excerpt, entity, and
edges in one transaction; list; content-address. Any store that satisfies these
can back an instance.

**Content addressing decouples from git.** The source filename is currently the
git blob SHA. Move to a SHA-256 over the verbatim excerpt that git carries but
no longer defines, so the address is stable across stores. This touches
`concept-content-addressed-provenance` and `task-provenance-model`.

**The neutral read path holds.** An enterprise store must expose a plain read
path, not only an API, or it fails the manual re-upload probe and becomes
lock-in.

**The store adjudicates nothing.** It stays read/write only; review stays in
the conversation.

Success is an instance running on a non-git store, passing the conformance
checker, with content addresses matching what git would produce for the same
excerpts.
