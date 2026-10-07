# konspekt — review (spec)

The human-in-the-loop gate: how a maintainer's proposed changes become accepted graph state. Reconciliation settles *how* an extraction merges; review settles *who gets to bless the merge*. It exists because the maintainer **proposes** and a human **accepts** — and because the cheapest ingestion mode (the working LLM maintaining its own instance) collapses that separation unless something holds it open. Review is what holds it open.

Like triggers, the *interface* of review — the diff UI, the buttons, when the human is prompted — is host policy, host discretion with no designated home in the standard. This document specifies the discipline the data must obey, not the UX.

## The invariant: the maintainer proposes, an acceptor disposes

One rule, and the rest follows from it:

> The maintainer never *originates* an acceptance. An acceptance is originated only by an **acceptor**: a principal that holds a grant for the atom from a human grantor. In an instance that declares no principals, the acceptor is human.

No confidence threshold, no entity-kind carve-out, and no timeout produces an acceptance, and the agent that proposed an atom never accepts it. A proposal becomes accepted only when an acceptor says so — in the conversation, via prose acceptance or an authority verb (`../data-model/SPEC.md`), each of which carries its own acceptance.

`AUTHORITY.md` defines principals, grants, and the scope that decides which principal may accept which atom. An agent may hold a grant, and only a human may issue one, so every acceptance traces to a human decision: the acceptance itself, or the grant that authorized it. The rest of this file says "the human" for the acceptor, which is exact for an instance with no agent acceptor.

**What the maintainer may write.** Anything it proposes on its own judgment lands `review: proposed` — that is the whole of its discretion. It may nonetheless *write* `review: accepted`, in exactly one case: transcribing an acceptance a human has already given in the conversation, before the write. That is not the maintainer accepting; it is the maintainer recording that acceptance happened, which is why `TRANSPORT.md` can say an entity "is already `review: accepted` by the time it is written" without contradicting this rule. The invariant governs *authorship of the acceptance*, not which literal value the maintainer's write may contain. A maintainer that writes `accepted` without a human having said so has violated the invariant no matter how confident it was; a maintainer that writes `accepted` immediately after the human accepted has not.

This is the rule that un-collapses propose→accept. Self-maintenance ingestion fuses proposing and accepting because one model does both in a single breath; the invariant re-separates them by forbidding the model the second move. The model may *organize* the human's review (below); it may never *substitute* for it.

Rejection is the symmetric human-only move. Synchronously it is prose; the dedicated `reject` verb — a tombstone, not a delete — is part of the deferred asynchronous-review machinery in `TRANSPORT.md`, and must not be confused with the status-axis verbs `refute` / `abandon`.

## Confidence triages attention; it never accepts

Every proposed atom carries `provenance.confidence` (0..1, self-reported by the maintainer). Its **only** role is to order the human's attention: at review time the diff is sorted lowest-confidence-first, so scarce attention lands where the model is least sure. Confidence sorts the queue; it does not gate entry to it.

This is the robust choice, not merely the cautious one. The score is self-reported by the proposing model — exactly the signal that *cannot* be trusted to bless, since confidence is not correctness and a fluent hallucination scores high. But triage is **forgiving of miscalibration** in a way gating is not: if the score is wrong, sorting by it merely reviews items in a suboptimal order — the human still sees every item. Miscalibrated *gating* would auto-accept the wrong thing. Using a noisy, self-reported signal only for ordering is precisely where such a signal is allowed to be noisy.

Upstream consequence: because confidence is the sort key, it is **mandatory on every proposed atom** — a constraint the extraction-layer prompt must enforce. An atom missing a confidence value has no place in the ordering and defaults to the most-attention bucket (treated as lowest), never the least.

## Binding is mandatory, the same way confidence is

Provenance completeness (`BINDING.md`) rides on the same extraction-layer
mechanism as confidence. Every proposed atom must **resolve to an entity binding,
or to a recorded decision not to bind** — an atom with no binding is malformed and
has no place in the graph, exactly as an atom with no confidence value has no
place in the ordering. This is referential integrity, not judgment: it checks that
an atom references an entity that exists, and makes no acceptance decision, so it
leaves the machine-proposes-human-disposes invariant untouched.

