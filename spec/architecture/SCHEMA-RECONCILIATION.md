# Schema reconciliation (R1–R8) — closed, discarded

> **Status: CLOSED — DISCARDED, 2026-07-20.** The census both instances were
> finally measured against says the spec is right and one instance needs
> migrating. R1, R4 and R5 are refuted outright; R2, R3 and R6 describe
> code_tracer-only divergences and so argue for fixing the instance rather than
> moving the spec; R7 was a no-change item; R8 is done. **Nothing in R1–R8
> should be implemented.** Kept because entities refer to it by name.
> `spec/data-model/schema.ts` and `spec/architecture/SERIALIZATION.md` remain
> the spec, unchanged and now mechanically verified.

**Not to be confused with `RECONCILIATION.md`**, which is normative and covers a
different subject: how an incoming *atom* is classified against the existing
graph (new | duplicate | update | conflict). This file is about reconciling the
*schema* with what instances actually contain. The names are close enough to
mislead; renaming one of them is an open question.

---

## Where this came from

On 2026-07-19 a diff was run between `spec/data-model/schema.ts` and the entity
files in two instances — `finos-labs/konspekt` (this repo) and `code_tracer`,
the first external adopter. The diff reported that both instances had converged
on a uniform front-matter envelope the schema does not define, and eight
remediation items were drafted from that reading.

Source excerpt: `.konspekt/instance/sources/05f79ce4a294a4a0251a6feef26b5a1d287ea16e.md`.

That excerpt is the only record of the original draft, and it quotes the items in
elided form. **The one-line summaries below are reconstructed from it; the full
argument for R1 and R3–R7 was never persisted and is not recoverable.**

## The eight items, as drafted

| | item | as argued |
|---|---|---|
| R1 | Adopt the uniform envelope into `Base` | Keep `type` in front-matter despite the directory encoding it — a file pasted into a web/mobile chat arrives with no directory context, and the manual re-upload probe requires it to be interpretable standalone |
| R2 | `status` becomes optional, defined only where a vocabulary exists | The one item argued *against* practice: the envelope demanded a `status` and types with no vocabulary got `active` as filler |
| R3 | Restore `kind` via directory, mirroring nodes | `kind` is the one field genuinely not derivable from the directory, since all NoteworthyKinds share `noteworthy/` |
| R4 | Adopt the edge generalization; rewrite the domain/range table | Domain/range described as "not widened — reassigned." `notes` specced node→noteworthy, observed noteworthy→artifact |
| R5 | Artifact is content-bearing | Adopt the observed inline-document shape over the specced pointer shape |
| R6 | Drop `Waypoint.timestamp` | — |
| R7 | Concept: no change, revisit | — |
| R8 | Ship a validator | "One author, one maintainer LLM, one month, and the instance diverged on four entity types and four edge kinds. Nothing checks." |

## The inversion

Later the same night, a per-file census began — reading actual front-matter
rather than reasoning from the summary diff. It reached four files of roughly
sixty before stopping, and two findings were already fatal to the framing:

**konspekt's artifacts conform to `schema.ts` exactly.** `name`, `kind`,
`location` — the pointer shape, precisely as specced. No `title`, no `status`,
no `summary`, no inline document.

**Therefore the uniform envelope is not something "practice converged on."** It
is code_tracer's local choice. konspekt's own instance never adopted it.

R1–R8 was framed as *the spec is behind practice*. The evidence supports *one
instance diverges from the spec, and the other largely doesn't*. Those imply
opposite defaults: the first says move the spec, the second says bring the
instance back. Every item except R4 was argued from the first, and R4 would
break konspekt's conforming rows to match code_tracer's non-conforming ones.

Captured as `nw-konspekt-conforms-code-tracer-drifts`, which supersedes
`nw-schema-behind-practice` (edge `e-sup-census-schemapractice`).

## The census (2026-07-20)

Run with `lib/validate.mjs` over the full tree of both instances — the first
time either has been measured rather than sampled.

| | konspekt | code_tracer |
|---|---|---|
| entities | 97 | 24 |
| edges | 145 | 41 |
| **errors** | **0** | **0** |
| **warnings** | **0** | **63** |
| `edge-domain-range` | 0 | 43 |
| `unexpected-field` | 0 | 42 |
| `missing-field` | 0 | 14 |
| `status-without-vocabulary` | 0 | 6 |
| `provenance-not-content-addressed` (info) | 55 | 13 |

**konspekt conforms to `schema.ts` exactly.** Not approximately — zero warnings
across 97 entities and 145 edges. Every edge respects the declared domain and
range. Every entity carries only fields the schema defines for its type. Every
content-addressed provenance verifies: 23 source excerpts, each one's git blob
SHA equal to the `contentHash` stored against it.

