```yaml
id: concept-surface-follows-data
subtype: asr
label: UI surfaces are gated by data presence, not mode flags
aliases: [surface follows data, show a surface when there is data to show, not gated by the persona flag]
review: proposed
provenance:
  sourceRef: 3e40ecbee32fff105151a8d772969f2f84f4c8ef
  contentHash: 3e40ecbee32fff105151a8d772969f2f84f4c8ef
  timestamp: 2026-09-20T15:00:00Z
  conversationId: engineer-executed-provenance
  confidence: 0.75
createdAt: 2026-09-20T15:00:00Z
updatedAt: 2026-09-20T15:00:00Z
```
# Concept: UI surfaces are gated by data presence, not mode flags

An optional UI surface appears based on whether there is data for it to show, not
on whether a mode or persona flag is set. A flag such as `personas: [engineer]`
can flip on and off over a project's life, but entities it once produced — ASRs,
ADRs, executed commands — persist; the presence of those entities, not the
current flag, is the true signal that the surface is relevant.

This is architecturally significant because it fixes how every optional surface
decides its own visibility across all shells: query the data, not the config. Its
significance is carried by the `drives` edge to the ADR that applies it (for the
ASR/ADR tab of [[task-asr-adr-ui]]), recorded when that implementation is decided.
