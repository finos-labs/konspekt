```yaml
id: nw-native-restore-needs-verbatim
kind: statement
review: accepted
provenance:
  conversationId: native-vs-konspekt-memory-comparison
  timestamp: 2026-09-26T22:25:00Z
createdAt: 2026-09-26T22:25:00Z
updatedAt: 2026-09-27T00:35:00Z
```
# Noteworthy: The native restore path is verbatim, so its baseline is memory plus all transcripts

Measured on this project on 2026-09-26. konspekt restores project context by
traversing its knowledge layer, so the fair comparison is each system's cost to
restore. konspekt needs only typed nodes and edges; sources are governance and
are not required to restore the graph, so verbatim stays out on the konspekt
side. The native LLM has no typed graph to traverse, so its only restore path is
re-deriving from verbatim, which makes its baseline project memory plus the full
conversation transcripts. Excluding verbatim is therefore not symmetric: it costs
konspekt nothing and removes the native side's only substrate.

Text-only figures (human and assistant prose, with tool calls, tool results,
generated files and uploads excluded): native is about 13.2 KB of memory plus
about 818 KB of transcript prose across 26 conversations, roughly 205k tokens,
about 831 KB in all; the konspekt knowledge layer is about 256 KB across 172
typed nodes and 300 edges. konspekt is about 3.2x smaller and structured.
Counting tool input and output would put the native side in the multiple-megabyte
range and widen the gap. This is one snapshot; the compounding claim is that the
transcript corpus keeps growing while graph traversal stays flat.
