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

## Checkpoint and resume

`checkpoint` and `resume` carry a conversation's binding and open items to a
later conversation on any LLM or venue (`spec/architecture/TRANSPORT.md`
§ Checkpoint and resume; format in `spec/architecture/SERIALIZATION.md`
§ Checkpoints).

- **`checkpoint` is manual.** Only the human issues it. The maintainer writes, in
  one persist, a `sources/` excerpt holding verbatim the command, the binding
  switches, the pending proposals, and the open-items list as last presented, and
  one row in `instance/checkpoints/checkpoints.md`.
- **`resume` at open.** After `load`, if the log has rows, the binding ask offers
  the last row's entity as the default; the human still answers. Once bound, the
  maintainer lists the checkpoint's open items and pending proposals with the
  current review and status of each id they name.

## Acceptance before work

The `basis:` field of `instance/project.md` decides whether work may be bound to
an entity before that entity is accepted (`spec/architecture/REVIEW.md`
§ Acceptance before work):

- **`basis: proposed`** (the seed value, and the standard's default) — work may
  be bound to a proposed entity.
- **`basis: accepted`** — an acceptor accepts the entity before any work is
  bound to it. Edits outside `.konspekt/instance/` wait until the bound entity
  is `review: accepted`. An instruction to start work is not an acceptance.

## Binding commits to the graph

This section applies when `instance/project.md` is `binding: required` and the
instance has a changed-code log, `instance/changes/changed.md` (seeded by
`--persona engineer`). The tools it names are installed under `.konspekt/lib/`
by the `conformance` component.

- **What needs a row.** Every commit that changes a file outside
  `.konspekt/instance/` is work and binds to the active entity through a row in
  `changes/changed.md` (`| entity | commit | file | timestamp |`), one row per
  changed file. A commit that touches only `.konspekt/instance/**`, or only files
  the kit installs (`.konspekt/`, `.claude/hooks/`, `.claude/skills/`,
  `.claude/settings.json`, `.github/workflows/konspekt-*`), is bookkeeping and
  needs no row.
- **When to write it.** At commit time: in the same commit as the work, or in
  the commit immediately after it, so the log trails the work by at most one
  commit.
- **Before every push**, run the binding audit:

  ```
  node .konspekt/lib/binding-audit.mjs
  ```

  It exits non-zero on a commit with no row. Under `basis: accepted` it also
  reports a commit bound to an entity that is not accepted, or authored before
  that entity was accepted. The `konspekt-binding-audit` workflow runs the same
  check in CI.
- **Exemptions.** A commit that is not graph-bound work is listed by SHA in the
  `allow` array of `.konspekt/binding-audit.json`
  (`{"baseline": "<sha>", "allow": ["<sha>"]}`); `baseline` moves the start of
  the audit to a later commit. Use both rarely.

## Review units

This section applies when commits are bound (the section above) and the
repository uses pull requests. `instance/changes/review-units.md` links each
bound commit to the pull requests that contain it
(`spec/personas/engineer/SPEC.md` § Review units). It is written by
`.konspekt/lib/review-units.mjs`, never by hand. The tool reads the forge
through the `gh` CLI and reads git history, so run it from the repository root
of a full clone with `gh` signed in.

```
node .konspekt/lib/review-units.mjs           # rewrite changes/review-units.md
node .konspekt/lib/review-units.mjs --check   # exit 1 if the file is stale
node .konspekt/lib/review-units.mjs --report  # print entity -> pull requests
```

- **When to regenerate.** After a pull request with bound commits is opened,
  merged, or closed, and after bound work is pushed straight to the default
  branch (each such commit gets a `direct` row). Run it after the push or merge,
  so the commits are on the remote default branch, and commit the result. The
  output touches only `.konspekt/instance/**`, so that commit is bookkeeping and
  needs no changed-code row.
- **Squash and rebase merges.** The merge writes new commits to the default
  branch. Each row records the `landed` commit that carries the bound commit's
  change, and the binding audit counts a `landed` commit as bound. Until the log
  is regenerated and committed, the audit reports the new commits as unbound, so
  regenerate right after the merge.
- **Freshness check.** The `conformance` component installs no workflow for
  this log. Run `--check` before a push, alongside the binding audit. `--check`
  reads the forge, so it also reports stale when a pull request changed state
  since the last run. `node .konspekt/lib/validate.mjs .konspekt/instance` warns
  `review-unit-missing` for each bound commit the log does not list yet.

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
