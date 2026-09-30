```yaml
id: nw-binding-firstturn-gate
kind: decision
review: accepted
provenance:
  sourceRef: 08dc52839b0496f8241157407ff63c672b00615d
  contentHash: 08dc52839b0496f8241157407ff63c672b00615d
  conversationId: binding-firstturn-gate
  timestamp: 2026-09-29T00:00:00Z
  confidence: 0.7
createdAt: 2026-09-29T00:00:00Z
updatedAt: 2026-09-29T00:00:00Z
```
# Noteworthy: bind before responding — the first-turn gate and an edit-boundary backstop

Observed again this session: the maintainer answered the human's first prompt (a
prose rewrite) *before* issuing the binding ask, then bound retroactively when
the human flagged it. This is the same lapse [[nw-binding-enforcement-gap]]
records, but at the **session boundary** rather than the commit boundary, and via
a **pure-text reply** rather than an unbound commit. The proximate cause was the
same misclassification: treating a "trivial" edit as not the kind of work the
binding ask must precede. OPERATING.md's "before durable work" phrasing invited
that judgment call.

Three-part remediation, all addressing [[task-binding-gap-audit]] (whose own text
anticipated a "session-level prompt … complement, not a replacement" to the CI
audit):

1. **OPERATING.md § Conversation binding** — replace "before durable work" with a
   **first-turn gate**: the binding ask is the maintainer's *first* user-facing
   action, and no task work of any kind precedes the human resolving it,
   regardless of how trivial the prompt looks. The test is *before reacting to
   the first prompt*, not *before durable work*. Sole exception: the human's
   first prompt itself supplies the binding.
2. **`setup/WEBMOBILE_SEED.md`** — the hook-less web/mobile path gets the same
   "bind before responding" wording, since nothing but the seed enforces the ask
   there (refines [[nw-webmobile-seed-binds-at-open]]).
3. **`PreToolUse` hook (`.claude/hooks/require-binding.sh`)** — a deterministic
   **edit-boundary backstop**: file-mutating tools (Write/Edit/MultiEdit/
   NotebookEdit) are denied until a per-session binding marker
   (`.claude/.binding/<session_id>`, gitignored) records the bound entity id.
   Bash is ungated so the marker can be written once bound.

Honest limit: no harness mechanism can gate a **pure-text reply** — the exact
failure this session — because it makes no tool call. That layer is irreducibly
the maintainer's first-turn discipline (item 1). The `PreToolUse` hook covers the
edit boundary; the CI audit ([[task-binding-gap-audit]]) covers the commit
boundary; the gate wording is the only lever for the conversational boundary.
Defense-in-depth across three seams, not a single enforceable gate.