**code_tracer's divergence is uniform, not accidental.** `type`, `title` and
`summary` appear on exactly 12 entities — and it has exactly 12 non-node
entities. Every single one wears the node envelope; nothing else does. Its 6
noteworthy carry `status` with no `kind` at all, and its 5 artifacts have
`title` where `name` should be. It is internally consistent and externally
non-conformant: a local convention applied without exception.

The four off-spec edge kinds, now counted rather than asserted: `notes` (22),
`relates` (14), `produces` (6), `marks` (1).

Neither instance has a single *structural* error — no dangling edge, no
duplicate id, no broken provenance, no filename/id divergence in either.

## Per-item status

| | status | why |
|---|---|---|
| R1 | **refuted** | konspekt has zero `unexpected-field`. The uniform envelope is code_tracer's alone, so there is no convergence to adopt. The standalone-interpretability argument for keeping `type` in front-matter is separable and can be re-argued on its own merits |
| R2 | **redirected** | Right that `status` is filler where no vocabulary exists — but only code_tracer does it (6 entities). konspekt has none. Fix the instance, not the schema |
| R3 | **redirected** | code_tracer's 6 noteworthy have no `kind` at all. konspekt's 35 all do. Nothing to restore; something to migrate |
| R4 | **refuted** | konspekt's 145 edges are 100% conformant. Adopting the observed usage would break 145 correct rows to accommodate 43 incorrect ones |
| R5 | **refuted, and misdiagnosed** | konspekt's 15 artifacts conform. code_tracer's 5 are not content-bearing — they are missing `name` and wearing `title`. The real question is far smaller than R5 posed |
| R6 | **no basis** | All 12 konspekt waypoints carry `timestamp` and pass. No evidence for dropping it |
| R7 | **unaffected** | No-change item |
| R8 | **done** | `lib/conformance.mjs` + `lib/validate.mjs`, wired into CI by the `conformance` component. It is what produced this table |

## A separate correction to the census, now settled

The 2026-07-19 diff asserted that no `resolved`, `refuted`, `lifted`, or
`abandoned` status appears anywhere, and concluded that the authority-verb
transitions "appear never to have occurred in practice."

That broad claim was already conceded on 2026-07-19 by
`nw-state-written-at-birth-not-transitioned`, which named two resolved tasks.
It retained a narrower one: those nodes carry `createdAt == updatedAt`, so they
were *authored* resolved rather than moved from an earlier state.

The narrower claim is also false, and git settles it rather than inferring from
timestamps. Commit `e8731da` (2026-06-21) creates four operating-loop tasks and
records their birth states in its own message — "Ingestion + reconcile active;
trigger-transport + review open." Commit `53b14ae` (2026-06-22) — "Flip
task-reconciliation to resolved with an outcome summary." That is
`active → resolved`, plus two `open → resolved` in the same set. Seven tasks are
resolved, not two, and four have `updatedAt > createdAt`.

Recorded as `nw-node-status-does-transition`, superseding
`nw-state-written-at-birth-not-transitioned`.

Two things follow. R2 rests on the *non-node* filler claim and is unaffected.
But the notifier's three-event set was justified by the void premise and is now
unsupported — tracked against `task-portable-notifications`.

**And note what this episode is.** The same claim was asserted three times from
progressively larger but still partial reads: a summary diff, then two node
files, then seven plus git log. Each pass narrowed the claim instead of checking
it. That is R8 argued in evidence rather than in principle.

## What follows

1. **Migrate code_tracer, do not move the spec.** Strip the node envelope from
   its 12 non-node entities, give its noteworthy a `kind`, rename artifact
   `title` to `name`, and repoint the 43 off-spec edges. All mechanical, all
   checkable by re-running the validator to zero.
2. **Backfill provenance.** 55 konspekt entities and 13 code_tracer entities
   predate content-addressing and carry no `sourceRef`/`contentHash`. A separate,
   human-assisted pass per SERIALIZATION.md.
3. **Nothing to redraft.** R1-R8 is discarded, not superseded by a v2.

## Coverage note

The konspekt run above was assembled by fetching entity paths derived from the
edge table plus a directory listing of `noteworthy/`. A genuine orphan - an
entity referenced by no edge - in `nodes/`, `concepts/`, `artifacts/` or
`waypoints/` would therefore not have been fetched, and would be invisible to
this run rather than reported. Running `node lib/validate.mjs .konspekt/instance`
against a working tree closes that gap and is the authoritative check.

Stating it because this document exists to record a claim that was wrong three
times for exactly this kind of reason.
