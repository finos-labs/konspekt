# Images for the 2026-10-23 post

`fleet.png` is the cover: the header plus **Figure 1 — How a proposal moves**
from the fleet poster at `docs/visuals/posters/konspekt-fleet-poster.html`. The
poster is the authoritative source; this PNG is a projection of it, regenerated
rather than edited by hand.

## How it was produced

Cover (header + Figure 1 + legend, the top ~1050 CSS px, rendered at 2× for a
crisp 2480×2100 PNG):

```
msedge --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1240,1050 \
  --virtual-time-budget=6000 \
  --screenshot=fleet.png \
  file:///<repo>/docs/visuals/posters/konspekt-fleet-poster.html
```

`../carousel.pdf` is the full poster (both figures, the committer protocol, and
the invariants) printed to PDF, for upload to LinkedIn as a swipeable document:

```
msedge --headless=new --disable-gpu \
  --print-to-pdf=carousel.pdf \
  file:///<repo>/docs/visuals/posters/konspekt-fleet-poster.html
```

To regenerate after editing the poster, re-run against the current poster HTML.
