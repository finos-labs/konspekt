```yaml
id: concept-konspekt-vs-memory-layer
label: Not a memory layer
aliases: [konspekt vs agent memory, upstream of memory, human-authored vs machine-authored]
review: accepted
provenance:
  sourceRef: ni:///sha-256;2wONDxYg29vA-aW2xX1fvu_hAEk143kQdBuijsquHoc
  timestamp: 2026-06-27T13:14:42Z
  confidence: 0.8
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 1f21343df8ee9ca6b2d00fe6f859ddf278fc5c18
    contentHash: 1f21343df8ee9ca6b2d00fe6f859ddf278fc5c18
createdAt: 2026-06-27T13:14:42Z
updatedAt: 2026-06-27T13:14:42Z
```
# Concept: Not a memory layer

konspekt is not agent or platform memory (Mem0, Zep, Claude Projects, ChatGPT,
Gemini Gems). Those are machine-authored, machine-read: a model decides what is
salient, extracts a compressed version, and stores it to feed back to a model —
the reader is the agent. konspekt inverts both terms: human-authored,
human-read, incidentally machine-readable. So the user is a human working on a
project, not an agent needing recall.

Three differentiators — curation, provenance, openness. You curate; the model
only proposes (propose→accept), so the guarantee is *integrity, not
completeness*: what is in the record is there because you put it, verbatim and
linked to its source text. And it is a public format, not a product — readable,
diffable, portable, with no service to run and nothing to lock into.

The layers compose rather than collide: a konspekt instance is a clean,
human-validated source you can feed *into* a memory or RAG pipeline. konspekt is
upstream of memory systems, not a competitor — which dissolves the "clash" worry
directly.
