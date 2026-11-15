```yaml
id: task-ni-walkthrough-recapture
type: task
title: Re-capture the walkthrough frames after cdm-collateral migrates to ni: references
status: resolved
review: accepted
provenance:
  sourceRef: ni:///sha-256;6HDClW0nHGtvOv8V-O5LVRe948OwTDD38W9LCp_Yhwc
  conversationId: linkedin-ni-references
  timestamp: 2026-11-15T15:25:03Z
  confidence: 0.7
createdAt: 2026-11-15T15:25:03Z
updatedAt: 2026-11-15T18:13:17Z
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

Reopened 2026-11-15: the `ui_provenance.png` frame committed in 1cccfea was
captured from plugin 0.0.14 and cuts the path off at `…DCFE8BC`. Plugin 0.0.15
([[task-view-wrap-long-paths]]) wraps the path; the frame is re-captured from
0.0.15 and spliced into `konspekt-howto-walkthrough.mp4` over 79.9 s to 90.7 s.

Resolved again 2026-11-15: the 0.0.15 frame and the re-spliced video landed in 7a42a91.
