# konspekt — data model (spec)

The konspekt standard: the entity set, the single edge table, and the derived views a project's state is expressed in. This supersedes the v0.1.0 draft and is reconciled from the canonical data-model design.

> Guiding principle: store each fact **once**, and make every "inventory" a *query over edges* rather than a stored list. Duplication is the enemy; drift follows duplication.

## Principles

1. **Single source of truth.** Concepts, noteworthy items, and artifacts are first-class entities, stored once. "This node's concepts" and "the project's concepts" are *queries over edges*, not stored lists — dedup is structural, the project aggregate is free, cross-linking is automatic.
2. **One graph, not two.** Goal decomposition (hierarchical) and cross-links (associative) share one `Edge` table, distinguished by `kind`. The goal tree is `edges where kind = "decomposes"`; everything else is a filtered view.
3. **Auditable by construction.** Every entity carries `provenance` — a *content-addressed* pointer to its source text (`sourceRef` + a construction-time `contentHash`), a source `timestamp`, and optional confidence — and a `review` state (`proposed → accepted / rejected`), because an LLM maintainer *proposes* graph updates that a human accepts. Provenance anchors on the **text**, not on a host-supplied conversation/message id the maintainer cannot read; an entity verifies iff re-hashing its `sourceRef` reproduces its `contentHash`.
4. **Summaries compose, humans win.** Each node owns its `summary`; the project summary composes the node summaries; a `pinned`, human-origin summary is never overwritten by the maintainer.

## Entities

- **Project** — root: `goal`, a composed `summary`, timestamps. No stored aggregates; they're views.
- **GraphNode** — a unit of work, typed `goal | investigation | experiment | topic | task | note`. Carries its own `summary` and a `status` (`open | active | resolved | abandoned`). Hierarchy lives in edges, so a node can sit under more than one parent.
- **Concept** — `label`, `definition`, `aliases` (surface forms for dedup / merge). Referenced via edges, never copied.
- **Noteworthy** — `kind` (`fact | statement | decision | assumption | constraint`) and `text`, with a `status` that matters for some kinds (an assumption is unvalidated / validated / refuted; a constraint is active / lifted).
- **Artifact** — `name`, `kind`, `location`, `version`.
- **Waypoint** — a timestamped *event*, `kind` (`decision | milestone | pivot`), that points at the node/branch it sits on (edge kind `marks`). Waypoints are the **timeline** axis and are deliberately *not* part of the goal tree.

## The decision rule

One underlying decision, up to three representations, with a single rule for each — not three parallel definitions:

- Always recorded once as a **Noteworthy** item (`kind: decision`) — the atomic, always-true record.
- Additionally a **Waypoint** *if* it's an inflection point worth seeing on the timeline.
- Additionally a **Node** *only if* it opens a branch of work to track.

## Edges

One typed table; `from` / `to` are `EntityRef`s — or, for a persona layer that defines one, a content-addressed provenance ref such as `command:<hash>` (see `../personas/`); `weight` is meaningful only for `relates` and `links`.

- `decomposes` — node → node (goal tree)
- `mentions` — node → concept
- `relates` — concept → concept (untyped association; optional `weight` for strength)
- `links` — node → node (generic "linked to"; untyped association, symmetric in meaning but stored directed; optional `weight` for strength). The node-level counterpart to concept `relates`. Domain-flavored typed links (`blocks`, `depends-on`, …) are left to persona layers, not core.
- `produces` — node → artifact
- `notes` — node → noteworthy
- `marks` — waypoint → node (the branch the waypoint sits on / opened)
- `supersedes` — entity → entity (a new entity replaces an old one; the superseded entity is the `to`). A **proposed** edge is a flagged contradiction awaiting review; **accepting** it confirms the replacement. Both entities stay in the graph — append over rewrite — so the reversal stays legible.

## Derived views (never stored)

- project concept inventory = concepts with any inbound `mentions` edge
- node concept inventory = concepts with a `mentions` edge from that node
- goal tree = `edges where kind = "decomposes"`
- timeline = waypoints ordered by `timestamp`
- open assumptions = noteworthy where `kind = "assumption"` and `status = "unvalidated"`
- current items = entities with no inbound `supersedes` edge (e.g. the live decision among superseded ones)

