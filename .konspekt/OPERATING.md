---
title: konspekt operating policy (this instance)
status: Seed
scope: How THIS repository's konspekt instance is operated. Host policy, not standard.
updated: 2026-09-26
---

# Operating policy — konspekt dogfood instance

This file is the **operating envelope** for the konspekt instance under
`.konspekt/instance/`. It is deliberately *not* part of the portable standard:
the spec (`/spec`) defines the data model and the transport contract; *when* and
*how this particular project* runs a maintenance pass is host policy and lives
here. A second platform that adopts this instance carries `.konspekt/instance/`
and re-establishes its own envelope — it does not inherit this file's choices.

## The portable unit vs. the envelope

- `.konspekt/instance/` — the portable konspekt instance. Self-contained,
  `sources/` included. This is what transport reads/writes and what ports across
  platforms.
- `.konspekt/OPERATING.md`, `.konspekt/NOTES.md` — repo-local envelope. Not part
  of the contract a second implementer conforms to.

## Operating loop

This instance runs the **synchronous-review** posture defined in
`/spec/architecture/TRANSPORT.md`:

- **load** at session start — read `.konspekt/instance/` before any design or
  writing work, so the session never runs from stale context.
- **bind** at session start — after load, before durable work, establish the
  conversation's active entity (see Conversation binding below).
- the maintainer **proposes** extractions into the working copy (`sync`); it
  never originates an acceptance (anything it proposes on its own judgment is
  `review: proposed`).
- a human-issued verb **carries its own acceptance** (`review: accepted`);
  acceptance happens in the conversation, before persist.
- **persist** writes the working copy back to the store (GitHub `main`
  directly — writing accepted state to main is contract-legal, not a shortcut:
  the review gate already happened, carried by human authority, not a branch).

The store only ever sees `read` and `write`. `load` / `sync` / `persist` /
`sync_persist` are orchestration above the store, identical on every binding.

## Conversation binding

This instance realizes the provenance-completeness invariant
(`/spec/architecture/BINDING.md`). The invariant is spec; the behavior below is
host policy and lives here.

- **Ask at open.** After `load`, the maintainer asks the human directly whether
  this conversation attaches to an existing entity (give the id) or creates a new
  one (name the type). For an exploratory start where the type is not yet clear,
  the maintainer proposes `investigation` as the default, refinable to a `goal`
  later. The ask is unconditional.
- **One active entity, switchable.** A conversation has one active entity at a
  time. When the topic moves to a different entity, the maintainer *proposes* a
  switch and the human confirms; each span of provenance attaches to the entity
  active during it, and the switch is recorded so the seams stay auditable.
- **This instance's policy is `binding: required`** (set in
  `instance/project.md`). There is no legal unbound state: every conversation
  must resolve to an entity, so "none / not this one" is not an accepted answer
  here. (An instance set to `binding: optional` would instead allow a decline,
  recorded as a `waypoint` so the absence stays on the record.)
- **Retroactive binding** is allowed in the working copy — a span may be bound
  once its significance is clear — but never after `persist`.

Recorded in the instance as `task-conversation-binding` and the five
`nw-binding-*` decisions; marked by `wp-conversation-binding`.

## Accept authority

This instance runs **single-individual** accept authority: one human is the sole
maintainer and the only holder of accept authority. That human proposes (with
the LLM maintainer) and accepts; accepted state is written to `main` directly, as
the operating loop above describes. The scope is one human being a sole
contributor to a project. This is the simplest shape in the accept-authority
coupling recorded as `nw-roadmap-generation-coupled-to-authority`, and it is why
`ROADMAP.md` automation may use the simplest trigger (see Roadmap regeneration
below).

This shape is host policy for this instance, not the konspekt standard —
`spec/architecture/REVIEW.md` keeps who-accepts out of the standard. It is
recorded here in the envelope, not in the portable `project.md`, because no
spec-defined config field for it exists yet. A second adopter carries
`.konspekt/instance/` and sets its own accept authority.

Richer shapes — a designated approver, a consensus syndicate, or non-human
acceptors — and a spec-defined field to declare the shape per instance are
deferred to `task-authority-mechanism` under `goal-accountability`. Recorded in
the instance as `nw-instance-single-individual-authority`.

## Human vocabulary

Not duplicated here — single source of truth:

- Authority verbs (`pin`, `validate`, `refute`, `resolve`, `abandon`, `lift`):
  `/spec/data-model/SPEC.md` § Human vocabulary (v1).
