# konspekt — technical whitepaper

A portable, human-readable record of a project's evolving state across
generative-AI conversations and platforms.

> **Status of this document.** This is a non-normative technical summary for a
> reader who may implement against konspekt, adopt it, or evaluate it. The
> normative sources are `spec/data-model/` (the portable vocabulary) and
> `spec/architecture/` (reconciliation, serialization, transport, review). Where
> this document and a file under `spec/` differ, the file under `spec/` governs.
> Section references below point at the file that owns each definition.

---

## 1. Motivation and stance

A *konspekt* (a Slavic and German academic term) is a structured, condensed
rendering of a larger body of material: notes that preserve the structure of a
source so a reader can carry its essentials without replaying the whole. The
project applies that idea to the state a person accumulates while working with
generative-AI tools.

The standard exists to solve two problems (`README.md`):

1. **Follow the thread.** Externalize project state — decisions, open questions,
   artifacts, provenance — into a durable record instead of holding it in one
   person's memory across long conversations.
2. **Port across platforms.** Represent a project in a platform-neutral form so
   it can move between generative-AI tools without losing the instructions,
   accumulated context, and conventions that connect its parts.

The dogfood instance records a third, convergent goal: make the curated record a
high-quality input back to the LLM (`.konspekt/instance/project.md`). All three
converge on one object: a durable, structured, human-readable representation of
project state that lives outside any single conversation.

**Stance** (`README.md`):

- **Open and impact-primary.** The intended outcome is the industry handling
  project portability well. A vendor adopting or copying the format is the
  intended result, not a competitor to defend against.
- **Legible over defensible.** Success is measured by other people implementing
  against the standard, not by preventing them from doing so.
- **Lowest-common-denominator on purpose.** Human-readable files that survive a
  copy-and-paste between any two platforms and diff cleanly in version control.

These commitments determine specific design decisions later (for example, why the
reference transport binding writes to a git `main` branch directly rather than
through a pull request, and why a binding that hides state behind a vendor
surface is rejected by definition).

---

## 2. Data model

Owned by `spec/data-model/SPEC.md` and rendered in TypeScript at
`spec/data-model/schema.ts`. The guiding rule: store each fact once, and make
every "inventory" a query over edges rather than a stored list. Duplication is
the failure mode the model is built to prevent, because divergence follows
duplication.

### 2.1 Principles

1. **Single source of truth.** Concepts, noteworthy items, and artifacts are
   first-class entities, stored once. "This node's concepts" and "the project's
   concepts" are queries over edges, not stored lists.
2. **One graph, not two.** Hierarchical goal decomposition and associative
   cross-links share one `Edge` table, distinguished by `kind`. The goal tree is
   `edges where kind = "decomposes"`; every other relationship is a filtered
   view over the same table.
3. **Auditable by construction.** Every entity carries `provenance` — a
   content-addressed pointer to its source text plus a construction-time digest,
   a source `timestamp`, and optional confidence — and a `review` state
   (`proposed → accepted | rejected`), because an LLM maintainer *proposes*
   updates that a human *accepts*.
4. **Summaries compose; the human's summary wins.** Each node owns its
   `summary`; the project summary composes the node summaries; a `pinned`,
   human-origin summary is never overwritten by the maintainer.

### 2.2 Entities

| Entity | Key fields | Notes |
|--------|-----------|-------|
| **Project** | `goal`, composed `summary`, timestamps | Root. No stored aggregates; they are derived views. |
| **GraphNode** | `type`, `title`, `summary`, `status` | `type ∈ {goal, investigation, experiment, topic, task, note}`; `status ∈ {open, active, resolved, abandoned}`. Hierarchy lives in edges, so a node can sit under more than one parent. |
| **Concept** | `label`, `definition?`, `aliases[]` | Referenced via edges, never copied. `aliases` are surface forms used for deduplication and merge. |
| **Noteworthy** | `kind`, `text`, `status?` | `kind ∈ {fact, statement, decision, assumption, constraint}`. `status` matters for some kinds: an assumption is `unvalidated | validated | refuted`; a constraint is `active | lifted`. |
| **Artifact** | `name`, `kind?`, `location?`, `version?` | A produced deliverable: document, code, dataset, link. |
| **Waypoint** | `kind`, `description`, `timestamp` | `kind ∈ {decision, milestone, pivot}`. The timeline axis. Deliberately not part of the goal tree. |

