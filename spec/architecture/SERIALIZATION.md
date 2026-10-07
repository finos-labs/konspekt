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
  changes/changed.md        # append-only changed-code log (persona layer)
  edges/edges.md            # single typed edge table
  transitions/transitions.md # append-only review/status transition log
  authority/principals.md   # declared principals (optional)
  authority/grants.md       # append-only accept grants (optional)
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

## Transitions

`transitions/transitions.md` is an append-only table, `| ref | field | from | to | timestamp | source | by |`. It contains one row for every assignment of a state field: one row when an entity or edge is first written, and one row each time its `review` or `status` value changes. Rows appear in the order they were written.

- `ref` is `type:id` for an entity (the form the edge table uses) or `edge:<id>` for an edge. Every `ref` MUST resolve to an entity file or an edge row.
- `field` is `review` or `status`. An edge has only `review`.
- `from` is the previous value. It is empty on the first row for a `ref` and `field` (the **birth row**). `to` is the value written.
- `timestamp` is ISO 8601 and records when the value was written. No other field records when a state value changed: `updatedAt` changes on every edit to the entity, and the edge table has no timestamp column.
- `source` is optional. When present, it is the `contentHash` of the `sources/` excerpt containing the exchange in which a human issued the acceptance or the authority verb. It is resolved and verified by the same probe as `provenance.sourceRef`.
- `by` is optional in an instance that declares no principals. When present, it is the `id` of the principal that wrote the value (`AUTHORITY.md`): the proposer on a row that writes `proposed`, the acceptor on a row that writes `accepted`. In an instance that declares principals, a row that writes `accepted` MUST have it. A row written before the column existed has six cells and is read as having no `by`.

Three rules relate the log to the graph:

1. **Birth row required.** Every entity and every edge has a `review` birth row. Every entity that has a `status` has a `status` birth row. An atom that is `accepted` in the write that creates it also has one.
2. **Continuity.** Within one `ref` and `field`, each row's `from` equals the previous row's `to`.
3. **Agreement.** The last row's `to` equals the value currently stored in the entity file or the edge row.

A row is written **push-based**, in the same write that sets the value, by the writer that sets it: the maintainer, or a client acting on a human verb. The entity file and the edge table are the authority for current state. The log records the history of that state, and rule 3 detects a difference between the two.

The log is part of the instance and is copied with it between stores. No reader resolves it against a version-control history. An instance without the file is v1-conformant and records no state history. When the file exists, the three rules are enforced. A log reconstructed from earlier history states in the file's prose header how its timestamps were derived.

## Authority

Two optional tables declare who may accept (`AUTHORITY.md`). An instance without `authority/principals.md` declares no principals and is v1-conformant.

`authority/principals.md` is a table, `| id | kind | roles | key |`, one row per principal.

- `id` is unique within the instance.
- `kind` is `human` or `agent`.
- `roles` is empty or `grantor`. Only a `human` row may have `grantor`, and at least one row MUST.
- `key` is reserved for a signing key and is empty until signed acceptance is specified.

`authority/grants.md` is an append-only table, `| scope | acceptor | action | grantor | timestamp | source |`, one row per grant or revocation, in the order written.

- `scope` is `*` for the entire graph, or `type:id` for one entity and its subgraph.
- `acceptor` and `grantor` are principal ids. `grantor` names a human principal with the `grantor` role.
- `action` is `grant` or `revoke`. A `revoke` row ends the grant for the same `scope` and `acceptor`.
- `timestamp` is ISO 8601 and records when the row was written. A grant is in force from that time.
- `source` is optional: the `contentHash` of the `sources/` excerpt containing the exchange in which the grantor issued the grant or the revocation.

## Commands

`commands/<contentHash>.md` holds the **verbatim text of one command** the maintainer executed, written push-based at execution time. Like source excerpts, these are *not* graph entities: plain text, no front-matter, no `id`. The filename **is** the command's git blob SHA, so a `command:<hash>` reference resolves to `commands/<hash>.md`, and the verify probe is `git hash-object` of that file equalling `<hash>` — the identical probe `sources/` uses. The directory is **append-only**: identical command text is one file, referenced once per run from the executed log.

Executions are recorded in `commands/executed.md`, an append-only table `| entity | command |` binding each run to the entity it was about (any entity type), one row per execution in **execution order** — row order is the timeline, so no per-row timestamp is stored. It is a provenance log, not the goal-graph edge table.

Only the command text is stored; output (stdout / stderr / exit) is deliberately excluded — the record answers *what was run*, and capturing results would balloon the channel past its purpose. This channel is contributed by the `engineer` persona layer (`../personas/engineer/SPEC.md`) and is present only in instances that activate it.

## Changed code

`changes/changed.md` is an append-only table `| entity | commit | file | timestamp |` binding each committed code change to the entity it was about (any entity type), one row per `(entity, commit, file)` in **commit order**. `timestamp` is ISO 8601 and records when the row was written. It is the evidence that the entity was accepted before the work was bound to it (`REVIEW.md` § Acceptance before work). A row written before the column existed has three cells and is exempt from that check. Unlike commands, the change itself is **not** stored here: it already lives in git, recoverable by `commit`, so only the legible projection (which files) and the pointer (which commit) are kept.

`commit` is an **opaque revision token**: the conformance checker validates its shape and non-emptiness only, and no reader resolves it against a VCS, so the format stays VCS-neutral. Rows are written **push-based at commit time** (the maintainer already holds the SHA and file list from the commit just made), so a row trails its commit by one; deriving the log by walking history would make generation git-specific and is not done. Bookkeeping commits — those touching only `.konspekt/instance/**` or this log — are excluded, and commits with no `<entity-id>:` subject prefix are dropped. Like the command channel, this is contributed by the `engineer` persona layer and present only in instances that activate it.

## Versioning

The serialization version is **v1**. Breaking changes to layout or field encoding bump it to v2; additive, backward-compatible changes do not.
