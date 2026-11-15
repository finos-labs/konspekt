# Assets for the 2026-11-15 post

The post carries no PNG. `../carousel.pdf` is the full poster at
`docs/visuals/posters/konspekt-addressing-poster.html`, printed to PDF. The
poster is laid out as six 1080x1350 slides with `@page { size: 1080px 1350px }`
and a page break after each slide, so printing produces one PDF page per slide.
The poster is the authoritative source; the PDF is a projection of it,
regenerated rather than edited by hand.

## How it was produced

Printed with headless Microsoft Edge (Chromium), with network access so the
IBM Plex fonts load from Google Fonts:

```
msedge --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=6000 \
  --print-to-pdf=<repo>/docs/announcements/linkedin/post_2026-11-15/carousel.pdf \
  file:///<repo>/docs/visuals/posters/konspekt-addressing-poster.html
```

`google-chrome` accepts the same flags. The result is six pages of
810x1013 pt (1080x1350 px). To regenerate after editing the poster, re-run
against the current poster HTML.