`decision` is intentionally absent from `NodeType`: a decision is a Noteworthy
item and becomes a Waypoint or a Node only under the decision rule below
(`spec/data-model/schema.ts` line 10).

### 2.3 The decision rule

One underlying decision has up to three representations, each with a single rule
(`spec/data-model/SPEC.md` § The decision rule):

- Always recorded once as a **Noteworthy** item (`kind: decision`) — the atomic,
  always-true record.
- Additionally a **Waypoint** if it is an inflection point worth showing on the
  timeline.
- Additionally a **Node** only if it opens a branch of work to track.

### 2.4 Edges

One typed table. `from` and `to` are `EntityRef` values (`type:id`). `weight` is
meaningful only for `relates`.

| `kind` | Direction | Meaning |
|--------|-----------|---------|
| `decomposes` | node → node | The goal tree. |
| `mentions` | node → concept | A node references a concept. |
| `relates` | concept → concept | Untyped association; optional `weight` for strength. |
| `produces` | node → artifact | A node produced a deliverable. |
| `notes` | node → noteworthy | A node carries a noteworthy item. |
| `marks` | waypoint → node | The branch a waypoint sits on or opened. |
| `supersedes` | entity → entity | A new entity replaces an old one (the old one is the `to`). |

Edge identity is `(kind, from, to)` over resolved ids, which makes edge merging
idempotent by construction (`spec/architecture/RECONCILIATION.md`).

`supersedes` is the one truth-changing relation promoted to its own kind. A
**proposed** `supersedes` edge is a flagged contradiction awaiting review;
**accepting** it confirms the replacement. Both entities stay in the graph —
the model appends rather than rewrites — so a reversal stays readable.
Concept-to-concept relationships are otherwise left untyped (`relates` with an
optional numeric `weight`) to avoid committing to a relationship ontology;
evidential relations such as "supports" are deliberately not typed
(`spec/data-model/SPEC.md` § Note on concept relationships).

### 2.5 Cross-cutting structures

- **Provenance** (`spec/data-model/schema.ts` lines 64–80): `sourceRef`
  (content-pinned address of the source excerpt), `contentHash` (digest of that
  source text captured at construction time), `timestamp` (ISO 8601, when the
  source exchange happened — source time, not persist time), optional
  `confidence` (0..1, self-reported by the maintainer), optional
  `conversationId` (host-injected grouping metadata, never minted by the
  maintainer). Provenance anchors on the source text, not on a host-supplied
  conversation or message id the maintainer cannot read from inside a chat. The
  retired `messageId` field is documented as removed.
- **Review**: `proposed | accepted | rejected`. Everything the maintainer
  extracts is `proposed`; a human accepts or rejects.
- **Summary**: `text`, `origin` (`machine | human`), `pinned`, `updatedAt`. A
  pinned summary is never regenerated.

### 2.6 Derived views (never stored)

These are queries over the entities and the edge table, not serialized state
(`spec/data-model/SPEC.md` § Derived views, `spec/data-model/schema.ts`
lines 157–170):

- **project concept inventory** = concepts with any inbound `mentions` edge
- **node concept inventory** = concepts with a `mentions` edge from that node
- **goal tree** = `edges where kind = "decomposes"`
- **timeline** = waypoints ordered by `timestamp`
- **open assumptions** = noteworthy where `kind = "assumption"` and
  `status = "unvalidated"`
- **current items** = entities with no inbound `supersedes` edge (the live item
  among superseded ones)

### 2.7 Human vocabulary

