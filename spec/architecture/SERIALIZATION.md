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
  sources/sha-256/<hex>.md  # content-addressed provenance excerpts (not entities)
  sources/<sha1>.md         # legacy git-blob-SHA-1 excerpts, kept after migration
  sources/deprecated.md     # legacy-to-current reference map (after migration)
  commands/sha-256/<hex>.md # content-addressed executed-command provenance (persona layer)
  commands/<sha1>.md        # legacy command files, kept after migration
  commands/deprecated.md    # legacy-to-current reference map (after migration)
  commands/executed.md      # append-only executed-command log (persona layer)
  changes/changed.md        # append-only changed-code log (persona layer)
  edges/edges.md            # single typed edge table
  transitions/transitions.md # append-only review/status transition log
  checkpoints/checkpoints.md # append-only checkpoint log (optional)
  authority/principals.md   # declared principals (optional)
  authority/grants.md       # append-only accept grants (optional)
```

## Content references

Stored content — a source excerpt, an executed command — is addressed by an
RFC 6920 ("Naming Things with Hashes") reference over SHA-256:

```
ni:///sha-256;<base64url>
```

- The digest is SHA-256 over the **raw bytes** of the stored file. No header is
  prepended; in particular, the value is not git's `blob <length>\0` object hash,
  and it does not equal git's own SHA-256 blob id for the same file.
- `<base64url>` is the unpadded base64url encoding (RFC 4648 § 5) of the 32-byte
  digest: exactly 43 characters from `A–Z a–z 0–9 - _`. A padded,
  standard-base64 or otherwise non-canonical encoding is not a valid reference.
- The authority part is empty (`ni:///`), so a reference names no host and two
  instances agree on the identity of the same bytes.
- A stored file is named by the **hex** form of the same digest: 64 lowercase
  hex characters, under a subdirectory named for the algorithm, e.g.
  `sources/sha-256/<hex>.md`. Hex matches `sha256sum` output and never begins
  with `-`. Converting between the two forms is a change of encoding:
  hex-decode to 32 bytes and base64url-encode, or the reverse.
- The **verify probe** for a reference is: the file at `<dir>/sha-256/<hex>.md`
  exists, and SHA-256 over its raw bytes equals the digest. Line endings are
  bytes; an instance that pins LF in its working tree keeps that pin.
- A persona-layer channel reference prefixes the channel name:
  `command:ni:///sha-256;<base64url>`. The channel is everything before the
  first colon; the remainder is a complete RFC 6920 reference.

How a reference is turned into a location in a particular store — a URL, a
document key — is declared once per instance in `project.md` (§ Store and
locators) and never written into an atom.

**Legacy form.** An instance written before this addressing, or not yet
migrated, references content by its 40-hex git blob SHA-1, naming
`<dir>/<sha1>.md`; its verify probe is `git hash-object` of that file. A reader
MUST accept both forms, so one instance may mix migrated and unmigrated atoms
during a migration (§ Migration).

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
- `Provenance` serializes as a nested map (`sourceRef`, `timestamp`, `confidence?`, `conversationId?`, `locators?`, `deprecated?`). `sourceRef` is the `ni:` content reference of the source excerpt (§ Content references); `contentHash` is derived from it by parsing and is **not stored**. `conversationId` is optional grouping metadata. `locators` and `deprecated` are defined in § Sources and § Migration. In the legacy form `sourceRef` and `contentHash` are both stored and both hold the git blob SHA. (`messageId` was retired — see `../data-model/schema.ts`.)
- An entity may carry an optional `subtype` — a persona-layer discriminator whose values are defined by the active layer (see `../personas/`), not by core.
- `project.md` may declare `personas: [<layer>, …]` to activate persona layers (see `../personas/`); absent means core-only, and every existing instance stays conformant with no migration.
- `project.md` may declare a `store` block and a `locators` block (§ Store and locators).
- A file may declare a file-level `provenance` / `review` default when every entry shares it (used by the edge table).

## Edges

