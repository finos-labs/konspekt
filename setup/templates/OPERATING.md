---
title: Operating policy
status: Seed
scope: How this project runs its konspekt maintenance loop. Host policy, not standard.
---

# Operating policy

The operating envelope for the konspekt instance under `.konspekt/instance/`.
This is host policy, **not** part of the konspekt standard: the standard
(github.com/finos-labs/konspekt — `spec/data-model`, `spec/architecture`)
defines the data model and transport; *how this project* runs its maintenance
loop lives here, and a second platform adopting the instance re-establishes its
own envelope.

## The portable unit vs. the envelope

- `.konspekt/instance/` — the portable konspekt instance (self-contained,
  `sources/` included). This is what ports across platforms.
- `.konspekt/OPERATING.md`, `.konspekt/NOTES.md` — repo-local envelope, not part
  of the contract a second tool conforms to.

## Operating loop

- **load** at session start — read `.konspekt/instance/` before any design or
  writing work, so the session never runs from stale context — then establish
  the conversation's active entity (see Conversation binding below).
- the maintainer **proposes** extractions into the working copy; it never
  originates an acceptance (anything it proposes on its own judgment is
  `review: proposed`).
- a human command **carries acceptance** (`review: accepted`).
- **persist** writes the working copy back to this repo.

## Conversation binding

The konspekt standard requires every atom to bind to a source and an entity
(provenance completeness, `spec/architecture/BINDING.md`). The invariant is
spec; the behavior below is host policy. The policy value is the `binding:`
field of `instance/project.md`; the Claude Code hooks installed by the
`claude-code` component enforce it.

- **Bind before responding — the first-turn gate.** After `load`, the
  maintainer's first user-facing action is to ask the human whether this
  conversation attaches to an existing entity (give the id) or creates a new one
  (name the type). For an exploratory start where the type is not yet clear, the
  maintainer proposes `investigation` as the default, refinable to a `goal`
  later. Until the human resolves the binding, the maintainer does no task work:
  no edits, no research, no answering the substance of the first prompt. The one
  exception: the human's first prompt itself names the binding (e.g. "bind to
  task-X, then …"); the maintainer records it and proceeds in the same turn.
- **One active entity, switchable.** A conversation has one active entity at a
  time. When the topic moves to a different entity, the maintainer *proposes* a
  switch and the human confirms; each span of provenance attaches to the entity
  active during it.
- **`binding: required`** (the seed value) — there is no legal unbound state;
  "none" is not an accepted answer. Under `binding: optional` a human may
  decline, and the decline is recorded as a `waypoint` so the absence stays on
  the record.
- **Retroactive binding** is allowed in the working copy — a span may be bound
  once its significance is clear — but never after `persist`.

## Acceptance before work

The `basis:` field of `instance/project.md` decides whether work may be bound to
an entity before that entity is accepted (`spec/architecture/REVIEW.md`
§ Acceptance before work):

- **`basis: proposed`** (the seed value, and the standard's default) — work may
  be bound to a proposed entity.
- **`basis: accepted`** — an acceptor accepts the entity before any work is
  bound to it. Edits outside `.konspekt/instance/` wait until the bound entity
  is `review: accepted`. An instruction to start work is not an acceptance.

## Triggers — how the loop fires

Two events, not a cadence (no clock or session rhythm):

1. **Atom-ready (LLM-ventured).** The maintainer ventures a proposal when it
   judges a durable atom has crystallized — a decision, a named concept, a
   status change — always `review: proposed`, never self-accepted. Hold by
   default; venture on crystallization, not every turn.
2. **Human command.** `sync` / `persist` / `sync_persist`, and the authority
   verbs (`pin`, `validate`, `refute`, `resolve`, `abandon`, `lift`) — the
   deterministic side that accepts and writes durably.

## Human vocabulary

Defined by the konspekt standard (`spec/data-model/SPEC.md`). `note:` /
`note "…"` is a human scratchpad that appends to `.konspekt/NOTES.md` and is
**never** reconciled into the graph.