A small set of distinct verbs a human issues to assert judgments the reactive
maintainer should not make on its own (`spec/data-model/SPEC.md` § Human
vocabulary). Every verb is a convention, not a requirement: it reads as plain
English over an entity reference, so an LLM on a platform that has never been
configured for konspekt can approximate the right effect with no parser,
runtime, or special tokens. A human-issued verb carries its own acceptance: the
resulting change lands `review: accepted`, not `proposed`.

| Verb | Reference | Effect |
|------|-----------|--------|
| `pin <ref>` | any summarized entity | `summary.pinned = true`; the maintainer never regenerates that summary |
| `validate <ref>` | noteworthy (assumption) | `status → validated` |
| `refute <ref>` | noteworthy (assumption) | `status → refuted` |
| `resolve <ref>` | node | `status → resolved` |
| `abandon <ref>` | node | `status → abandoned` |
| `lift <ref>` | noteworthy (constraint) | `status → lifted` |

`<ref>` is an entity `id` or a natural-language description the maintainer
resolves to one; an ambiguous reference is surfaced for disambiguation, never
guessed. These verbs are surface forms over two generic constructs: a pin
operation and a generic `mark <ref> <state>` status transition. *Capture* verbs
(force-creating a `task`, `concept`, or `constraint` directly as `accepted`) are
deferred, because the reactive layer already catches most net-new entities.
`note:` is reserved for a separate human scratchpad (`.konspekt/NOTES.md`) and is
not a konspekt capture verb.

---

## 3. Architecture

The architecture is four separable contracts: reconciliation (how a fresh
extraction merges), serialization (what lands on disk), transport (where the
instance lives and how a conversation reads and writes it), and review (who
blesses a merge). Keeping them separate stops a decision in one from constraining
the others (`spec/README.md`).

### 3.1 Reconciliation and idempotence

Owned by `spec/architecture/RECONCILIATION.md`. Each extracted atom is
classified against the current graph as **new | duplicate | update | conflict**.

**Resolution ladder** (deterministic tier), tried in order, stopping at the first
hit:

1. **id** — the atom carries an explicit `type:id`. A path is a deterministic
   function of `(type, id)`, so reaching a file by path and matching by id are
   the same gate. The id is never derived from mutable text (such as a label
   slug), so a relabel does not move the path or dangle the edges pointing at it.
2. **alias** — the atom is a surface form. Look it up in the
   `label + alias → id` index. A unique hit resolves; multiple hits return a
   candidate set that escalates rather than auto-resolving.
3. **miss** — no deterministic hit. Escalate to the fuzzy / LLM tier, then human
   review. Every accepted merge appends the new surface form as an alias, so the
   deterministic tier widens as the instance ages.

The alias index is a **derived multimap** (`label + alias → id`), built at
reconcile time by scanning Concept entities — not a stored file. A normalization
function (case, whitespace, punctuation folding) defines what counts as "the
same surface form" and must be specified explicitly.

**Idempotence** is the property that running a pass twice yields the same
instance as running it once: `f(f(x)) = f(x)`. It rests on **content-addressed
provenance**. Ingestion is push-based: at extraction time the maintainer writes
the source excerpt into the store as a content-addressed blob and stamps each
atom's provenance with that `sourceRef` and its `contentHash`. Identity lives at
two levels:

- **Match-level (primary).** Re-extracting a consumed exchange reproduces the
  same source excerpt → the same `contentHash` → the store already holds that
  blob and the atoms resolve to existing entities. This is robust because the
  source text is near-deterministic even when atom extraction is not: copying
  bytes reproduces them; interpreting them need not. The stable key sits
  underneath the unstable extraction layer.
- **Skip-level (optimization).** A pass may process only exchanges newer than the
  latest recorded source `timestamp` for a conversation. This is an
  optimization, not the correctness guarantee: skip it or get the cut wrong, and
  match-level still makes the pass a no-op.