- Checkpoint verbs (`load`, `sync`, `persist`, `sync_persist`):
  `/spec/architecture/TRANSPORT.md` § The checkpoint verbs map onto read/write.
- `note:` / `note "…"` is **not** a konspekt capture verb — it appends to
  `.konspekt/NOTES.md` (human scratchpad), never reconciled into the graph.

## Triggers — how the loop fires

Settled: the loop fires on **two events**, not on a cadence (no clock, turn, or
session rhythm — "session" has no portable meaning across LLM vendors, and
per-turn firing is pure noise).

1. **Atom-ready (LLM-ventured).** The maintainer watches the thread and, when it
   judges that a durable atom has crystallized — a decision landed, a concept got
   named, a task changed status — it *ventures* the extraction as a proposal
   (`sync` into the working copy, always `review: proposed`). It never accepts
   its own ventures. Readiness is judged against the node types
   (`goal | investigation | experiment | topic | task | note`, plus concepts,
   noteworthy, artifacts); workable but explicitly imperfect.
2. **Human manual command.** `sync` / `persist` / `sync_persist` and the
   authority verbs (`pin`, `validate`, `refute`, `resolve`, `abandon`, `lift`).
   The deterministic, authoritative side — it accepts and it writes durably.
   Human authority carries acceptance.

Alongside these, **binding** fires at conversation open and on topic change: the
maintainer establishes the active entity at the start (Conversation binding
above) and *proposes* an active-entity switch when the topic moves to a different
entity. This is a proposal like any venture — the human confirms — and does not
add a cadence.

The two events map onto the propose/persist split: the LLM drives **proposing**
on judgment; the human drives **accepting and persisting** on command. The
propose-accept separation stays intact — ventures are candidates; the command is
what makes anything durable.

**Readiness bar.** "Venture when an atom is ready" must bias toward *holding*
until something has settled, not narrating every exchange — otherwise it decays
back into the per-turn noise excluded above. Hold by default; venture on
crystallization.

Recorded in the instance as `wp-triggers` / `nw-triggers-event-not-cadence`.

## Roadmap regeneration

`ROADMAP.md` at the repository root is a generated projection of the instance
graph, not a hand-maintained file. `tools/roadmap.mjs` reads `loadInstance()`
from `lib/conformance.mjs`, walks `decomposes` edges from each goal to its tasks,
and buckets those tasks into a now / next / later / shipped horizon. The file
carries an AUTOGENERATED banner and a `contentHash`; do not edit it by hand. The
design is recorded in `task-roadmap-generator` and
`nw-roadmap-generation-coupled-to-authority`.

**When to regenerate.** Run the generator after a graph change that the roadmap
projects: a goal or task added, retitled, re-parented through a `decomposes`
edge, or moved between horizon buckets. The bucket mapping is defined in
`tools/roadmap.mjs` (`bucketOf`) and is authoritative there; the fields it reads
are each task's `status` and `review`, so a status transition (for example
`open` → `active` → `resolved`) or a `review` flip (`proposed` → `accepted`)
changes the output. Regeneration is manual and is the responsibility of whoever
accepts the graph change; an automated trigger is deferred to
`task-roadmap-generation-workflow`, whose shape depends on this instance's
accept-authority model.

**How to run it.** From the repository root:

```
node tools/roadmap.mjs          # regenerate ROADMAP.md; prints the path and contentHash
node tools/roadmap.mjs --check  # regenerate in memory, diff the committed file; exit 1 if stale
```

The generator is a pure function of `.konspekt/instance/` — no wall-clock time
or source commit is baked in — so re-running over an unchanged instance produces
a byte-identical file. It accepts optional positional arguments
`[instanceDir] [outFile]` (defaults: `.konspekt/instance` and `ROADMAP.md`) and
honors `KONSPEKT_FILENAME_RULE` (default `strict`).

**Freshness gate.** `--check` only reads and regenerates; it needs no write
permission. It exits non-zero when the committed `ROADMAP.md` differs from the
current graph or is missing. It is currently run by hand — as of this writing no
workflow under `.github/workflows/` invokes it (CI wiring is part of the deferred
`task-roadmap-generation-workflow`). Run `--check` before committing a graph
change so a stale `ROADMAP.md` does not reach `main`.

**Poster.** The roadmap poster under `docs/visuals/posters/` still holds
hand-entered counts and is not yet generated from the graph; regenerating it
under the same discipline is tracked by `task-roadmap-poster-generated` and is
not yet implemented.