`edges/edges.md` is a single table — `id | kind | from | to | weight | review` — where `from` / `to` are `type:id` entity refs, or `channel:<reference>` **provenance refs** for a channel a persona layer defines (e.g. `command:ni:///sha-256;<base64url>`, resolved like `sources/` and never an entity; § Content references). `provenance` is declared once at file level, as is the default `review`. The `review` column is a per-row **override**: empty means inherit the file-level default, and a value (e.g. `proposed`) applies to that edge alone — needed because an edge to a proposed entity must not inherit an `accepted` default. Every edge carries `review` in the model (`Edge extends Base`); the column only makes the per-row value expressible, so it is additive and remains v1. Per-edge files are a valid v1 variant if the table grows unwieldy.

## Sources

`sources/sha-256/<hex>.md` holds the **source excerpts** an entity's provenance points at — the addressable text an extraction was drawn from, written push-based at extraction time. These are *not* graph entities: plain Markdown, no front-matter, no `id`. The filename **is** the hex SHA-256 of the excerpt's bytes, so `provenance.sourceRef` (`ni:///sha-256;<base64url>`) resolves to `sources/sha-256/<hex>.md`, and the verify probe is SHA-256 of that file equalling the reference's digest (§ Content references, `RECONCILIATION.md`). The directory is **append-only**: editing an excerpt yields a new hash and a new file, never an in-place rewrite.

**Origin locators are optional.** Provenance may carry `locators`, a list of
where the excerpt was taken from. Each item has `uri`, `kind`
(`git-permalink`, `conversation`, `chat` or `web`) and `retrievedAt` (ISO
8601):

```yaml
provenance:
  sourceRef: ni:///sha-256;<base64url>
  timestamp: 2026-11-14T12:00:00Z
  locators:
    - uri: https://github.com/<owner>/<repo>/blob/<commit>/docs/x.md
      kind: git-permalink
      retrievedAt: 2026-11-14T12:00:00Z
```

A locator is an attribute of the source, never part of its identity: adding or
removing one does not change `sourceRef`, and one excerpt may have several.
Each locator's host MUST appear in `project.md` `locators.allow`; a validator
reports a locator outside it, and reports an unreachable locator as a warning,
never an error, because the excerpt is already stored.

**An excerpt is verbatim, and covers every participating turn.** Capture the source text as it was written — human prompts *and* assistant responses — copied, never paraphrased. Curation is permitted only as **selection**: choosing which spans to include and eliding the rest (e.g. with `...`). Rewriting a span — summarizing, condensing, "synthesizing" — is **prohibited**, because it reintroduces interpretation at the one layer whose job is to be the *near-deterministic* anchor: copied text reproduces byte-for-byte and so hashes stably, while a paraphrase does not. A summarized excerpt is an **atom in disguise** — it cannot serve as the stable source the atoms above it are reconciled against, and it silently breaks the guarantee that the stored text *is* what the extraction was drawn from. The specific failure to guard against is **asymmetry**: capturing the human verbatim while compressing the assistant. Both sides are source.

Entities predating the mechanism may carry provenance without `sourceRef` / `contentHash`; their backfill is a separate, human-assisted pass.

## Transitions

`transitions/transitions.md` is an append-only table, `| ref | field | from | to | timestamp | source | by |`. It contains one row for every assignment of a state field: one row when an entity or edge is first written, and one row each time its `review` or `status` value changes. Rows appear in the order they were written.

- `ref` is `type:id` for an entity (the form the edge table uses) or `edge:<id>` for an edge. Every `ref` MUST resolve to an entity file or an edge row.
- `field` is `review` or `status`. An edge has only `review`.
- `from` is the previous value. It is empty on the first row for a `ref` and `field` (the **birth row**). `to` is the value written.
- `timestamp` is ISO 8601 and records when the value was written. No other field records when a state value changed: `updatedAt` changes on every edit to the entity, and the edge table has no timestamp column.
- `source` is optional. When present, it is the content reference (§ Content references) of the `sources/` excerpt containing the exchange in which a human issued the acceptance or the authority verb. It is resolved and verified by the same probe as `provenance.sourceRef`.
- `by` is optional in an instance that declares no principals. When present, it is the `id` of the principal that wrote the value (`AUTHORITY.md`): the proposer on a row that writes `proposed`, the acceptor on a row that writes `accepted`. In an instance that declares principals, a row that writes `accepted` MUST have it. A row written before the column existed has six cells and is read as having no `by`.

