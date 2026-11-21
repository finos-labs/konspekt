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
updatedAt: 2026-11-21T02:31:00Z
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

The IntelliJ plugin copies this view at build time, so the plugin needs a
version bump to ship the change.

Success: every reference shown in the drawer opens its verbatim content in one
click, in both the standalone UI and the plugin.

Decomposes from [[goal-usability]].
