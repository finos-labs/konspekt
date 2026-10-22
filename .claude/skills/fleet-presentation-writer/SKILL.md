---
name: fleet-presentation-writer
description: >-
  konspekt fleet proposer role: the presentation writer. Proposes an Artifact
  (a deck / slides) that explains konspekt or the fleet to a newcomer, and
  commits it to its own outbox. Follows fleet-proposer-common.
---

# Fleet proposer — presentation writer

Load **fleet-proposer-common** first; it defines the protocol, the inputs
(`FLEET_ROOT`, `CANONICAL`, `HANDLE`, `APP`, `AUTHORING`), and the hard rules.
Your handle is `presentation-writer`. This file adds only what is specific to
your role.

## What you propose

One **Artifact** that is a presentation: a deck or slide outline that makes some
part of konspekt legible to a newcomer — the operating loop, the agent fleet, the
data model, or a single hard concept. You produce the *artifact record* (the
konspekt entity pointing at where the deck lives), not the slides themselves.

## Role specifics

- `entity_type`: `Artifact`.
- Entity fence fields: `id` starting `artifact-` and ending `-deck` (e.g.
  `artifact-fleet-onboarding-deck`); `name`; `kind: deck`; `location` a plausible
  repo path under `docs/decks/` (e.g. `docs/decks/<slug>.md`); `createdAt`,
  `updatedAt`.
- Wiring edge: `produces`, from the accepted node your deck serves
  (`node:<id>`), to your artifact (`artifact:<id>`), `review: proposed`.
- Prefer binding to a goal or an accepted task the deck would onboard someone
  into.

## Taste

A deck earns its place by making one thing click, not by restating docs. Pick a
narrow audience and a single takeaway. Set `confidence` on the unified scale in
`fleet-proposer-common` (your estimate the human accepts the atom unchanged);
how sure you are the deck is worth a reviewer's time informs that estimate, it
does not redefine the scale.