## Human vocabulary (v1)

A small set of **distinct verbs** a human issues to assert judgments the reactive maintainer shouldn't make on its own. Every verb is a *convention, not a requirement*: it reads as plain English over an entity reference, so a vanilla LLM on a platform that has never heard of konspekt can approximate the right effect with no parser, runtime, or special tokens. The litmus test — if skipping a verb *breaks* anything, it has stopped being a convention and become a chokepoint.

A human-issued verb **carries its own acceptance**: the resulting change lands `review: accepted`, not `proposed`. The command *is* the acceptance. (The reactive maintainer, by contrast, only ever proposes.)

These are **authority verbs** — the override/guarantee moments, and precisely the status transitions reconciliation detects poorly from prose:

| verb | reference | effect |
|------|-----------|--------|
| `pin <ref>` | node / project / any summarized entity | `summary.pinned = true`; the maintainer never regenerates that summary |
| `validate <ref>` | noteworthy (assumption) | `status → validated` |
| `refute <ref>` | noteworthy (assumption) | `status → refuted` |
| `resolve <ref>` | node | `status → resolved` |
| `abandon <ref>` | node | `status → abandoned` |
| `lift <ref>` | noteworthy (constraint) | `status → lifted` |

`<ref>` is an entity `id` or a natural-language description the maintainer resolves to one. An ambiguous reference is surfaced for disambiguation, never guessed.

**Design intent.** These distinct verbs are *surface sugar* over two generic constructs — a pin operation and a generic `mark <ref> <state>` status transition. They are kept distinct because five short, self-documenting verbs are easier to remember and reach for than one verb plus a state vocabulary to look up. The generic form is what the sugar desugars to, not a separate feature; new authority verbs are added only when they name a genuinely distinct human call.

**Deliberately excluded.** *Capture* verbs (force-create a `task`, `concept`, `constraint`, … directly as `accepted`) are **deferred**. The reactive layer already catches most net-new entities, so capture is convenience, not authority, and shipping it on spec is the coverage-creep that turns a vocabulary into a language you must memorize — migrating the recall problem from the LLM onto the human. Promote it only if reactive capture proves leaky in practice. Note that `note:` is reserved for a separate human scratchpad (NOTES.md) and is **not** a konspekt `Noteworthy` capture verb; konspekt capture, if ever added, uses the `kind` directly (`decision:`, `fact:`).

## Note on concept relationships

Concept-to-concept edges exist but are **untyped** (kind `relates`), carrying an optional numeric `weight` instead of a relationship ontology — deliberately avoiding a philosophical rabbit hole. Node-to-node associations get the same treatment under kind `links`: a generic "linked to" with an optional `weight`, deliberately untyped. Typing the node links (`blocks`, `depends-on`, `duplicates`, …) is a persona-layer concern, so core stays domain-agnostic. `supersedes` is the one *truth-changing* relation promoted to its own kind; evidential relations ("supports") are deliberately **not** typed, for the same reason.


## Extension: persona layers

The core above is **persona-agnostic**: it names no working role and its enums (`NodeType`, `WaypointKind`, `EdgeKind`, …) are closed. A **persona layer** extends the model through three generic hooks, so a layer adds vocabulary without the core carrying any layer-specific value:

- **`subtype`** — an optional discriminator on any entity. The core recognizes the field; a layer defines its values (the engineer layer's `asr` on a Concept, `adr` on a `decision` Waypoint).
- **Provenance-ref edge endpoints** — an edge `from`/`to` may address a content-addressed provenance file (`<channel>:<contentHash>`) instead of an entity, resolved the way `sources/` is and never entified. A layer defines the channel (e.g. `command`).
- **`personas` activation** — a `Project` lists the layers an instance turns on (`personas: [engineer]`). Absent the list, the core is unchanged and every existing instance stays conformant.

Layer vocabularies live in `../personas/<layer>/`, declared in a registry the conformance checker merges only when the instance activates the layer. The first is `engineer/`, adding ASR, ADR, executed-command provenance, and the `drives` and `executed` edge kinds.
