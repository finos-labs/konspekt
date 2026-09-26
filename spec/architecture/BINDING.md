# konspekt — binding (spec)

Provenance completeness: **every proposed atom resolves to an entity binding, or
to a recorded decision not to bind.** This is the fifth invariant, alongside the
four in `README.md` (the store stays simple; the read path is neutral;
distribution is projection; accept does not converge). It closes the gap where a
whole conversation produces no entity, so its source text is referenced nowhere
and leaves no trace — the failure mode that motivated it.

Like the review *surface* and the trigger, the **behavior** that satisfies this
invariant — when and how the human is asked which entity a conversation attaches
to — is host policy, host discretion with no designated home in the standard
(see `.konspekt/OPERATING.md` for this instance's behavior). The spec owns only
the invariant, exactly as it owns idempotence but not the trigger that relies on
it.

## The invariant

> An atom is **bound** when it carries a resolvable reference to an entity: its
> `provenance` anchors it to a source, and it attaches to the graph through at
> least one entity (its own identity for an entity; an edge endpoint for an
> edge). A conversation is **bound** when the atoms extracted from it are bound to
> a live entity. A conversation may instead be **recorded as unbound** — a marker
> that a human declined to bind it — which is itself a bound atom.

The point is that a persisted conversation is never *silent*: it resolves either
to entities or to an explicit, auditable record that it was left unbound. There
is no third state in which work happened and the graph shows nothing.

## Referential integrity, not judgment

Binding is a **referential-integrity** constraint: it checks that an atom
references an entity that exists, the way a foreign key requires a valid parent.
It makes no judgment about whether the atom is *correct* or *worth keeping* —
that judgment is acceptance, which stays exclusively human and lives in the
review conversation (`REVIEW.md`). Because binding is integrity and not judgment,
it does not collide with the machine-proposes-human-disposes invariant: the
maintainer may propose a bound atom on its own; only *accepting* it remains the
human's move.

## Enforced at extraction, not at persist

Completeness is enforced the same way `provenance.confidence` is (`REVIEW.md`):
**mandatory on every proposed atom, a constraint the extraction layer enforces.**
An atom with no binding is malformed and never becomes well-formed — the same
status as an atom with no confidence value.

It is deliberately **not** a gate at `persist`. A persist-time gate that refused
to flush unbound atoms would contradict a governing rule of this architecture —
"review does not block persist; nothing is held hostage in a working copy"
(`REVIEW.md`) — by holding atoms hostage until bound. Enforcing at extraction
gives the same guarantee (a well-formed atom is always bound) while leaving the
persist path unblocked: proposals, bound, persist as `proposed` and are
dispositioned later.

## Per-instance policy

Whether an *unbound* conversation is a legal state is set per instance by the
`binding` field on `Project` (`../data-model/SPEC.md`):

- `binding: optional` — a human may decline to bind a conversation; the decline is
  recorded (a waypoint), so the absence is auditable. Suits low-stakes and
  dogfooding use, where forcing binding on trivial chats would push them out to an
  untracked tool.
- `binding: required` — there is no legal unbound state; every conversation must
  resolve to an entity. Suits audit and enterprise use, where an unrecorded
  AI-driven conversation is unacceptable.

Absent the field, `optional` is the default, so every existing instance stays
conformant.

## Scope

**In:** the invariant (every proposed atom is bound, or recorded as an explicit
non-binding); its extraction-layer enforcement; the referential-integrity
framing; the `binding` policy field.

**Out:** *how* the human is asked which entity to bind to, when the ask fires, how
an active-entity switch is proposed and confirmed, and how a declined binding is
surfaced. Host policy — host discretion with no designated home in the standard —
and may differ per binding and per instance. This instance's behavior is in
`.konspekt/OPERATING.md`.