Three rules relate the log to the graph:

1. **Birth row required.** Every entity and every edge has a `review` birth row. Every entity that has a `status` has a `status` birth row. An atom that is `accepted` in the write that creates it also has one.
2. **Continuity.** Within one `ref` and `field`, each row's `from` equals the previous row's `to`.
3. **Agreement.** The last row's `to` equals the value currently stored in the entity file or the edge row.

A row is written **push-based**, in the same write that sets the value, by the writer that sets it: the maintainer, or a client acting on a human verb. The entity file and the edge table are the authority for current state. The log records the history of that state, and rule 3 detects a difference between the two.

The log is part of the instance and is copied with it between stores. No reader resolves it against a version-control history. An instance without the file is v1-conformant and records no state history. When the file exists, the three rules are enforced. A log reconstructed from earlier history states in the file's prose header how its timestamps were derived.

## Checkpoints

`checkpoints/checkpoints.md` is an append-only table, `| timestamp | entity | source | venue | model | by |`. It contains one row each time a human issues `checkpoint` (`TRANSPORT.md` § Checkpoint and resume). Rows appear in the order they were written. The last row is the one `resume` reads.

- `timestamp` is ISO 8601 and records when the checkpoint was written. Timestamps do not decrease from one row to the next.
- `entity` is the `id` of the conversation's active entity when the checkpoint was issued (`BINDING.md`). It MUST resolve to an entity file. The entity need not be accepted: a checkpoint records where a conversation stood, which is not work bound to the entity.
- `source` is the content reference (§ Content references) of the `sources/` excerpt that holds, verbatim, the human's `checkpoint` command and the conversation content it saves: each binding switch made in the conversation, each proposal discussed and not yet persisted, and the open-items list as it was last presented. It is resolved and verified by the same probe as `provenance.sourceRef`. The excerpt is the record of these items. They are not written as atoms, because a paraphrased item would be an atom without the human acceptance an atom needs.
- `venue` names where the conversation ran, as free text: for example `claude.ai-web`, `claude-mobile`, `claude-code-cli`, `intellij`. It may be empty.
- `model` names the LLM the conversation ran on, as free text. It may be empty.
- `by` is optional in an instance that declares no principals. In an instance that declares principals, it MUST name a `human` principal: `checkpoint` is a human command.

The log is part of the instance and is copied with it between stores, which is what lets a different LLM or venue read it. An instance without the file is v1-conformant and has no checkpoints.

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
- `source` is optional: the content reference (§ Content references) of the `sources/` excerpt containing the exchange in which the grantor issued the grant or the revocation.

## Commands

`commands/sha-256/<hex>.md` holds the **verbatim text of one command** the maintainer executed, written push-based at execution time. Like source excerpts, these are *not* graph entities: plain text, no front-matter, no `id`. The filename **is** the hex SHA-256 of the file's bytes, so a `command:ni:///sha-256;<base64url>` reference resolves to `commands/sha-256/<hex>.md`, and the verify probe is the one `sources/` uses (§ Content references). The directory is **append-only**: identical command text is one file, referenced once per run from the executed log.

Executions are recorded in `commands/executed.md`, an append-only table `| entity | command |` binding each run to the entity it was about (any entity type), one row per execution in **execution order** — row order is the timeline, so no per-row timestamp is stored. `command` is the command file's content reference. It is a provenance log, not the goal-graph edge table.

Only the command text is stored; output (stdout / stderr / exit) is deliberately excluded — the record answers *what was run*, and capturing results would balloon the channel past its purpose. This channel is contributed by the `engineer` persona layer (`../personas/engineer/SPEC.md`) and is present only in instances that activate it.

## Changed code

`changes/changed.md` is an append-only table `| entity | commit | file | timestamp |` binding each committed code change to the entity it was about (any entity type), one row per `(entity, commit, file)` in **commit order**. `timestamp` is ISO 8601 and records when the row was written. It is the evidence that the entity was accepted before the work was bound to it (`REVIEW.md` § Acceptance before work). A row written before the column existed has three cells and is exempt from that check. Unlike commands, the change itself is **not** stored here: it already lives in git, recoverable by `commit`, so only the legible projection (which files) and the pointer (which commit) are kept.

