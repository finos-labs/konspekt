```yaml
id: nw-adopter-tooling-zero-config
kind: decision
review: proposed
provenance:
  sourceRef: f8a5f0f62d7fe578010d0dcf3e6e268dba82f174
  contentHash: f8a5f0f62d7fe578010d0dcf3e6e268dba82f174
  conversationId: adopter-kit-binding-parity
  timestamp: 2026-10-15T01:09:37Z
  confidence: 0.8
createdAt: 2026-10-15T01:09:37Z
updatedAt: 2026-10-15T01:09:37Z
```
# Noteworthy: adopter tooling needs no configuration

Tooling the adopter kit installs works without the adopter writing any
configuration. The governing test, in the user's words: "the less people need to
worry about it - the better."

First application, the binding audit. The `conformance` component installs it as
`.konspekt/lib/binding-audit.mjs` with a `konspekt-binding-audit.yml` workflow.
It finds the repo root by walking up to `.konspekt/instance/`, so one file runs
from konspekt's `tools/` and an adopter's `.konspekt/lib/`. With no
`.konspekt/binding-audit.json` it starts after the commit that added
`project.md` (the adoption commit). It skips, and passes, unless the instance is
`binding: required` and has a changed-code log, so an adopter not using the
engineer layer does not get a CI job that fails on every commit. A baseline or an
exemption is an opt-in override, not a prerequisite.

The alternative considered was leaving the audit konspekt-only and changing the
engineer brief to say adopters lack it. Rejected: the brief's binding obligation
would then have no detection surface in adopter repos.
