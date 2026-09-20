# konspekt serialization — v1

How a konspekt instance is laid out on disk. **Version: v1** (matched to `../data-model/schema.ts`).

This is the locked, lowest-common-denominator on-disk form: human-readable files that survive a copy-paste between platforms and diff cleanly in git.

## Layout

```
<instance>/
  project.md
  nodes/<type>/<id>.md      # one directory per NodeType
  concepts/<id>.md
  noteworthy/<id>.md
  artifacts/<id>.md
  waypoints/<id>.md
  sources/<contentHash>.md  # content-addressed provenance excerpts (not entities)
  commands/<contentHash>.md # content-addressed executed-command provenance (persona layer)
  edges/edges.md            # single typed edge table
```

## File format

Each entity is one file: a fenced `yaml` front-matter block holding the structured fields, followed by a Markdown body holding the entity's primary prose field.

| entity     | body holds      |
|------------|-----------------|
| Project    | `summary.text`  |
| GraphNode  | `summary.text`  |
| Concept    | `definition`    |
| Noteworthy | `text`          |
| Waypoint   | `description`   |
| Artifact   | optional note   |

Rules:

- `id` is kebab-case, globally unique, and equals the filename without `.md`.
- `Summary` serializes as `summary: { origin, pinned, updatedAt }`; its `text` lives in the body (no duplication).
- `Provenance` serializes as a nested map (`sourceRef`, `contentHash`, `timestamp`, `confidence?`, `conversationId?`). `sourceRef` + `contentHash` are the content-addressed source pointer; `conversationId` is optional grouping metadata. (`messageId` was retired — see `../data-model/schema.ts`.)
- An entity may carry an optional `subtype` — a persona-layer discriminator whose values are defined by the active layer (see `../personas/`), not by core.
- `project.md` may declare `personas: [<layer>, …]` to activate persona layers (see `../personas/`); absent means core-only, and every existing instance stays conformant with no migration.
- A file may declare a file-level `provenance` / `review` default when every entry shares it (used by the edge table).

## Edges

`edges/edges.md` is a single table — `id | kind | from | to | weight | review` — where `from` / `to` are `type:id` entity refs, or `channel:contentHash` **provenance refs** for a channel a persona layer defines (e.g. `command:<hash>`, resolved like `sources/` and never an entity). `provenance` is declared once at file level, as is the default `review`. The `review` column is a per-row **override**: empty means inherit the file-level default, and a value (e.g. `proposed`) applies to that edge alone — needed because an edge to a proposed entity must not inherit an `accepted` default. Every edge carries `review` in the model (`Edge extends Base`); the column only makes the per-row value expressible, so it is additive and remains v1. Per-edge files are a valid v1 variant if the table grows unwieldy.

## Sources

`sources/<contentHash>.md` holds the **source excerpts** an entity's provenance points at — the addressable text an extraction was drawn from, written push-based at extraction time. These are *not* graph entities: plain Markdown, no front-matter, no `id`. The filename **is** the excerpt's git blob SHA, so `provenance.sourceRef` resolves to `sources/<sourceRef>.md`, and the verify probe is `git hash-object` of that file equalling the stored `contentHash` (`RECONCILIATION.md`). The directory is **append-only**: editing an excerpt yields a new hash and a new file, never an in-place rewrite.

**An excerpt is verbatim, and covers every participating turn.** Capture the source text as it was written — human prompts *and* assistant responses — copied, never paraphrased. Curation is permitted only as **selection**: choosing which spans to include and eliding the rest (e.g. with `...`). Rewriting a span — summarizing, condensing, "synthesizing" — is **prohibited**, because it reintroduces interpretation at the one layer whose job is to be the *near-deterministic* anchor: copied text reproduces byte-for-byte and so hashes stably, while a paraphrase does not. A summarized excerpt is an **atom in disguise** — it cannot serve as the stable source the atoms above it are reconciled against, and it silently breaks the guarantee that the stored text *is* what the extraction was drawn from. The specific failure to guard against is **asymmetry**: capturing the human verbatim while compressing the assistant. Both sides are source.

Entities predating the mechanism may carry provenance without `sourceRef` / `contentHash`; their backfill is a separate, human-assisted pass.

## Commands

`commands/<contentHash>.md` holds the **verbatim text of one command** the maintainer executed, written push-based at execution time. Like source excerpts, these are *not* graph entities: plain text, no front-matter, no `id`. The filename **is** the command's git blob SHA, so a `command:<hash>` reference resolves to `commands/<hash>.md`, and the verify probe is `git hash-object` of that file equalling `<hash>` — the identical probe `sources/` uses. The directory is **append-only**: identical command text is one file, referenced once per run from the executed log.

Executions are recorded in `commands/executed.md`, an append-only table `| entity | command |` binding each run to the entity it was about (any entity type), one row per execution in **execution order** — row order is the timeline, so no per-row timestamp is stored. It is a provenance log, not the goal-graph edge table.

Only the command text is stored; output (stdout / stderr / exit) is deliberately excluded — the record answers *what was run*, and capturing results would balloon the channel past its purpose. This channel is contributed by the `engineer` persona layer (`../personas/engineer/SPEC.md`) and is present only in instances that activate it.

## Versioning

The serialization version is **v1**. Breaking changes to layout or field encoding bump it to v2; additive, backward-compatible changes do not.
