```yaml
id: task-vendor-neutral-interop
type: task
title: Vendor-neutral agent integration — move .claude to a neutral location
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-10T16:25:00Z
review: accepted
provenance:
  sourceRef: 61cb82df38f6e65ac716680e9d38c3fa5738e56d
  contentHash: 61cb82df38f6e65ac716680e9d38c3fa5738e56d
  conversationId: vendor-neutral-interop
  timestamp: 2026-10-10T16:25:00Z
  confidence: 0.7
createdAt: 2026-10-10T16:25:00Z
updatedAt: 2026-10-10T16:30:00Z
```
# Task: Vendor-neutral agent integration — move .claude to a neutral location

konspekt's operating surface is coupled to one LLM vendor. The agent-integration
files live under `.claude/` — skills, the conversation-binding gate and its
hooks, the per-session binding markers, settings — but most of that is not
Claude-specific. A skill is a plain prompt; the binding and operating discipline
is vendor-independent policy. [[goal-portability]] carries a project across
platforms, yet today that portability reaches only the data under
`.konspekt/instance/` and stops at the operating surface, which another vendor's
tooling cannot discover under `.claude/`.

Move the vendor-neutral parts of `.claude/` to a neutral location (for example
`.konspekt/agents/` or a top-level `agents/`): the skills, the binding gate, and
the operating hooks. Leave only genuinely Claude-specific wiring under `.claude/`
as a thin adapter that points Claude Code at the neutral location; each
additional vendor gets a similarly thin adapter. The fleet's proposer and
committer skills (`.claude/skills/fleet-*`, authored for the worktree UAT) are
the first content to live neutrally, so this task and the fleet UAT share a
motivation.

Scope: inventory what under `.claude/` is vendor-neutral versus Claude-specific;
choose the neutral location; move the neutral parts and leave adapters; keep the
binding gate and hooks working for Claude Code through the adapter. Out of scope:
building adapters for vendors other than Claude (each is its own follow-up).

Decomposes [[goal-portability]].
