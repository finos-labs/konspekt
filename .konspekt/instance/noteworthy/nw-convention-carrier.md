```yaml
id: nw-convention-carrier
kind: statement
review: proposed
provenance:
  sourceRef: bc9b1f5d582eb60076dc3d4ca2b5d70bded9c928
  contentHash: bc9b1f5d582eb60076dc3d4ca2b5d70bded9c928
  conversationId: roadmap-plan
  timestamp: 2026-09-11T18:30:00Z
  confidence: 0.85
createdAt: 2026-09-11T18:30:00Z
updatedAt: 2026-09-11T18:30:00Z
```
# Noteworthy: where the operating convention lives is an adoption/host concern, not an ingestion mechanism

For the working-LLM self-maintenance ingestion mode to run in a project, the
agent must already hold konspekt's operating convention — the propose→accept
loop and the human vocabulary. Where that convention lives is an adoption and
host-binding concern, not a way content enters an instance, so it is relocated
out of [[task-ingestion-mode]], which stays about ingestion mechanisms.

The per-project cost is already reduced to a single file: `AGENTS.md` is the
cross-tool standard read natively by many agents, so an adopter pastes the
konspekt stanza once per repository rather than once per tool. The remaining
ambition — zero per-project paste, the convention carried by the host itself —
splits along two directions:

- Enterprise mode: a central service or host over a durable store carries the
  convention for the organization ([[task-central-service-binding]]).
- Vendor adoption: a vendor or platform adopts konspekt natively so its
  assistant knows the convention without a per-project paste
  ([[task-adoption-path]]).

Both directions are the two faces of [[goal-portability]]: no dependence on a
vendor's hosted service, and no lock-in to a single vendor's assistant.