Edited or branched messages need no special case: changed text hashes to a
different `contentHash` and is reconciled as a different source. The **verify
probe**: an entity's provenance verifies iff hashing the text at its `sourceRef`
reproduces its stored `contentHash`. In the GitHub binding this is structural —
the blob SHA is the hash — so it can fail only on a dangling pointer or a corrupt
store; `sourceRef` and `contentHash` are kept as two fields so a future binding
whose addressed text can drift still has a real integrity gate.

After the ladder matches an atom that is not a duplicate, one test separates the
remaining two cases — **is a second entity involved?**

- **No second entity → status transition (the *update* bucket).** New prose
  changes the state of one existing entity (an assumption `unvalidated →
  validated`, a node `open → resolved`). Handle it by flipping that entity's own
  `status` field, never by adding an edge: a transition has one endpoint, and the
  derived views read `status`. The evidence is recorded as provenance on the
  change.
- **A second entity → supersession (the *conflict* bucket).** New prose
  contradicts or replaces an existing entity. This relates two entities, so it is
  a single `supersedes` edge from the new entity to the old one. Both stay in the
  graph.

Both cases mutate or annotate accepted state, so they pass through review like
any proposal and must carry provenance, or the next pass re-proposes them.

The consequence that ties the architecture together: once re-runs are no-ops, a
pass is safe to trigger any way — end-of-session, scheduled, manual, or after a
crash — instead of requiring exactly-once delivery. This is why the standard does
not specify trigger timing.

### 3.2 Serialization (v1 on-disk format)

Owned by `spec/architecture/SERIALIZATION.md`. Version **v1**, matched to
`spec/data-model/schema.ts`. The locked, lowest-common-denominator on-disk form.

```
<instance>/
  project.md
  nodes/<type>/<id>.md      # one directory per NodeType
  concepts/<id>.md
  noteworthy/<id>.md
  artifacts/<id>.md
  waypoints/<id>.md
  sources/<contentHash>.md  # content-addressed provenance excerpts (not entities)
  edges/edges.md            # single typed edge table
```

Each entity is one file: a fenced `yaml` front-matter block holds the structured
fields, followed by a Markdown body holding the entity's primary prose field
(Project and GraphNode: `summary.text`; Concept: `definition`; Noteworthy:
`text`; Waypoint: `description`; Artifact: an optional note).

Rules:

- `id` is kebab-case, globally unique, and equals the filename without `.md`.
- `Summary` serializes as `summary: { origin, pinned, updatedAt }`; its `text`
  lives in the body, so it is not duplicated.
- `Provenance` serializes as a nested map (`sourceRef`, `contentHash`,
  `timestamp`, `confidence?`, `conversationId?`).
- A file may declare a file-level `provenance` / `review` default when every
  entry shares it (used by the edge table).

`edges/edges.md` is a single table — `id | kind | from | to | weight` — with
`provenance` and `review` declared once at file level. Per-edge files are a valid
v1 variant if the table grows unwieldy.

`sources/<contentHash>.md` holds source excerpts, which are not graph entities:
plain Markdown, no front-matter, no `id`. The filename is the excerpt's git blob
SHA, so `provenance.sourceRef` resolves to `sources/<sourceRef>.md` and the
verify probe is `git hash-object` of that file equalling the stored
`contentHash`. The directory is **append-only**: editing an excerpt yields a new
hash and a new file. An excerpt is **verbatim and covers every participating
turn** — human prompts and assistant responses, copied, never paraphrased.
Curation is permitted only as selection (choosing which spans to include and
eliding the rest); rewriting a span is prohibited, because a paraphrase
reintroduces interpretation at the one layer whose role is to be the
near-deterministic anchor. The specific failure to guard against is asymmetry:
capturing the human verbatim while compressing the assistant. Both sides are
source.

Breaking changes to layout or field encoding bump the version to v2; additive,
backward-compatible changes do not.

### 3.3 Transport contract and bindings

