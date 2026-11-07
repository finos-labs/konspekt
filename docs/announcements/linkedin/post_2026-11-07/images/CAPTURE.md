# Images for the 2026-11-07 post

`checkpoint.png` is the full checkpoint poster at
`docs/visuals/posters/konspekt-checkpoint-poster.html`: the header, the figure
(one conversation writes a checkpoint; another LLM, the next day, and another
device read it), and the comparison with built-in LLM memory and project context.
The poster is the authoritative source; this PNG is a projection of it,
regenerated rather than edited by hand.

## How it was produced

Rendered at 2x for a 2480x2080 PNG, with IBM Plex Sans and IBM Plex Mono
installed locally:

```
google-chrome --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1240,1040 \
  --virtual-time-budget=4000 \
  --screenshot=checkpoint.png \
  file:///<repo>/docs/visuals/posters/konspekt-checkpoint-poster.html
```

To regenerate after editing the poster, re-run against the current poster HTML.
