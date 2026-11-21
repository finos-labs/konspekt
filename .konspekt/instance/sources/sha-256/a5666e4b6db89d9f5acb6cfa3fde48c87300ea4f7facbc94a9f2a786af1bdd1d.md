# Source excerpt — sync nw-connections-list-popout-graph, accept nw-popout-overlay-browser-layout

Conversation: ui-atom-panel (resumed, claude-code-cli)
Date: 2026-11-21

---

**Claude** (after implementing the Connections frame and the pop-out, commit 3acb7a9):

**Two design questions from the mockup review, decided here** (proposal below):
- The pop-out layout is computed in the browser, as rings of entities around the current one. Entities more than 2 steps away appear as unlabeled dots.
- The pop-out is an overlay in both the standalone page and the plugin, which needs no new Kotlin UI code.

**Proposed graph updates** (not written; each would be `review: proposed`):
- A new `kind: decision` noteworthy, `nw-popout-overlay-browser-layout`, recording the two choices above. It would be attached to `task-ui-atom-neighborhood-graph` by a `notes` edge, at confidence 0.6, since you never chose these yourself.

---

**User:**

I think having a graph in the details panel doesn't work. Let's go with list vs pop-out graph. Is there a way to make the nodes in the pop-out graph draggable?

---

**Claude** (after commit 3353cfb):

**Proposal: record your decision in the graph** (not written; it would be `review: proposed`, confidence 0.9):
- A new `kind: decision` noteworthy, `nw-connections-list-popout-graph`: "The drawer's Connections frame is a list only; the graph form of an entity's connections is the pop-out view."
- A `notes` edge to it from `task-ui-atom-neighborhood-graph`.
- A `supersedes` edge from it to `nw-connections-list-default-graph-toggle`, which is still `proposed` and now contradicts the code.

Say `sync` to write it.

## Open items
1. **Sync the decision:** write `nw-connections-list-popout-graph` with its `notes` and `supersedes` edges? The alternative is to reject `nw-connections-list-default-graph-toggle` and record nothing new.
2. **Pop-out container and layout:** the earlier proposal is still open. `nw-popout-overlay-browser-layout` would record the overlay container and the layout computed in the browser. Sync it or skip it?
3. **Saving dragged positions:** dragged positions are lost when the layout is recomputed. Saving them, for example per center entity in `localStorage`, would be a follow-up.
4. **Push:** push the four local commits (`3acb7a9`, `5763139`, `3353cfb`, `948ee90`) to `main` directly, or open a PR?
5. **Plugin check and resolve:** install `konspekt-intellij-0.0.17.zip` and check the frame and the pop-out in the IDE. Then `resolve` the task once the decision it rests on is accepted.

---

**User:**

sync #1, push to main. #3 - no need to save dragged positions 4. not till I test the plugin. #2 - accepted