`commit` is an **opaque revision token**: the conformance checker validates its shape and non-emptiness only, and no reader resolves it against a VCS, so the format stays VCS-neutral. Rows are written **push-based at commit time** (the maintainer already holds the SHA and file list from the commit just made), so a row trails its commit by one; deriving the log by walking history would make generation git-specific and is not done. Bookkeeping commits — those touching only `.konspekt/instance/**` or this log — are excluded, and commits with no `<entity-id>:` subject prefix are dropped. Like the command channel, this is contributed by the `engineer` persona layer and present only in instances that activate it.

## Store and locators

`project.md` declares how this instance's content is reached and which hosts a
locator may name:

```yaml
store:
  kind: git
  ref: main
  resolve:
    source:      https://github.com/<owner>/<repo>/blob/{ref}/<instance>/sources/sha-256/{hex}.md
    command:     https://github.com/<owner>/<repo>/blob/{ref}/<instance>/commands/sha-256/{hex}.md
    entity:      https://github.com/<owner>/<repo>/blob/{ref}/<instance>/{path}
    edges:       https://github.com/<owner>/<repo>/blob/{ref}/<instance>/edges/edges.md
    checkpoints: https://github.com/<owner>/<repo>/blob/{ref}/<instance>/checkpoints/checkpoints.md
locators:
  allow: [github.com]
```

- `store.kind` names the backend (`git`, or another binding).
- `store.resolve` has one template per kind of content. `{hex}` is the hex
  digest of a content reference, `{b64}` its base64url digest, `{path}` an
  entity's path in the layout above (so one template covers every entity type),
  `{id}` an entity id, and `{ref}` the value of `store.ref`. A non-git store names its own
  collections or tables in the templates.
- `locators.allow` lists the hosts a locator may name (§ Sources). An empty list
  permits no locators.

Both blocks are optional in v1; an instance without them is resolved by the
layout convention. The operations a store provides behind these templates are
specified in `STORAGE.md`.

## Migration

An instance in the legacy form (§ Content references) is migrated **in place**,
by adding and never removing:

- Each `<dir>/<sha1>.md` file in `sources/` and `commands/` is copied to
  `<dir>/sha-256/<hex>.md`. The SHA-1 file is kept, so the directories stay
  append-only.
- Each directory gains `deprecated.md`, an append-only table
  `| deprecated | current | migratedAt |` mapping each old SHA-1 to its `ni:`
  reference, with the time of migration.
- In each entity file, `sourceRef` takes the `ni:` reference, and the old
  `sourceRef` and `contentHash` move under `provenance.deprecated` with a
  `migratedAt` timestamp:

  ```yaml
  provenance:
    sourceRef: ni:///sha-256;APNFY7KHdLOOFaMj1MTEsYvBDHqC9Ab_SMP3qqqBTsw
    timestamp: 2026-09-12T14:30:00Z
    deprecated:
      migratedAt: 2026-11-14T19:36:00Z
      sourceRef: 1c521cd2996ebec25d03424a298bf146305e2c58
      contentHash: 1c521cd2996ebec25d03424a298bf146305e2c58
  ```

  `updatedAt` is unchanged, because the entity's meaning has not changed.
- Table cells that hold a reference — the `source` cells of transitions,
  checkpoints and grants, the executed log's `command` cells, and
  `command:` edge endpoints — take the new reference. The old value is
  recoverable from `deprecated.md`.

A migration is idempotent: running it on a migrated instance changes nothing.
The deprecated values are history and are not verified. Once an instance is
migrated, every new reference it receives is in the `ni:` form. An instance
counts as migrated when `sources/deprecated.md` or `commands/deprecated.md`
exists. A validator reports a git blob SHA-1 reference in a migrated instance,
outside `provenance.deprecated` and `deprecated.md`, as a warning, never an
error, because a reader still accepts the legacy form. The reference
implementation is `tools/migrate-ni.mjs`.

## Versioning

The serialization version is **v1**. Breaking changes to layout or field encoding bump it to v2; additive, backward-compatible changes do not. The `ni:` content references, the `sha-256/` subdirectories, `deprecated.md`, `locators` and the `store` block are additive: a reader that accepts both reference forms reads every v1 instance, migrated or not.
