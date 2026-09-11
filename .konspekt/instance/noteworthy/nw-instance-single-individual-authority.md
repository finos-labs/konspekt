```yaml
id: nw-instance-single-individual-authority
kind: decision
review: accepted
provenance:
  sourceRef: 31313e0b47591b17ee59513996bf8f260728ceb7
  contentHash: 31313e0b47591b17ee59513996bf8f260728ceb7
  conversationId: roadmap-plan
  timestamp: 2026-09-11T14:00:00Z
  confidence: 0.9
createdAt: 2026-09-11T14:00:00Z
updatedAt: 2026-09-11T14:00:00Z
```
# Noteworthy: this instance runs single-individual accept authority

This konspekt dogfood instance runs **single-individual** accept authority: one
human is the sole maintainer and the only holder of accept authority. That human
proposes (together with the LLM maintainer) and accepts; accepted state is
written to `main` directly, as `.konspekt/OPERATING.md` describes. The scope is
one human being a sole contributor to a project.

This is the single-individual shape named in
[[nw-roadmap-generation-coupled-to-authority]] — the simplest accept-authority
configuration — and it is what lets [[task-roadmap-generation-workflow]] use the
simplest trigger: regenerate-and-commit `ROADMAP.md` on push-to-main.

The shape is host policy for this instance, not part of the konspekt standard.
`spec/architecture/REVIEW.md` keeps who-accepts out of the standard as host
policy, so the value is recorded in the operating envelope and not in the
portable `project.md`; no spec-defined config field for it exists yet. A second
adopter carries `.konspekt/instance/` and re-establishes its own accept
authority.

Richer shapes — a designated approver, a consensus syndicate, or non-human
acceptors — and a spec-defined field to declare the shape per instance are out
of scope here and tracked by [[task-authority-mechanism]].
