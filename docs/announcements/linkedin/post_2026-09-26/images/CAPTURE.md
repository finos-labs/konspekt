# Screenshots for the 2026-09-26 post

Captured from the running IntelliJ plugin (install the prebuilt zip, or
`./gradlew runIde`, then open the **konspekt** tool window on the right edge)
against konspekt's own `.konspekt/instance`, so every tab is populated.

Filenames must match the `assets:` list in `post.md`. The carousel is assembled
as `carousel.pdf`, one page per image, in the order below; LinkedIn uploads it
as a swipeable document.

Order and filenames:

1. `plugin_tool_button.png` — the konspekt view docked as a tool window on the
   right edge, **Decisions** tab, with the pop-out and pin controls in the title
   bar (`task-plugin-pop-mode`).
2. `plugin_popup_mode.png` — the same view detached into a floating window over
   the IDE, **Goals** tab (a goal decomposed into its subgraph), with the Dock
   and pin controls at the top left.
3. `task_write_commands.png` — the entity detail drawer on a proposed node,
   showing the write actions: **Accept** a proposed atom and **Resolve** a work
   node (`task-ui-resolve-action`).
4. `files_changed.png` — the entity detail drawer, **Changes** tab, listing the
   files changed in the commit recorded for a work node
   (`task-record-code-changes`).

Notes:
- Capture against a real instance (konspekt's own), not an empty one, so the
  tabs are populated.
- The binding invariant (invariant V) is a guarantee, not a screen — it lives in
  the body copy of `post_2026-09-30/`, not this carousel.
