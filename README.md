[![badge-labs](https://user-images.githubusercontent.com/327285/230928932-7c75f8ed-e57b-41db-9fb7-a292a13a1e58.svg)](https://community.finos.org/docs/governance/lifecycle-stages/labs)

# konspekt

An open standard — and reference implementation — for a portable, human-readable record of a project's evolving state across generative-AI conversations and platforms.

A *konspekt* (a Slavic/German academic term) is a structured, condensed rendering of a larger body of material: notes that preserve the skeleton of a source so you can grasp and carry its essentials without replaying the whole.

## Why

1. **Follow the thread.** Help people process gen-AI outputs and follow long conversations by externalizing project state — decisions, open questions, artifacts, provenance — instead of holding it all in their head.
2. **Port across platforms.** Provide a platform-neutral representation of a project so it can move between gen-AI tools without losing the connective tissue: instructions, accumulated context, conventions.

The two converge on one thing: a durable, structured, human-readable representation of project state that lives *outside* any single conversation.

## The standard

konspekt is two things, both small and both in `spec/data-model/`:

- **A model** — a typed knowledge graph of a project. A few node types (a typed `GraphNode`, plus `Concept`, `Noteworthy`, `Artifact`, `Waypoint`) and a *single* edge table whose `kind` carries every relationship (`decomposes`, `mentions`, `relates`, `links`, `produces`, `notes`, `marks`, `supersedes`). One rule keeps it honest: store each fact once and make every "inventory" a *query over edges*, never a stored list — the goal tree is just `edges where kind = decomposes`, a node's concepts just the ones it `mentions`. Decisions, facts, artifacts, and open questions are the vertices; how they relate is the edges. A knowledge graph, deliberately a boring one.
- **A verb set** — the small authority vocabulary a human issues over that graph: `pin`, `validate`, `refute`, `resolve`, `abandon`, `lift`. These are the override moments a reactive LLM maintainer must *not* decide on its own. They're conventions, not requirements: each reads as plain English over an entity reference, so a model that has never heard of konspekt can approximate the effect with no parser or special tokens, and skipping one degrades nothing structural.

Everything else is an **implementation constraint** — not new vocabulary, but what a conformant binding must do to keep that graph true and carry it between platforms: serialization, transport, reconciliation, and the content-addressed provenance scheme. The model *requires* that state be auditable and human-accepted — every entity carries provenance and a `proposed → accepted` review state — but *how* a binding makes provenance verifiable (this repo hashes the verbatim source text with git blob SHAs) is a constraint on the binding, not part of the vocabulary you read. These live in `spec/architecture/`.

## Not a memory layer

konspekt is easy to mistake for AI memory — Mem0, Zep, or the built-in memory of Claude Projects, ChatGPT, and Gemini Gems. It sits at a different layer, and that is the whole point.

Those systems are **machine-authored**: a model decides what is worth keeping, extracts a compressed version, and stores it to feed back to a model later. The reader is the agent. The artifact is a lossy summary you do not see and do not own — and the model can quietly drop, distort, or ignore it, a limitation the memory vendors themselves acknowledge.

konspekt inverts both terms — human-authored, human-read:

- **You curate; the model only proposes.** Nothing lands because an extractor judged it salient. A model may *propose*; only you *accept* (propose→accept). The guarantee is integrity, not completeness: what is in the record is there because you put it there.
- **Verbatim, with provenance.** Each note, decision, and fact is the real wording, linked back to the actual conversation text — not a paraphrase a model might have hallucinated.
- **A public format, not a product.** The data model is an open standard you can read, diff, and carry between platforms. No service to run, nothing to be locked into.

So the user is a **human working on a project**, not an agent needing recall. konspekt is the durable, readable record of the project; platform memory is, at best, a running summary of it.

The layers compose rather than collide: a konspekt instance is a clean, human-validated source you can feed *into* Mem0, Zep, or any RAG pipeline. It is upstream of memory systems, not a competitor to them.

## Stance

- **Open, and impact-primary.** The win is the industry handling project portability well, by whatever hand. A vendor adopting — or copying — this format is the flywheel working, not a competitor winning.
- **Legible over defensible.** Success is measured in *other people implementing against it*.
- **Boring on purpose.** Lowest-common-denominator, human-readable files that survive a copy-paste between any two platforms.

## Layout

- `spec/` — the standard, split into `data-model/` (the portable vocabulary: `SPEC.md`, `schema.ts`) and `architecture/` (how state is kept true and carried: `RECONCILIATION.md`, the **v1** `SERIALIZATION.md`, and `TRANSPORT.md`).
- `setup/` — the adopter kit: a zero-dependency Node scaffolder (`init.mjs`) plus seed templates that drop a `.konspekt/` umbrella into any project repo. See `setup/README.md`.
- `distribution/` — outward-facing release projections, **derived** from root by `build/distribute.mjs` (never hand-copied): the publishable subset (`spec/`, `setup/`, the konspekt skills) baked into a versioned, regenerable projection. The dogfood instance and `visual/` are excluded. Versions get cut once the spec settles.
- `.konspekt/` — the konspekt umbrella. Holds `instance/` (konspekt eating its own dog food: the live state of building konspekt, in konspekt's own format — the first guinea pig) plus this repo's operating envelope (`OPERATING.md`, `NOTES.md`).
- `visual/` — a read-only context explorer that bakes a snapshot of the instance and renders the `decomposes` DAG; parsing doubles as a conformance check.
- `tools/` — zero-dependency Node CLIs that project the instance graph (`roadmap.mjs`, the posters) and query it (`views.mjs`), each a pure function of the instance. See `tools/README.md`. Conformance itself runs from `lib/validate.mjs`.
- `docs/` — rendered visuals: the project overview and the generated posters under `docs/visuals/`.

## Adopt it

`setup/` scaffolds konspekt into your own repo. From your project root (Node 18+):

```
node setup/init.mjs --name "My Project" --goal "what the project is for"
```

That writes a `.konspekt/` umbrella — a seed instance (`project.md`, an empty edge table, the entity directories) plus an operating envelope (`OPERATING.md`, `NOTES.md`) — and adds a konspekt stanza to your `AGENTS.md` so any agent in the repo reads the instance first and respects propose-accept. Review it, then commit — or pass `--push` to commit and push for you. It's idempotent: it won't clobber an existing `.konspekt/instance/`. Full walkthrough in `setup/README.md`.

## Status

Pre–first-external-adopter. Schema and serialization are at **v1**. The format is being refined by dogfooding (see `.konspekt/instance/`); the next milestone is a second, independent implementer. A reference implementation is intended but deliberately not scaffolded yet — the conformance target today is `spec/` plus the dogfooded instance.

## Open decisions

- **Second implementer** — who, and the smallest thing to put in front of them. Deferred, but the central milestone.

## Get Involved

Join the Konspekt general mailing list by sending an email to konspekt-general+subscribe@lists.finos.org.

Join the [#konspekt](https://app.slack.com/client/T01E7QRQH97/C0BSX90T7UL) Slack Channel in the FINOS workspace. If you are not a member of the FINOS Slack workspace email help@finos.org to be added.

## Contributing

All contributions must follow the process and guideliness described in the [CONTRIBUTING.md](./CONTRIBUTING.md) file. 

## License

Copyright 2026 FINOS

Distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

SPDX-License-Identifier: [Apache-2.0](https://spdx.org/licenses/Apache-2.0)
