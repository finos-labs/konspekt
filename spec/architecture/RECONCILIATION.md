# konspekt — reconciliation (spec)

How a fresh extraction is merged into an existing instance without duplication
or clobbering. Each extracted atom is classified against the current graph as
**new | duplicate | update | conflict**. This document covers resolving an atom
to an existing entity, the idempotence guarantee that makes a pass safe to
re-run, and how the *update* and *conflict* buckets are handled.

## Resolution ladder (deterministic tier)

Resolve an incoming atom to an existing entity by trying these in order,
stopping at the first hit. Ordered by **exactness**, not by how often each is
encountered.

1. **id** — the atom carries an explicit `type:id`. Exact identity. A **path**
   is a deterministic function of `(type, id)`, so reaching the file by path and
   matching by id are the *same* gate: id is the durable key, path is its
   filesystem projection. The id is never derived from mutable text (e.g. a
   label slug) — otherwise a relabel moves the path and dangles every edge
   pointing at it.
2. **alias** — the atom is only a surface form (a label or phrase). Look it up
   in the `label + alias → id` index. A *unique* hit resolves to the id;
   **multiple hits return a candidate set** (aliases are not guaranteed unique)
   which escalates rather than auto-resolving.
3. **miss** — no deterministic hit. Escalate to the fuzzy / LLM tier, then human
   review. Every accepted merge **appends the new surface form as an alias**, so
   the deterministic tier widens and the fuzzy tier shrinks as the instance
   ages.

Two consequences fall out of the ladder:

- **Edges resolve for free** once their endpoints resolve: edge identity is
  `(kind, from, to)` over already-resolved ids, so it is idempotent by
  construction.
- **Artifacts** use `location` as a near-key within tier 1.

An alias is a *synonym* — an alternate name for the same concept — not a short
label for an entity's contents (that is what `summary` is for). Aliases live on
`Concept`.

## Alias index (derived, never stored)

The `label + alias → id` lookup is a **derived view**, built at reconcile time
by scanning Concept entities — not a stored file. Aliases live on Concept; the
index is a query over them, exactly as the concept inventory is a query over
`mentions` edges. This preserves a single source of truth: no sync step,
nothing to invalidate on create / merge / relabel, nothing to churn the diff.
It also matches the model's rule that derived views are never serialized.

- The index is a **multimap**, not a map: a normalized surface form maps to
  *one or more* ids. A single-id key resolves deterministically; a multi-id key
  returns the candidate set that escalates. This is how non-unique aliases stay
  safe.
- The **normalization function** applied while building (case, whitespace,
  punctuation folding) is the actual deterministic match key — it defines what
  counts as "the same surface form" — and must be specified explicitly.
- Build cost is a trivial in-memory map over a human-scale concept set; the
  performance argument for materialization does not apply. Caching would only
  matter at a scale beyond this project, and even then is a cache, not a commit.
- Scope: this concerns the *deterministic* alias index only. If the fuzzy tier
  later needs an expensive structure (e.g. an embedding index for semantic
  matching), that is a separate caching decision and does not change this one.

## Idempotence (content-addressed source)

Running the pass twice yields the same instance as running it once —
`f(f(x)) = f(x)`: no duplicated entities, no churned summaries, no second
commit. This is what makes a pass safe to re-run — after a crash, on a timer,
or mid-session.

The guarantee rests on **content-addressed provenance**. Ingestion is
*push-based*: at extraction time the maintainer writes the source excerpt into
the store as a content-addressed file and stamps each atom's provenance with
its `sourceRef`, the `ni:///sha-256` reference over the excerpt's raw bytes
(`SERIALIZATION.md` § Content references). A source's identity *is* its content
hash, so the store holds byte-identical excerpts once, under one file name, in
every binding.

Idempotence lives at two levels; **match-level is primary** (the inversion from
an earlier watermark-first design).