It is enforced here, at extraction, and **not** as a gate at persist — a persist
gate that refused unbound atoms would break "review does not block persist"
below. Whether an *unbound* conversation is legal at all is per-instance policy
(the `binding` field); the mandatory-on-every-atom requirement holds regardless.
See `BINDING.md` for the invariant and its scope boundary.

## Batched at the checkpoint

Review is batched at the `persist` checkpoint, not run per-atom. Per-atom review is unworkable under self-maintenance: the model proposes continuously, and prompting after each proposal turns the conversation into a stream of *added X, ok? added Y, ok?* The persist unit is already the natural review unit — one checkpoint, one diff, sorted by confidence, dispositioned together.

This keeps the human's review **coarse** (a session's worth at once) while the maintainer's proposing stays **fine** (per turn). The two cadences differ, and that is fine — they meet only at the checkpoint.

## Review does not block persist

Un-blessed proposals **persist as `proposed`**. Review does not gate the write; an instance may be checkpointed with proposals still pending, to be dispositioned in a later session. Nothing is held hostage in a working copy and lost at session end.

This decouples review cadence from persist cadence — the same move idempotence made for triggers (firing decoupled from correctness). The durable instance is therefore a **mix of `accepted` and `proposed` state**, marked honestly. The cost is borne by the reader: a fresh conversation must filter by `review` to know what is trusted — `accepted` is blessed, `proposed` is the maintainer's unconfirmed claim. That filter is cheap (a field check) and the derived views already encode reading the graph through a lens rather than raw (e.g. *current items* already filter by `supersedes`).

The alternative — persist `accepted` only, hold proposals in the working copy — was rejected: it keeps the durable instance always-blessed but discards any proposal not reviewed before the session ends, trading a cheap reader-side filter for silent data loss. Provenance-and-review-on-everything means a proposal is legitimate state to store, not a draft to hide.

## Acceptance before work

Persisting a proposal is always permitted. Whether work may be bound to an entity before that entity is accepted is a separate question, set per instance by the `basis` field on `Project` (`../data-model/SPEC.md`):

- `basis: proposed` — work may be bound to a proposed entity. This is the default, so every existing instance stays conformant.
- `basis: accepted` — an acceptor accepts an entity before any work is bound to it.

Under `basis: accepted`:

1. **Work** is a `resolved` status, or a row in a provenance log through which a persona layer binds work to an entity. For the engineer layer (`../personas/engineer/`) those rows are changed-code rows and executed-command rows. Each is bound only to an entity that is `accepted`.
2. A resolved node's attached decisions are `accepted`: a Noteworthy of kind `decision` it `notes`, and a `decision` Waypoint that `marks` it.
3. The acceptance comes first. A binding row that has a `timestamp`, such as the engineer layer's changed-code row, is later than a transition row that left the entity `accepted` (`SERIALIZATION.md` § Transitions, § Changed code).
4. An instruction to start work is not an acceptance. The entity that records the work is accepted by an explicit acceptance of that entity, after the acceptor has its text in view.

The conformance checker reports a violation of rules 1 to 3 as an error. The checker reads the instance after the write, so it shows that an acceptance preceded a binding and cannot show that it preceded the first edit of a file. A host that can refuse a file edit SHOULD refuse an edit outside the instance while the entity the conversation is bound to is not `accepted`. That behavior, like the binding ask itself (`BINDING.md`), is host policy.

## Scope

**In:** the discipline — maintainer-proposes-only, acceptor-accepts-only, confidence-triages-attention, binding-mandatory-at-extraction, batch-at-checkpoint, persist-proposed, and the `basis` policy for acceptance before work. Binding-neutral; identical on GitHub, Drive, or paper. Who is an acceptor is defined in `AUTHORITY.md`.

**Out:** the review *surface* — how the diff is shown, how the human is prompted, what a click does, and how the human is asked which entity a conversation binds to (`BINDING.md`). Host policy — host discretion with no designated home in the standard — and may differ per binding: an inline conversational diff today; a queue or dashboard for an asynchronous binding later, which is also where the `accept` / `reject` verbs and any pull-request projection live (see `TRANSPORT.md`).