Owned by `spec/architecture/TRANSPORT.md`. A transport is any store that can hold
the instance directory and hand it back. The contract is two operations:

- **read** — pull the current instance (or a subtree) out of the store.
- **write** — put a set of changed files back, producing a new durable version.

Versioning (each write yields a recoverable prior state) and neutral, public
access are required. Branching, locking, and merge are not required; the model
requires none of them.

The operating loop's checkpoint verbs are orchestration above the two store
operations, not part of the store contract:

| Verb | Store op | Touches |
|------|----------|---------|
| `load` | read | pulls the durable instance into the working copy |
| `sync` | — | reconciles incoming atoms into the working copy only; no store op |
| `persist` | write | flushes the working copy to the store |
| `sync_persist` | write | `sync` then `persist`, as one durable step |

The store only ever sees `read` and `write`; the verbs are identical on every
binding because they are defined above the binding.

**Conformance** is the portability claim made testable. A binding conforms iff it
offers neutral, public read and write over the instance directory. *Neutral*
means the instance is the agreed Markdown serialization, not a vendor-internal
representation. *Public* means read and write are reachable by something other
than the vendor's own surface. The probe is **manual re-upload**: if a human can
export the instance from binding A, hand it to binding B, and have B read it, the
interface is public and neutral enough. A binding that materializes state but
exposes no neutral public read/write is not a konspekt transport.

**Review lives in the conversation, not in the transport.** Persisting is not
accepting: `persist` writes whatever review state the working copy holds.
Acceptance happens in the conversation, before persist, via the human vocabulary.
This is why the reference binding writes to git `main` directly and the reference
flow uses no pull requests: a pull request is a review surface added to the
transport that forces the human out of the conversation, and auto-merging it
deletes the review gate while keeping the extra step. Writing accepted state to
`main` is contract-legal because the review gate already happened, carried by
human authority.

**Reference binding: GitHub** (`read` = read file/tree contents; `write` = commit
a set of files). Versioning is native commit history; recovery is git revert or
checkout; raw Markdown over a URL any tool can fetch satisfies neutral and public
and passes the manual-re-upload probe, because the files are the instance. GitHub
is chosen because it provides no defensibility: the reference exists to be
out-implemented and to give a second implementer something concrete to conform to
or copy.

**Binding trajectory** — one contract, three bindings, differing only on where
the durable store and the maintenance runtime live:

| Binding | Store + runtime | Status |
|---------|-----------------|--------|
| **GitHub** | neutral git store; runtime is the conversation holding credentials | v1 reference |
| **Vendor-baked** | both inside each generative-AI platform | best outcome; not yet real |
| **Connector + central service** | a dedicated konspekt host the platforms call | plausible alternative |

Vendor-baked native maintenance is the best outcome for *follow-the-thread* but
is neutral-to-dangerous for *port-across-platforms*: if a vendor bakes in a
private store with no neutral public read, lock-in moves up a level. The
conformance clause disarms this — a baked-in store that does not expose neutral
public read/write is not a conformant binding by definition.

**Asynchronous review** is a future projection, not part of v1. A binding may run
a pass unattended, write a set of `review: proposed` entries, and have a human
clear that queue later. That mode needs first-class `accept` / `reject` verbs,
where `reject` is a tombstone (the entity stays in the graph so the maintainer
does not re-propose it), and where `reject` (review axis: the extraction was an
error) must not be collapsed into `refute` / `abandon` (status axis: the claim is
in the graph and judged false or dead).

### 3.4 Review

Owned by `spec/architecture/REVIEW.md`. The invariant is one rule:

> The maintainer only ever writes `review: proposed`. The transition to
> `accepted` is exclusively human.

No confidence threshold, entity-kind exception, timeout, or machine path reaches
`accepted`. A proposal becomes accepted only when a human says so in the
conversation, via prose acceptance or an authority verb. This re-separates
proposing from accepting, which the cheapest ingestion mode — one LLM maintaining
its own instance — otherwise fuses into a single step.

