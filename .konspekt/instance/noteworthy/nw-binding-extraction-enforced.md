```yaml
id: nw-binding-extraction-enforced
kind: decision
review: proposed
provenance:
  sourceRef: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  contentHash: 6fec4005beceb83b562d7641b9d4f0c81f24fba1
  timestamp: 2026-09-26T18:16:00Z
  conversationId: conversation-binding-and-validation-experiment
  confidence: 0.75
createdAt: 2026-09-26T18:16:00Z
updatedAt: 2026-09-26T18:16:00Z
```
# Noteworthy: Binding is enforced at extraction, not by a persist gate

Enforcement has two layers. The soft layer (`.konspekt/OPERATING.md`) drives the
ask-at-open and switch proposals -- timing and UX. The hard guarantee is that
binding is **mandatory on every proposed atom at the extraction layer**, exactly
as `provenance.confidence` is: an atom with no binding is malformed and never
becomes well-formed, so completeness holds without stranding data.

This corrects an earlier sketch of a hard persist-time gate that would refuse to
flush unbound atoms. The gate contradicts a governing rule of
`spec/architecture/REVIEW.md` -- "review does not block persist; nothing is held
hostage in a working copy" -- because it holds atoms hostage. The extraction-layer
form gives the same guarantee while keeping the persist-never-blocks principle
intact.
