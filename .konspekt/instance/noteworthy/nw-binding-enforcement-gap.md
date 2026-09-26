```yaml
id: nw-binding-enforcement-gap
kind: fact
review: proposed
provenance:
  sourceRef: 4395f3ccb8e1747ca13f2869046c1cc71972422a
  contentHash: 4395f3ccb8e1747ca13f2869046c1cc71972422a
  conversationId: presentation-and-binding
  timestamp: 2026-09-26T17:00:00Z
  confidence: 0.75
createdAt: 2026-09-26T17:00:00Z
updatedAt: 2026-09-26T17:00:00Z
```
# Noteworthy: binding completeness has no detection mechanism

`binding: required` ([[concept-provenance-completeness]]) is enforced only at
extraction, by the maintainer's per-turn discipline (the propose step forced by
`konspekt-atom-readiness`). Nothing detects a failure of that discipline:
`lib/validate.mjs` validates only the files that exist, and a conversation that
was never captured produces no file to flag, so an unbound conversation passes
conformance clean.

Observed this session on the dogfood instance: the resolve-feature work was bound
(source + task/ADR/noteworthy), but the plugin 0.0.11 release, the presentation
refresh, and the LinkedIn posts were left unbound while `validate.mjs` reported 0
errors throughout — the exact "silent conversation" failure the invariant names.
The proximate cause was misclassifying docs / release / announcement work as
exempt "maintenance"; the persona layer exempts konspekt-maintenance *commands*
from command-provenance, which was over-generalized into "this work needn't bind."
The underlying condition is the absence of any detection at the commit or session
boundary.
