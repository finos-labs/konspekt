```yaml
id: artifact-validation
name: Validation writeup
kind: doc
location: VALIDATION.md
review: proposed
provenance:
  sourceRef: e8938d35149b0f692e4ab353a21aadd0d8998ff1
  contentHash: e8938d35149b0f692e4ab353a21aadd0d8998ff1
  timestamp: 2026-09-27T15:00:00Z
  conversationId: native-vs-konspekt-validation-run
  confidence: 0.7
createdAt: 2026-09-27T15:00:00Z
updatedAt: 2026-09-27T15:00:00Z
```
# Artifact: Validation writeup

Public writeup of the native-memory-vs-graph validation run at the repository
root (`VALIDATION.md`). States the comparison (each system's cost to restore
project context), the 240-trial re-establishment A/B, the twelve probe questions
by tier, results by tier, and the finding — that native restore is confidently
wrong on evolving state while graph traversal stays correct
(`nw-native-restore-stale-on-live-state`). Non-normative; the per-atom record
lives in the instance graph. Cited from the deck appendix in `docs/index.html`.
