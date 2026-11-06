```yaml
id: task-undriven-adr-visibility
type: task
title: Show and check ADRs that no ASR drives
status: open
review: accepted
provenance:
  sourceRef: 0953f7c00879df50b76efe55dc3ad8bdd95ed118
  contentHash: 0953f7c00879df50b76efe55dc3ad8bdd95ed118
  conversationId: adr-asr-traceability
  timestamp: 2026-11-06T21:45:07Z
  confidence: 0.8
createdAt: 2026-11-06T21:45:07Z
updatedAt: 2026-11-06T21:47:21Z
```
# Task: Show and check ADRs that no ASR drives

Defect found in the cdm-collateral adopter (2026-11-06): its instance has 23 ADRs, and the Decisions tab
([[task-asr-adr-ui]]) listed 3. `/api/asradr` lists an ADR only under an ASR with a `drives` edge to it, while its
`count` includes every ADR, so an ADR that no ASR drives is counted but never shown. The engineer persona defines an
ADR's context as its inbound `drives` edges (`spec/personas/engineer/SPEC.md` § ADR), and the checker did not report
an ADR with none.

Scope, as set by the project owner:
- `/api/asradr` in implementation-zero and the IntelliJ plugin returns `undriven` (every ADR no ASR drives, each
  with a `superseded` flag) and `adrCount`; the view lists them in a "Not driven by an ASR" group.
- The engineer registry declares `inbound: [{ kind: "drives", fromSubtype: "asr" }]` on `adr`; the checker warns
  `subtype-missing-inbound` on an ADR with no non-rejected inbound `drives` edge from an ASR. A rejected ADR and the
  `to` of a `supersedes` edge are exempt. `SPEC.md` § Conformance additions states the rule.
- `test/conformance-adr-drives.test.mjs` covers the rule.

Success: on cdm-collateral the Decisions tab lists all 23 ADRs, and the checker warns on exactly the ADRs no ASR
drives; this instance still validates with 0 warnings.
