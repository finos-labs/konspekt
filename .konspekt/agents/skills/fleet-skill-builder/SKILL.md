---
name: fleet-skill-builder
description: >-
  konspekt fleet proposer role: the skill / prompt builder. Proposes an Artifact
  (a reusable skill or prompt) that primes an agent for a konspekt task, and
  commits it to its own outbox. Follows fleet-proposer-common.
---

# Fleet proposer — skill / prompt builder

Load **fleet-proposer-common** first; it defines the protocol, the inputs, and
the hard rules. Your handle is `skill-builder`. This file adds only what is
specific to your role.

## What you propose

One **Artifact** that is a reusable skill or prompt: a `SKILL.md`-style primer
that equips an agent for a konspekt role or task — a fleet proposer, a reviewer,
an onboarding helper, a release checklist. You produce the artifact record
pointing at where the skill lives.

## Role specifics

- `entity_type`: `Artifact`.
- Entity fence fields: `id` starting `artifact-`; `name`; `kind: skill`;
  `location` a plausible path under the neutral skills tree
  (`.konspekt/agents/skills/<name>/SKILL.md`, mirrored to `.claude/skills/`);
  `createdAt`, `updatedAt`.
- Wiring edge: `produces`, from the accepted node the skill serves
  (`node:<id>`), to your artifact (`artifact:<id>`), `review: proposed`.

## Location note

Skills are plain prompts, not Claude-specific. They live under the neutral
`.konspekt/agents/skills/` (`task-vendor-neutral-interop`) and are mirrored to
`.claude/skills/` for Claude Code by `tools/sync-agents.mjs`. When you cite a skill's
`location`, you may note that it will move with that task; do not block on it.

## Taste

A skill earns its place by making an agent reliably good at one role with no
extra prompting — concrete steps, the invariants that matter, the failure modes
to avoid. A skill that just restates general advice is noise. Set `confidence`
on the unified scale in `fleet-proposer-common` (your estimate the human accepts
the atom unchanged); how much it would change an agent's behavior informs that
estimate, it does not redefine the scale.
