```yaml
id: nw-components-are-not-the-standard
kind: constraint
status: active
review: accepted
provenance:
  sourceRef: 251cd946ae4ba674a64d19978484c5ef49120d93
  contentHash: 251cd946ae4ba674a64d19978484c5ef49120d93
  timestamp: 2026-07-20T15:00:00Z
  confidence: 0.8
createdAt: 2026-07-20T15:00:00Z
updatedAt: 2026-07-20T15:00:00Z
```
# Noteworthy: the setup kit may ship what the standard does not require

The setup kit is allowed to ship capability that a conformant instance can
lack. A component under `setup/components/<id>/` is an add-on installed into a
live `.konspekt/`; an instance with none of them is complete, and the manual
re-upload probe passes without any of them. Conformance must never depend on a
component being installed.

This is what let the notifier move from bespoke to installable without touching
`spec/`. The alternative — treating anything the kit ships as thereby part of
the format — would push delivery mechanics, host permissions, and CI shape into
a spec a second implementer has to satisfy, which is the opposite of the
transport contract's dumb store.

Two consequences worth stating separately, because they are the ones that go
wrong:

**Installed files are a projection, never a tracking copy.** The component
directory is root; what lands in `.github/` or `.konspekt/` is derived from it
and regenerated with `--force`. `--check` reports the fork. This is the
`reference/` dual-authority failure again, and the fix is the same one: derive,
do not copy (`nw-derive-not-copy`). The single exception is a file the manifest
marks `seed: true` — the adopter's config, written once and never overwritten,
which is not a projection and is not checked for drift.

**A component may be uninstallable in a given binding, and that is not a
konspekt failure.** `notify` writes under `.github/workflows/`, which a GitHub
App or MCP connector cannot push without an explicit `workflows` scope — the
local write succeeds and the push is what is rejected. An adopter driving
konspekt through a connector therefore cannot install it. Because components are
outside the standard, this costs them nothing but the component; the instance
remains fully conformant and fully portable.

Corollary for future components: if a component's absence would make an instance
unreadable or unportable, it is not a component — it belongs in the spec, or it
does not belong in the kit.
