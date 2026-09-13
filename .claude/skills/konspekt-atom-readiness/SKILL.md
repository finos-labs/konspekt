---
name: konspekt-atom-readiness
description: >-
  For an agent maintaining a konspekt instance (a repository carrying a
  `.konspekt/instance/`). After each substantive exchange, detect whether a
  durable atom has crystallized, and — when one has — venture a specific sync
  proposal to the human ("a good moment to sync X into Y"), always as
  `review: proposed`, never self-accepted. Forces the propose half of the
  operating loop so capture does not depend on the agent spontaneously
  remembering to do it.
---

# konspekt atom-readiness

Use this skill whenever you are working in a repository that carries a konspekt
instance (a `.konspekt/instance/` directory). It governs the **propose** half of
the konspekt operating loop: turning what just happened in the conversation into
graph proposals at the right moment, in the right shape, without overstepping
into acceptance.

The data model, entity types, and human vocabulary are owned by the konspekt
standard (`spec/data-model/SPEC.md`); the trigger policy by the instance's
`.konspekt/OPERATING.md`. This skill does not redefine them — it operationalizes
them into a reliable behavior, because the cheapest ingestion mode (the working
agent maintaining its own instance) silently drops captures unless something
forces the propose step. This skill is that forcing function.

## The core obligation

After each substantive exchange you MUST run the readiness check below. When an
atom is ready you MUST venture it as a proposal **before moving on**. You MUST
NOT accept your own ventures. You MUST NOT persist to the store without a human
command — but when that command comes, what you write is `review: proposed`
unless the human accepted the content itself.

"Substantive" excludes pure acknowledgements, clarifying questions, and
mechanical back-and-forth. A turn that decided something, named something,
finished something, or changed the status of something is substantive.

## Print the task text before working it

Before you act on a task node — implementing it, investigating it, or venturing
a status change to it — print the task's text to the human: its id, title,
current `status` and `review`, and its body. Read it from the file on disk, not
from memory. Work on a task is grounded in the persisted node, and the human who
will accept or reject a resulting change needs the same source in view rather
than a paraphrase. Do this whenever a task becomes the focus of the exchange —
including when the human names it — and again when you return to it after other
work.

## What a "ready atom" is

An atom is ready when something durable has **settled** — not when it is merely
being discussed. Map the settled thing to an entity type:

| What just settled | Propose |
|---|---|
| A decision was made and is stable | Noteworthy (`kind: decision`); add a Waypoint if it is an inflection — a `decision`, `milestone`, or `pivot` on the timeline |
| A concept, principle, or coined term is now in use | Concept node |
| A durable finding settled — fact, statement, assumption, or constraint | Noteworthy; pick the `kind` by *Choosing a type* in `spec/data-model/SPEC.md` |
| A node started, resolved, was abandoned, or superseded | Node **status transition**, via the authority verb |
| A deliverable was produced (doc, script, spec, dataset) | Artifact node + a `produces` edge from the owning task |
| A new branch of work opened | New Node, `decomposes` from its parent; pick the node type (`goal`, `investigation`, `experiment`, `topic`, `task`, `note`) by *Choosing a type* in `spec/data-model/SPEC.md` |
| A relationship between existing entities became clear | Edge (`mentions`, `relates`, `notes`, `marks`) |
| New state contradicts or replaces prior state | `supersedes` edge + a status flip on the affected entity |

If the settled thing maps to nothing here, it is probably not a graph atom —
hold.

Choosing the type *within* a family — node type, Noteworthy `kind`, Waypoint
`kind` — is governed by *Choosing a type* in `spec/data-model/SPEC.md`. Do not
reach for a more specific type than the evidence supports: an `investigation`
with no stated expected result is not an `experiment`, and a source's claim is a
`statement`, not a `fact`.

## The readiness bar — when to HOLD

Bias toward holding. Do NOT venture when:

- the point is still being **debated** or weighed — wait until it lands;
- it is **ephemeral** — conversational color, a passing example, a tangent;
- it belongs in the **scratchpad** — the `note:` / `note "…"` convention writes
  to `.konspekt/NOTES.md` and is never a graph atom;