- **Confidence triages attention; it never accepts.** Every proposed atom carries
  `provenance.confidence` (0..1, self-reported). Its only role is to order the
  human's attention: at review time the diff is sorted lowest-confidence-first.
  Sorting by a noisy self-reported signal only mis-orders the queue if the signal
  is wrong; the human still sees every item. Confidence is therefore mandatory on
  every proposed atom, and a missing value defaults to the most-attention bucket.
- **Batched at the checkpoint.** Review runs at the `persist` checkpoint, not
  per-atom: one checkpoint, one diff, sorted by confidence, dispositioned
  together. The human's review stays coarse (a session at once) while the
  maintainer's proposing stays fine (per turn).
- **Review does not block persist.** Un-blessed proposals persist as `proposed`.
  The durable instance is therefore an honest mix of `accepted` and `proposed`
  state. The cost is a cheap reader-side filter (a fresh conversation filters by
  `review` to know what is trusted); the rejected alternative — persisting
  `accepted` only and holding proposals in the working copy — trades that filter
  for silent loss of any proposal not reviewed before the session ends.

The review *surface* (the diff UI, the buttons, when the human is prompted) is
host policy with no designated home in the standard.

---

## 4. Operating loop

*When* a maintenance pass fires is host policy, not standard — and the standard
deliberately specifies no trigger timing, because idempotence makes a durable
write either a machine proposal or a human decision, and there is no separate
"triggers" concept for the standard to own (`spec/README.md`). The dogfood
instance's own policy lives in `.konspekt/OPERATING.md` and is not part of the
portable contract; a second platform that adopts an instance re-establishes its
own envelope.

The dogfood instance runs the **synchronous-review** posture:

- **load** at session start — read `.konspekt/instance/` before any design or
  writing work, so a session never runs from stale context.
- the maintainer **proposes** extractions into the working copy (`sync`); it
  never accepts on its own — everything it adds is `review: proposed`.
- a human-issued verb **carries its own acceptance** (`review: accepted`);
  acceptance happens in the conversation, before persist.
- **persist** writes the working copy back to the store (GitHub `main`).

**Triggers fire on two events, not on a cadence** (no clock, turn, or session
rhythm, because "session" has no portable meaning across LLM vendors and per-turn
firing is noise):

1. **Atom-ready, LLM-ventured.** The maintainer watches the thread and, when it
   judges that a durable atom has crystallized — a decision landed, a concept got
   named, a task changed status — ventures the extraction as a proposal. It never
   accepts its own ventures. The readiness bar biases toward holding until
   something settles, rather than narrating every exchange.
2. **Human manual command.** `sync` / `persist` / `sync_persist` and the
   authority verbs. This is the deterministic side: it accepts and it writes
   durably.

The two events map onto the propose/persist split: the LLM drives proposing on
judgment; the human drives accepting and persisting on command. The
propose-accept separation is the central invariant the whole architecture
preserves.

---

## 5. Adoption

### 5.1 Repository adopters

`setup/` is a zero-dependency Node scaffolder (`setup/init.mjs`, Node 18+) plus
seed templates (`setup/README.md`). From the root of a project repo:

```
node setup/init.mjs --name "My Project" --goal "what this project is for"
```

It writes a `.konspekt/` umbrella:

```
.konspekt/
├─ instance/            # the portable konspekt instance (ports across platforms)
│  ├─ project.md        # root: goal + summary
│  ├─ nodes/ concepts/ noteworthy/ artifacts/ waypoints/
│  ├─ edges/edges.md    # the single edge table (starts empty)
│  └─ sources/          # content-addressed provenance excerpts
├─ OPERATING.md         # this project's operating policy (the loop, triggers)
└─ NOTES.md             # human scratchpad (the `note:` convention)
```

