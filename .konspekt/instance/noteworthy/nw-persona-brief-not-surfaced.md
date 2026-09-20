```yaml
id: nw-persona-brief-not-surfaced
kind: fact
review: proposed
provenance:
  sourceRef: f02d18ef587d9270ee87345d74834b74c21236f7
  contentHash: f02d18ef587d9270ee87345d74834b74c21236f7
  timestamp: 2026-09-20T12:00:00Z
  conversationId: intellij-plugin
  confidence: 0.85
createdAt: 2026-09-20T12:00:00Z
updatedAt: 2026-09-20T12:00:00Z
```
# Noteworthy: The engineer-layer obligations went unused because the brief never entered agent context

Root cause of the unused engineer-layer obligations (no `commands/` channel, zero
`executed` edges, and no new ASR/ADR since the layer was introduced): the layer's
operating brief `spec/personas/engineer/AGENTS.md` never reached a working agent.
It was not injected by the session-start hook, not referenced by root `AGENTS.md`,
and not covered by `konspekt-atom-readiness` — which stays persona-agnostic by
design ([[concept-asr-persona-layering]]). So honoring the obligations depended on
an agent spontaneously reading the brief, the silent-drift failure atom-readiness
exists to prevent but does not extend to a layer.

Evidence: the `commands/` directory was absent and `executed` edges numbered zero
instance-wide; the only prior ASR/ADR (`concept-asr-persona-layering`,
`wp-adr-engineer-layer`) were created in the same commit that introduced the layer,
describing the layer itself rather than ongoing work.

Remediation applied: `load-mandatory-skills.sh` now parses `project.md`'s
`personas:` and injects each active layer's `AGENTS.md` at session start, and
`AGENTS.md §1` documents it. The core forcing function is left persona-agnostic,
so the layer duty is surfaced by injection rather than by leaking layer vocabulary
into the core skill.
