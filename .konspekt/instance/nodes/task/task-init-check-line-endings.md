```yaml
id: task-init-check-line-endings
type: task
title: Ignore line-ending differences in init.mjs --check
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-22T21:00:34Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;EQs9660ddc3yPRim-Bbln4eQroqre0tsoLwctqt1uUI
  conversationId: review-units-operating-seed
  timestamp: 2026-11-22T21:00:34Z
  confidence: 0.85
createdAt: 2026-11-22T21:00:34Z
updatedAt: 2026-11-22T21:08:12Z
```
# Task: Ignore line-ending differences in init.mjs --check

`setup/init.mjs --check` compares each projected file with its template byte
for byte. A checkout with `core.autocrlf=true` (Windows) has CRLF working
files, so it reports drift for files whose content matches: four of the five
files flagged in cdm-collateral, and `.konspekt/lib/konspekt-notify.mjs` in
konspekt itself. Normalize CRLF to LF on both sides before comparing, for
component files and vendored persona files, and add a test where a CRLF copy
passes and a real content edit still reports drift.

Decomposes [[goal-adoption]].
