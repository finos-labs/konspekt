```yaml
id: wp-adr-engineer-layer
kind: decision
subtype: adr
timestamp: 2026-08-01T21:31:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;KoNRSFRexdV9DhXWAA7C435u2No1VgpuOJ3bt_sY9Mw
  timestamp: 2026-08-01T21:31:00Z
  confidence: 0.9
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 7c50ca7a05678b5e4e0211bf398533f33ff9eeea
    contentHash: 7c50ca7a05678b5e4e0211bf398533f33ff9eeea
createdAt: 2026-08-01T21:31:00Z
updatedAt: 2026-08-01T21:31:00Z
```
# Waypoint: Introduce the engineer persona layer

Introduce the engineer persona as the first konspekt specification layer over
the persona-agnostic core. The layer contributes ASR (a Concept `subtype: asr`)
and ADR (a Waypoint `subtype: adr` on `kind: decision`), content-addressed
executed-command provenance (`commands/<contentHash>.md`), and the `drives`
and `executed` edge kinds. Core gains only generic hooks — an optional
`subtype`, provenance-ref edge endpoints, and a `personas` activation list —
so it carries no engineer vocabulary. The decision statement is this body; its
forces are the inbound `drives` edge from the layering ASR, and its
consequences are the `spec/personas/` pages, the `schema.ts`/`SERIALIZATION.md`
hooks, and the checker's registry-merge path. Recording this decision as an ADR
is the engineer layer's own first use.