It also adds a **konspekt stanza** to the repo's `AGENTS.md` (created if absent),
so any agent working in the repo reads the instance first and respects
propose-accept. The scaffolder is idempotent: it refuses to clobber an existing
`.konspekt/instance/` and skips the `AGENTS.md` stanza if already present.
`--push` commits and pushes for the adopter.

The split is deliberate: `instance/` is the portable unit that moves between
platforms; `OPERATING.md` and `NOTES.md` are local envelope, not part of the
contract a second tool conforms to.

### 5.2 Web and mobile adopters

When a project lives in a platform-native context slot (a Claude Project, a
custom GPT, a Gemini Gem) there is no working tree for an agent to discover. The
instance still lives in a repo reached over a GitHub connector; what changes is
how a conversation learns to tend it (`setup/WEBMOBILE_SEED.md`).

`WEBMOBILE_SEED.md` is a compact, paste-able instruction — the slot-equivalent of
the `AGENTS.md` stanza. It is a **pointer, not a payload**: it does not teach
konspekt; it tells the conversation to read konspekt from the repo (the spec, the
skills, the instance) and to operate the loop. Requirements: a GitHub connector
wired to the repo (read access to propose; read-write access for the full persist
loop), human-placed once per project, and an optional container for working
against a real tree.

### 5.3 Distribution

`distribution/` holds outward-facing release projections derived from the repo
root by `distribution/build/distribute.mjs` (`distribution/README.md`). Root is
the single source of truth; nothing under `distribution/` is hand-maintained. The
build bakes the publishable subset — the standard (`spec/`), the adopter kit
(`setup/`), and the konspekt maintainer skills — into a projection stamped with
the source commit. `latest/` tracks `main` and is rebuilt on demand (gitignored);
a version (`v1`, …) is a frozen projection cut at a tagged commit and committed,
so an adopter pointer resolves to a pinned spec that does not move. The dogfood
`.konspekt/` instance and the `visual/` explorer are excluded by design.

### 5.4 The dogfood instance and the visual explorer

`.konspekt/instance/` is konspekt expressed in konspekt's own format: the live
state of building konspekt, and the first instance the format is refined against
(`README.md`). `visual/` is a read-only context explorer that bakes a snapshot of
the instance and renders the `decomposes` DAG; its parsing doubles as a
conformance check against the serialization format.

---

## 6. Status and open decisions

- **Status.** Pre–first-external-adopter. Schema and serialization are at **v1**,
  refined by dogfooding the instance under `.konspekt/instance/`. Two local UI
  implementations now read that instance through the one shared reader
  (`lib/conformance.mjs`): `implementations/implementation-zero/` (a
  zero-dependency Node watcher with a floating read-only view, plus an accept
  action) and `implementations/intellij-plugin/` (an in-process JCEF tool window
  over the same view). Both are shells over the standard, not a second
  implementation of it, so the conformance target remains `spec/` plus the
  dogfooded instance.
- **License — Apache-2.0.** Chosen: a permissive license with an explicit patent
  grant, carried at the repo root as `LICENSE`, `LICENSE.spdx`, and `NOTICE` and
  declared in `README.md`.
- **Second implementer — open.** Who, and the smallest thing to put in front of
  them, remains the central milestone.

---

## Appendix: source map

| This document, section | Authoritative source |
|------------------------|----------------------|
| Motivation and stance | `README.md` |
| Data model | `spec/data-model/SPEC.md`, `spec/data-model/schema.ts` |
| Reconciliation and idempotence | `spec/architecture/RECONCILIATION.md` |
| Serialization | `spec/architecture/SERIALIZATION.md` |
| Transport and bindings | `spec/architecture/TRANSPORT.md` |
| Review | `spec/architecture/REVIEW.md` |
| Operating loop and triggers | `.konspekt/OPERATING.md`, `spec/README.md` |
| Adoption (setup) | `setup/README.md`, `setup/init.mjs` |
| Adoption (web/mobile) | `setup/WEBMOBILE_SEED.md` |
| Distribution | `distribution/README.md` |
| Agent contract | `AGENTS.md` |