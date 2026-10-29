```yaml
id: task-promo-video
type: task
title: Produce a hands-on promo video for technical adopters
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-29T22:12:01Z
review: accepted
provenance:
  sourceRef: 8cf9840edb089f38a787f87cbc46c8050ab4ee69
  contentHash: 8cf9840edb089f38a787f87cbc46c8050ab4ee69
  conversationId: walkthrough-video
  timestamp: 2026-10-29T00:50:00Z
  confidence: 0.8
createdAt: 2026-10-29T00:50:00Z
updatedAt: 2026-10-29T22:12:01Z
```
# Task: Produce a hands-on promo video for technical adopters

A walkthrough of up to 10 minutes showing konspekt adopted in a real repository,
using `denisurusov/cdm-collateral` as the demo repo. Built without screen recording: a
scene-by-scene script, rendered IDE and terminal frames from real command output,
burned-in captions, and a synthetic British voice-over (Kokoro, voice
`bf_isabella`, normal speed; "konspekt" pronounced "con-spekt"), stitched with
ffmpeg into an MP4.

Decomposes [[goal-adoption]].

Resolved 2026-10-29: delivered `docs/visuals/how-to/konspekt-howto-walkthrough.mp4`
(1080p, 2:21, rendered from `how-to.demo.flow.md` with captions, a beat-11 title
card and a repository end card) in 37ce34c, produced as
[[artifact-howto-walkthrough-video]]. The longer 14-scene cut drafted from
[[artifact-promo-video-script]] was not published.
