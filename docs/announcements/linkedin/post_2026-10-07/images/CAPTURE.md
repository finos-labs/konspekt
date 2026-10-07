# Cover image for the 2026-10-07 post

`acceptance.png` is a render of the **"Who accepted this"** slide
(`data-title="Accountable acceptance"`) from the deck at `docs/index.html` —
the same source the 2026-09-30 post used for its `invariants.png` cover.

How it was produced:

1. Extract that one `<section class="slide">` plus the deck's full `<style>`
   into a standalone 1280×720 page (static position, no deck chrome, no
   nav bar, no injected footer).
2. Render headless at 2× for a crisp 2560×1440 PNG:

   ```
   msedge --headless=new --disable-gpu --hide-scrollbars \
     --force-device-scale-factor=2 --window-size=1280,720 \
     --virtual-time-budget=5000 --screenshot=acceptance.png file:///<capture.html>
   ```

To regenerate after editing the slide, re-run against the current
`docs/index.html`. The slide is the authoritative source; this PNG is a
projection of it, so it is regenerated rather than edited by hand.
