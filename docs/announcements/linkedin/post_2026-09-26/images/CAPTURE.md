# Screenshots to capture for the 2026-09-26 post

Capture these from the running IntelliJ plugin (install the prebuilt zip, or
`./gradlew runIde`, then open the **konspekt** tool window on the right edge).
Filenames must match the `assets:` list in `post.md`. Once captured, assemble a
`carousel.pdf` (one page per image, in the order below) and place it in the post
directory — LinkedIn uploads it as a swipeable document.

Order and filenames:

1. `tool-window.png` — the konspekt tool window docked on the right, **Changes**
   tab, over a real project's graph (konspekt's own instance).
2. `goals.png` — the **Goals** tab, a goal decomposed into its subgraph as a
   layered diagram.
3. `detail-provenance.png` — the entity detail drawer, **Provenance** tab,
   showing the verbatim human/assistant exchange.
4. `dispositions.png` — the detail drawer's disposition bar showing the write
   actions: **Accept** on a proposed atom and/or **Resolve** on an open/active
   work node. Open a proposed, open node so both controls appear.
5. `detail-commands-changes.png` — the entity detail drawer, **Commands** and
   **Changes** tabs, showing commands run and files changed.

Notes:
- Prefer a real instance (konspekt's own) over an empty one, so the tabs are
  populated.
- The binding invariant (invariant V) is a guarantee, not a screen — it lives in
  the body copy, not the carousel.
