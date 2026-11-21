```yaml
id: task-ui-clickable-source-refs
type: task
title: Make ni references in the atom drawer open their content
status: open
review: accepted
provenance:
  sourceRef: ni:///sha-256;msW1a0Wxsf9T3K6lDvGGsnJZzGRvIBk3bYmwXkevvRc
  conversationId: ui-atom-panel
  timestamp: 2026-11-21T02:25:00Z
  confidence: 0.8
createdAt: 2026-11-21T02:25:00Z
updatedAt: 2026-11-21T03:06:00Z
```
# Task: Make ni references in the atom drawer open their content

The drawer's Details tab renders the entity file as plain text
(`pre(d.markdown)` in `implementations/implementation-zero/app/view/app.js`),
so its `sourceRef: ni:///sha-256;…` and any `ni:` or `command:ni:` reference
in the body cannot be clicked. The excerpt is visible only on the Provenance
tab, and only for the entity's own `sourceRef`.

Detect every `ni:///sha-256;<43 base64url>` reference in the rendered Details
text, plus the SHA-1 `sourceRef` / `contentHash` inside a `deprecated` block,
and make each one a link. Clicking it shows that content in place, resolved
through `/api/source` for sources and the commands lookup for `command:ni:`,
labelled with its store-relative path. A reference that does not resolve shows
"no such content" and leaves the rest of the drawer working.

The drawer shows each reference's location in the store, obtained by
expanding `store.resolve.source` (or `.command`) from `project.md` with the
reference's `{hex}`, `{b64}` and `{ref}`. The server performs the expansion
and returns the location with the content. A location is a link only when it
is an `http(s)` URI, otherwise it is text with a copy control. An instance
without `store.resolve` falls back to the layout path relative to the
repository root (`.konspekt/instance/sources/sha-256/<hex>.md`). Opening the
content in the drawer goes through the server's read and does not depend on
the store kind.

Opening a reference pushes a source view onto the drawer, with a back button
and the path it was opened from (mockup variant C). The Provenance tab becomes
an index of every reference that bears on the entity, grouped as: the
extraction (`provenance.sourceRef`, plus any SHA-1 references in a
`deprecated` block), the entity's rows in `transitions/transitions.md` (field,
from, to, timestamp, `by`, and `source` when present), and its origin
locators. Each entry with a source opens it in the source view; a transition
row without a source is listed without a click target, so the record of who
proposed the entity and when stays visible. Origin locators also appear in
the source view of the excerpt they describe. The Commands tab is unchanged.

The IntelliJ plugin copies this view at build time, so the plugin needs a
version bump to ship the change.

Success: every reference shown in the drawer opens its verbatim content in one
click, in both the standalone UI and the plugin.

Decomposes from [[goal-usability]].
