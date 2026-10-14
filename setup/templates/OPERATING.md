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
  writing work, so the session never runs from stale context.
- the maintainer **proposes** extractions into the working copy; it never
  originates an acceptance (anything it proposes on its own judgment is
  `review: proposed`).
- a human command **carries acceptance** (`review: accepted`).
- **persist** writes the working copy back to this repo.

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