- it **restates an existing entity** — do not duplicate; at most propose an
  update or a `supersedes`;
- it is **half-formed** — a direction, not yet a decision.

The failure is real in both directions: venture too eagerly and you recreate the
per-turn noise the trigger policy deliberately excluded; hold too long and the
atom falls out of context unrecorded. Hold by default; venture on
crystallization.

## How to venture

A venture is a **specific, concrete proposal**, not a vague offer. Name the atom,
the target entity (type and a proposed id), and the wiring. Make it acceptable
or rejectable in one read.

Good:

> Syncing this as proposed: a new `task-adoption-path` under
> `goal-portability`, producing `artifact-setup`, with a `wp-setup-kit`
> waypoint. Confidence 0.7 on the waypoint — it may be routine rather than an
> inflection. Review it whenever.

Not good:

> Should I update the graph?

Batch ready atoms at natural checkpoints rather than firing one prompt per atom.
One venture can carry several proposals; present them together.

## Propose-accept discipline (non-negotiable)

- Everything you venture is `review: proposed`, and every proposed atom MUST
  carry `provenance.confidence` (0..1). It is the sort key for the human's
  review queue; an atom without it defaults to the most-attention bucket.
- You never *originate* an acceptance. You may write `review: accepted` in
  exactly one case: transcribing an acceptance the human already gave in the
  conversation — a command (`sync` / `persist` / `sync_persist`) or an authority
  verb (`pin` / `validate` / `refute` / `resolve` / `abandon` / `lift`), each of
  which carries its own acceptance. Writing `accepted` because you were
  confident, or because a terse go-ahead seemed to cover it, is a violation.
- **Review does not block persist.** Proposals persist as `proposed`
  (`spec/architecture/REVIEW.md`). Do NOT hold ventures in the working copy
  waiting for a blessing, and do NOT ask for acceptance in order to write them —
  push them marked honestly and let them accumulate. The human dispositions a
  batch when they choose to, sorted lowest-confidence-first. An instance that is
  uniformly `accepted` is evidence this rule is being broken.
- A terse go-ahead ("go", "do it", "proceed") authorizes you to *act* — to write
  and persist. It is not an acceptance of the atom's content unless the human
  addressed the content. When in doubt, persist it `proposed`; that costs the
  human one queue entry, while a wrong `accepted` silently launders your
  judgment as theirs.
- Give every atom you persist — proposed or accepted — content-addressed
  provenance: a verbatim both-sides source excerpt in
  `.konspekt/instance/sources/`, its git blob SHA as `contentHash`, cited from
  the entity (see `spec/architecture/SERIALIZATION.md`). Lighter provenance
  (conversation id + timestamp) is for entities that predate the mechanism, not
  new ones.

## Anti-patterns

- **Silent drift** — finishing a substantial piece of work (a spec, a kit, a
  decision) and moving on without venturing it. This is the exact failure this
  skill exists to prevent; the most adopter-relevant deliverable is the easiest
  one to forget.
- **Self-acceptance** — proposing and writing `accepted` in one breath because
  you are confident. Confidence triages attention; it never accepts.
- **Acceptance-seeking** — asking "want me to persist?" and treating the reply
  as a blessing of the content. It collapses propose and accept into one step,
  which is the exact fusion this discipline exists to hold open, and it leaves
  the review queue permanently empty.
- **Narration** — turning every turn into "added X, ok?". Respect the bar.
- **Vague venturing** — "want me to capture that?" without naming the entities. A
  proposal the human cannot accept or reject in one read is noise.
- **Duplication** — proposing a Noteworthy that restates an existing one. Read
  the instance first; prefer an edge or a `supersedes`.

## Boundaries

This skill governs proposing. It does not grant acceptance authority, does not
define the entity schema or verbs (the standard does), and does not set the
trigger policy (the instance's `OPERATING.md` does). When the standard and a
venture conflict, the standard wins; report the conflict rather than bending the
schema.
