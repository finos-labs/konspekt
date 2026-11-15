```yaml
id: task-ni-walkthrough-recapture
type: task
title: Re-capture the walkthrough frames after cdm-collateral migrates to ni: references
status: open
review: proposed
provenance:
  sourceRef: ni:///sha-256;6HDClW0nHGtvOv8V-O5LVRe948OwTDD38W9LCp_Yhwc
  conversationId: linkedin-ni-references
  timestamp: 2026-11-15T15:25:03Z
  confidence: 0.7
createdAt: 2026-11-15T15:25:03Z
updatedAt: 2026-11-15T15:25:03Z
```
# Task: Re-capture the walkthrough frames after cdm-collateral migrates to ni: references

The how-to walkthrough under `docs/visuals/how-to/` shows the SHA-1 source
path `sources/c559e965...md` from cdm-collateral, which is not yet migrated:
the frames `provenance_source.png` and `ui_provenance.png` and the video
`konspekt-howto-walkthrough.mp4` (listed in `docs/design/source-addressing.md`
§ Result of the file-by-file check).

Re-capture them once cdm-collateral has migrated by the procedure in
`setup/README.md` § Migrating an adopter instance to `ni:` references, so they
show a `sources/sha-256/<hex>.md` path and its `ni:///sha-256` reference.
Blocked until that migration is on cdm-collateral's canonical branch.

Decomposes [[task-ni-references]].
