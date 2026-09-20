```yaml
id: concept-ui-human-disposition
subtype: asr
label: The UI may take human dispositions; the model still never self-accepts
aliases: [accept from the UI, human disposition surface, ui is not strictly read-only]
review: proposed
provenance:
  sourceRef: 8ba9d7285e3780034133f597e92d53bb89e98acf
  contentHash: 8ba9d7285e3780034133f597e92d53bb89e98acf
  timestamp: 2026-09-20T18:00:00Z
  conversationId: ui-simple-actions
  confidence: 0.7
createdAt: 2026-09-20T18:00:00Z
updatedAt: 2026-09-20T18:00:00Z
```
# Concept: The UI may take human dispositions; the model still never self-accepts

The local UI is a surface for a **human** to act, so it may perform a bounded set
of dispositions that write the instance — starting with accepting a proposed
entity (`review: proposed → accepted`). This does not weaken
[[concept-propose-accept-separation]]: the separation is about *who* accepts, not
*where*. The model proposes and never self-accepts; the human accepts, and doing
so from the UI is the same authority the human already has, made reachable.

This is architecturally significant because it revises the earlier read-only
stance ("nothing here writes to the instance"): the read path stays the default,
but a write path exists for human dispositions only. Writes touch the working tree
only (no git commit), so the change is reviewable and reversible by the human
before it is persisted. Its consequences are carried by the `drives` edge to the
ADR that applies it ([[wp-adr-ui-accept-action]]).