- **Match-level (content-addressed dedup).** Re-extracting a consumed exchange
  reproduces the same source excerpt → the same `sourceRef` → the store
  already holds that blob and the atoms resolve to existing entities. Nothing
  changes. This is robust *because the source text is near-deterministic even
  when atom extraction is not*: copying bytes reproduces them; interpreting them
  need not. Anchoring identity on the source rather than on the extracted atoms
  puts the stable key *underneath* the unstable layer — the one place it can be
  trusted.
- **Skip-level (optimization).** To avoid paying for re-extraction at all, a
  pass may process only the tail — exchanges newer than the latest source
  `timestamp` already recorded for a conversation. Ordering is by **timestamp**,
  not by a host message id the maintainer cannot read. This is now an
  *optimization*, not the correctness guarantee: skip it, or get the cut wrong,
  and match-level still makes the pass a no-op.

**Edited / branched messages need no special case.** Changed text hashes to a
different `sourceRef`, so it is simply a *different source*; its atoms are new
extractions, reconciled normally against the graph. Identity-by-content absorbs
the edit — the old "same id, changed hash" branch is retired.

**Cross-conversation** interference does not arise: identity is global by
content hash, and `conversationId` is optional grouping metadata, not a
correctness key.

**Verify probe.** An entity's provenance verifies **iff** SHA-256 over the raw
bytes the store returns for its `sourceRef` (`STORAGE.md` `getSource`) equals
the reference's digest. The reference carries its own digest, so `contentHash`
is derived from `sourceRef` by parsing and is not stored. In every binding the
probe can fail only on missing content or on bytes that differ from the ones
referenced — a corrupt store, an edited file, or a store that returned other
content. A locator (`SERIALIZATION.md` § Sources) is never verified this way:
it records where the excerpt was taken from, and the text at a locator may
drift without affecting the stored excerpt. Legacy git-blob-SHA-1 provenance
verifies by `git hash-object` of `sources/<sha1>.md` equalling its stored
`contentHash`.

Consequence: once re-runs are no-ops, the pass is safe to trigger **any way** —
end-of-session, scheduled, manual, post-crash — instead of requiring fragile
exactly-once delivery. This is what frees the trigger + transport stream.

> Provenance support: idempotence relies on `provenance.sourceRef` (the
> content-addressed source the store dedups on, whose digest the verify probe
> checks); the skip-level optimization orders by
> `provenance.timestamp`. All are defined on `Provenance` in
> `../data-model/schema.ts`.

## Status transitions and supersession

After the ladder matches an atom to an existing entity, two cases remain where
the atom is **not** a duplicate. One test separates them: **is a second entity
involved?**

**No second entity → status transition (the *update* bucket).** New prose
changes the *state* of one existing entity: an assumption
`unvalidated → validated`, a node `open → resolved`, a constraint
`active → lifted`. Handle it by flipping that entity's own `status` field —
*never* by adding an edge. A transition has only one endpoint, so an edge would
need a phantom "event" node; and the derived views (`open assumptions`, …) read
`status`, so the field must move regardless. An edge alongside it would be a
second source of truth for one fact. The *evidence* (which source bears the
transition) is recorded as **provenance** on the change. The human path is the
authority verbs (`validate`, `resolve`, `lift`, …); the maintainer may *propose*
a transition, which review confirms.

**A second entity → supersession (the *conflict* bucket).** New prose
contradicts or replaces an existing entity (a later decision overturns an
earlier one). This relates *two* entities, so it is a single `supersedes`
**edge** — `from` the superseding (new) entity, `to` the superseded (old) one.
Both entities stay in the graph; the edge records that one replaced the other.
Neither is deleted, so the reversal itself stays legible.

One edge kind suffices, not two. An unresolved contradiction versus a confirmed
replacement is the *same* edge in two **review** states: a **proposed**
`supersedes` edge is a flagged contradiction awaiting the human; **accepting**
it confirms the replacement. The `review` field already carries this — no
`negates` kind needed. Evidential relations ("supports") are deliberately not
typed: nothing transitions, so they stay out of this family.

Both cases mutate or annotate **accepted** state, so they pass through review
like any proposal and must carry provenance, or the next pass will re-propose
them. 

Derived view: **current items** = entities with no inbound `supersedes` edge
(the live decision among superseded ones).
