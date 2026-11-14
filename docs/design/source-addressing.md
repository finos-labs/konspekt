# Source addressing: `ni:` references and store resolution

Status: design agreed; parser fix done; test migration next.
Graph: `investigation-source-uris` (accepted) records the decisions;
`task-ni-references` (accepted) carries the implementation;
`task-ni-impact-analysis` (proposed) verifies the change list below.
Conversation: `source-uris`, 2026-11-12 to 2026-11-14.

## Context

The starting proposal was to store a URL for each source next to
its content hash, so a reader can get back to where an excerpt came from. That
idea split into two separate questions.

The first is **origin**: where was the excerpt taken from? A chat, a file at a
given commit, a web page. Knowing this is useful, but nothing breaks without
it, because konspekt already stores the excerpt verbatim.

The second is **store resolution**: given a hash, where is the stored excerpt?
Today the answer is implicit in the git layout. A reader sees a hash, knows by
convention to look in `sources/<hash>.md`, and opens that file on GitHub. With
a MongoDB or Postgres backend the hash would be a document key, and how to
reach it would again be knowledge that lives in people's heads. A hash nobody
can resolve is useless, so this part cannot be optional.

A third problem appeared while choosing a reference format. Every hash in the
instance is a git blob SHA-1. That ties identity to git's object format and to
an algorithm that git itself is moving away from. The agreed direction is that
konspekt must not depend on either.

## Decisions

### Origin locators are optional

An entity's provenance may carry a list of locators. Each has a `uri`, a
`kind` (`git-permalink`, `conversation`, `chat` or `web`) and a `retrievedAt`
timestamp. Locators are attributes of a source and never part of its identity:
adding or removing one does not change the hash, and the same excerpt may have
several. Because internal URLs can leak into a repository that may be public,
`project.md` declares `locators.allow`, a list of permitted hosts, and
conformance flags any locator outside it. When `validate` cannot reach a
locator it reports a warning. Link rot is expected, and the excerpt itself is
already stored.

### Store resolution is declared once per instance

Atoms refer to stored content by hash only. They never contain store URLs, so
moving an instance from git to MongoDB does not rewrite every atom, and no
hostnames or credentials enter the graph. Instead, `project.md` declares the
store and a `resolve` rule with one template per kind of content: sources,
commands, entities, edges and checkpoints. For git, the entity template's
`{path}` follows the layout already defined in SERIALIZATION.md, so a single
template covers every entity type. A MongoDB or Postgres rule names
collections or tables instead. The storage interface, which the spec does not
yet describe, gets its own file with the operations every backend must
provide: `getSource`, `getEntity`, `getEdges` and `getLastCheckpoint`.

### References use RFC 6920 `ni:` URIs over SHA-256

A reference has the form `ni:///sha-256;<base64url>`, as defined in RFC 6920,
"Naming Things with Hashes". The algorithm is named inside the reference, so a
future change of algorithm adds a new form without breaking the old one. The
authority part is left empty, which keeps hosts out of the graph while two
instances still agree on identity. The hash is computed over the raw bytes of
the excerpt, without git's `blob <length>\0` header. That makes the value
independent of git, with one consequence worth stating plainly: an `ni:`
SHA-256 does not equal git's own SHA-256 blob id for the same file.

`contentHash` is no longer stored as a separate field. It is derived from the
reference by parsing, which works the same way in every backend. Channel
references defined by persona layers keep their prefix, so an executed command
is referenced as `command:ni:///sha-256;<digest>`. The channel is everything
before the first colon, and the remainder is a complete RFC 6920 URI that any
tool can resolve on its own.

Rejected alternative: SWHID (ISO/IEC 18670), considered for interoperability.
SWHID v1 is defined over SHA-1 only, v2 with a stronger hash is still
under discussion, and no existing konspekt reference uses SWHID, so there was
nothing to preserve.

### File names use hex

Stored files live at `sources/sha-256/<hex>.md` and `commands/sha-256/<hex>.md`.
Hex matches what `sha256sum` prints, so anyone can check a file against its
name with standard tools. It also avoids file names beginning with `-`, which
base64url digests can produce and which many command-line tools read as a
flag. The algorithm subfolder leaves room for a later algorithm. The spec
defines the conversion between the hex file name and the base64url reference,
which is a plain change of encoding.

### The read path should serve `/.well-known/ni/`

RFC 6920 maps a reference to `https://<host>/.well-known/ni/sha-256/<digest>`.
A konspekt read server should serve that path, so tools that know the RFC but
nothing about konspekt can fetch content. It is a recommendation, not a
conformance requirement, because a git-only instance has no server and GitHub
cannot serve `.well-known` paths from a repository. For such an instance the
`project.md` rule is the way to resolve.

### Migration happens in place

Existing data is upgraded by writing new lines next to old ones. In an entity
file, the new `ni:` reference goes into `sourceRef`, and the old `sourceRef`
and `contentHash` move under `provenance.deprecated` together with a
`migratedAt` timestamp. The entity's `updatedAt` stays as it was, because its
meaning has not changed. Tables cannot nest a block, so their cells take the
new reference, and each content-addressed directory gets a `deprecated.md`
table, `| deprecated | current | migratedAt |`, mapping old hashes to new
references. Old SHA-1 files are kept, so the directories remain append-only.
Nothing is removed, so the change is additive and the instance stays at
serialization v1. A migration script does all of this idempotently and runs
conformance at the end.

Once a repository is migrated, conformance checks only the new form. The
deprecated values are history and are not verified.

The adopter repositories, cdm-collateral and code_tracer, are migrated later.

## Worked example

The excerpt behind `waypoints/wp-links-edge-kind.md` is today stored as
`sources/1c521cd2996ebec25d03424a298bf146305e2c58.md`. Its SHA-256 over the raw
bytes is `00f34563b28774b38e15a323d4c4c4b18bc10c7a82f406ff48c3f7aaaa814ecc`.
After migration:

```yaml
provenance:
  sourceRef: ni:///sha-256;APNFY7KHdLOOFaMj1MTEsYvBDHqC9Ab_SMP3qqqBTsw
  timestamp: 2026-09-12T14:30:00Z
  confidence: 0.9
  deprecated:
    migratedAt: <time of migration>
    sourceRef: 1c521cd2996ebec25d03424a298bf146305e2c58
    contentHash: 1c521cd2996ebec25d03424a298bf146305e2c58
```

The same bytes are also stored at
`sources/sha-256/00f34563b28774b38e15a323d4c4c4b18bc10c7a82f406ff48c3f7aaaa814ecc.md`,
the old file stays in place, and `sources/deprecated.md` gains the row
`| 1c521cd2996ebec25d03424a298bf146305e2c58 | ni:///sha-256;APNFY7KHdLOOFaMj1MTEsYvBDHqC9Ab_SMP3qqqBTsw | <time of migration> |`.

The `project.md` additions for this repository look like this:

```yaml
store:
  kind: git
  ref: main
  resolve:
    source:  https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/sources/sha-256/{hex}.md
    command: https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/commands/sha-256/{hex}.md
    entity:  https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/{path}
    edges:   https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/edges/edges.md
    checkpoints: https://github.com/finos-labs/konspekt/blob/{ref}/.konspekt/instance/checkpoints/checkpoints.md
locators:
  allow: [github.com, claude.ai]
```

## Success

No provenance on existing data is lost: every old reference is kept under
`deprecated:` or in a `deprecated.md` map, and every old SHA-1 file is kept.
Existing tooling (conformance, validate, views, roadmap, binding audit, the
fleet, the UI clients) runs on a migrated instance without breaking.

## Questions raised by the impact sweep

The sweep behind the change list turned up four points the design discussion
did not cover. Their current state:

1. **Parser depth (fixed).** The YAML subset parser in `lib/conformance.mjs`
   supported one level of nested maps, so `provenance.deprecated.sourceRef`
   overwrote `provenance.sourceRef` and `locators` items were dropped without
   an error. The parser now reads maps at any depth and block sequences of
   maps, and `loadInstance` reports any front-matter line it cannot place as a
   `frontmatter-unparsed` error. The IntelliJ plugin's `InstanceReader.kt`
   had the same overwrite and now keys each scalar by its full dotted path.
   Both produce output identical to the old readers on every existing
   instance file. The notifier's `readEntity` matches `sourceRef` at exactly
   two spaces of indent, so it already reads the current reference whatever
   the order of the nested block.
2. **Fleet proposal ids (decided).** They migrate to `ni:` with the rest.
3. **Fleet source hashing (decided).** It migrates to `ni:`, replacing the git
   blob SHA that `fleet-spec.md`, `payload.mjs` and `verify.mjs` still compute.
4. **Line endings.** Hashing raw bytes keeps the existing dependency on
   working-tree bytes matching the committed bytes. The `.gitattributes`
   `eol=lf` pin must stay; its `.konspekt/instance/**/*.md` pattern already
   covers the new `sha-256/` directories.

The migration is first run as a test on the `task-ni-references` branch,
tracked by `task-ni-test-migration`.

## Change list

Every file found by sweeping the repository for `sourceRef`, `contentHash`,
`git hash-object`, blob SHA, `sources/`, `commands/` and `command:`. Files
that mention a `contentHash` of their own output (the roadmap, the posters and
the snapshot) use SHA-256 digests unrelated to source references; they are
listed only where they also draw or describe source addressing.

### Spec (`spec/`)

- `spec/architecture/SERIALIZATION.md`: layout (`sha-256/` subfolders,
  `deprecated.md`); `ni:` references and the derived `contentHash`; the
  `deprecated:` block and `migratedAt`; `locators` and `locators.allow`; the
  `store` block in `project.md`; the hex and base64url conversion; the verify
  probe in Sources and Commands (raw-byte SHA-256 in place of
  `git hash-object`); the `source` columns of Transitions, Checkpoints and
  Authority; `command:` refs in Edges; checkpoint `entity` resolved through
  the store rule.
- `spec/architecture/STORAGE.md` (new): the store interface, the `resolve`
  rule format and its mapping to git, MongoDB and Postgres, and the
  `/.well-known/ni/` recommendation.
- `spec/architecture/RECONCILIATION.md`: the verify probe resolves through the
  store and hashes raw bytes.
- `spec/architecture/SCHEMA-RECONCILIATION.md`: provenance field references.
- `spec/architecture/TRANSPORT.md`: `resume` reads the last checkpoint through
  the store; the neutral read path exposes the store operations.
- `spec/architecture/README.md`: index entry for STORAGE.md.
- `spec/data-model/schema.ts`: `Provenance` (`sourceRef` pattern, no stored
  `contentHash`, `locators?`, `deprecated?`), a `Locator` type, `Project.store`
  and `Project.locators`.
- `spec/data-model/SPEC.md`: provenance prose and the integrity principle.
- `spec/personas/README.md`: channel refs.
- `spec/personas/engineer/SPEC.md` and `spec/personas/engineer/AGENTS.md`: the
  `commands/` channel, `command:ni:` refs, `commands/sha-256/`.
- `spec/personas/engineer/registry.mjs`: channel resolution
  (`command:<hash>` to `commands/<hash>.md`) and its git-blob-SHA verification.

### Instance data (`.konspekt/instance/`), written by the migration script

- `project.md`: the `store` and `locators` blocks.
- Every entity file under `nodes/`, `concepts/`, `noteworthy/`, `artifacts/`
  and `waypoints/` that carries `sourceRef`: new reference and `deprecated:`
  block. Entities without content-addressed provenance (62 today) are not
  touched.
- `sources/`: a `sha-256/<hex>.md` copy of each excerpt and a new
  `deprecated.md`; `sources/README.md` rewritten.
- `commands/`: a `sha-256/<hex>.md` copy of each command file (about 60) and
  a new `deprecated.md`; `commands/executed.md` cells rewritten.
- `transitions/transitions.md`, `authority/grants.md` and
  `checkpoints/checkpoints.md` (header only today): `source` cells rewritten.
- `edges/edges.md`: any `command:` refs rewritten (none exist today).
- `README.md`: description of the instance layout.

### Core library and tools

- `lib/conformance.mjs`: replace `gitBlobSha` with a raw-byte SHA-256 helper
  and `ni:` parsing; checks for `store`, `locators`, `locators.allow`,
  derived `contentHash`, `deprecated:` and `deprecated.md`; parser support for
  the new nested shapes.
- `lib/validate.mjs`: the `--no-sources` option text and the unreachable-
  locator warning.
- `lib/views.mjs`: the integrity gate, the provenance view and links built
  from the `resolve` rule.
- `lib/authority.mjs`: check that the grant `source` column parses `ni:`.
- `tools/migrate-ni.mjs` (new): the in-place migration script.
- `tools/binding-audit.mjs`: confirm that it is unaffected, since it reads
  commits and the changed-code log rather than sources.
- `tools/state-poster.mjs`: the `sources/<sha>` label in the generated poster.
- `tools/roadmap.mjs`, `tools/roadmap-poster.mjs`: no logic change; regenerate
  their outputs after the graph changes.
- `tools/views.mjs`, `tools/README.md`: confirm and update descriptions.
- `visual/build/snapshot.mjs`: the provenance fields carried into the
  snapshot; `visual/README.md` if those fields are described.

### Implementations

- `implementations/implementation-zero/app/server.mjs`: `/api/source` accepts
  `ni:` refs (the current regex allows hex only), resolves through
  `sources/sha-256/`, and serves `/.well-known/ni/sha-256/<digest>`; the
  entity endpoint returns the new provenance fields.
- `implementations/implementation-zero/app/view/app.js`: the provenance pane
  shows the `ni:` reference, the stored file path and the locators.
- `implementations/implementation-zero/app/test/server.test.mjs`: the
  40-hex assertion and the source lookup.
- `implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt`:
  provenance fields and nested-shape reading.
- `implementations/intellij-plugin/app/build.gradle.kts`: rebuild so the
  bundled view copy picks up the `app.js` change;
  `implementations/intellij-plugin/docs/DESIGN.md` if it describes provenance.
- `implementations/fleet/app/payload.mjs`, `outbox.mjs`, `fold.mjs`,
  `verify.mjs`: source hashing, the canonical file name on accept, the
  `sourceRef == contentHash` assumption, and proposal ids (question 2 above).
- `implementations/fleet/app/git.mjs`: the post-write SHA recheck.
- `implementations/fleet/app/test/payload.test.mjs`, `outbox.test.mjs`,
  `fold.test.mjs`: fixtures and assertions.
- `implementations/fleet/app/README.md`, `implementations/fleet/docs/DESIGN.md`,
  `implementations/fleet/docs/ADOPTING.md`,
  `implementations/fleet/design/fleet-spec.md`,
  `implementations/fleet/design/fleet-protocol.md`,
  `implementations/fleet/design/fleet-outbox-lifecycle.md`: every description
  of `git hash-object` and `sources/<hash>.md`.

### Setup kit (`setup/`)

- `setup/init.mjs`: write a default git `store` block and an empty
  `locators.allow`; create `sources/sha-256/` and `commands/sha-256/`.
- `setup/templates/sources-README.md`, `commands-executed.md`,
  `checkpoints.md`, `transitions.md`, `OPERATING.md`, `AGENTS-stanza.md`:
  addressing wording.
- `setup/README.md`: the layout diagram.
- `setup/WEBMOBILE_SEED.md`: the persist step ("verbatim source excerpt, git
  blob SHA, contentHash") becomes "verbatim source excerpt, `ni:` SHA-256
  reference", and the checkpoint step's source path.
- `setup/components/notify/konspekt-notify.mjs` and `notify.yml`: the
  `sourceRef` in event payloads and source links.

### Agent skills, hooks and operating policy

- `.konspekt/agents/skills/fleet-proposer-common/SKILL.md`, then regenerate the
  mirror `.claude/skills/fleet-proposer-common/SKILL.md` with
  `node tools/sync-agents.mjs`.
- `.claude/skills/konspekt-atom-readiness/SKILL.md`: "its git blob SHA as
  `contentHash`".
- `.claude/hooks/load-mandatory-skills.sh`: the checkpoint excerpt path
  `sources/${cp_source}.md` resolves an `ni:` reference to
  `sources/sha-256/<hex>.md`.
- `.konspekt/OPERATING.md`: the persist and checkpoint steps.
- `.konspekt/lib/konspekt-notify.mjs` and `.konspekt/notify.yml`: the installed
  copies of the notify component.
- `AGENTS.md` and `CLAUDE.md`: addressing wording, if any survives the update.

### Tests (`test/`)

- `test/conformance-checkpoints.test.mjs`, `test/conformance-transitions.test.mjs`,
  `test/conformance-authority.test.mjs`: fixtures written as
  `sources/<SHA>.md`.
- `test/setup-init.test.mjs`: the expected scaffold now includes the
  `sha-256/` directories and the `store` block.
- New tests: `ni:` parsing and the hex and base64url round trip, derived
  `contentHash`, the `deprecated:` block, `deprecated.md`, `locators.allow`,
  an unreachable locator, migration idempotence, and an instance that mixes
  migrated and unmigrated atoms.

### Documentation, visuals and guides

- `README.md`, `WHITEPAPER.md` (17 references), `docs/index.html`,
  `docs/overview.html`, `docs/overview.svg` and its two preview PNGs.
- `docs/visuals/konspekt-graph-example.svg` and its preview PNG.
- `docs/visuals/posters/konspekt-how-it-works-poster.html`,
  `konspekt-checkpoint-poster.html`, `konspekt-fleet-poster.html`, and the
  generated `konspekt-current-state-poster.html` and
  `konspekt-roadmap-poster.html`.
- The how-to walkthrough in `docs/visuals/how-to/`: the script
  `how-to.demo.flow.md`, the captions `konspekt-howto-walkthrough.srt`, the
  frames that show source paths (`provenance_source.png`, `ui_provenance.png`,
  `git_checkers.png`), and a re-render of `konspekt-howto-walkthrough.mp4`.
- `docs/announcements/linkedin/`: published posts stay as they are; a future
  post can announce the change.
- `.gitattributes`: keep the `eol=lf` pin and update its comment, which
  describes the git blob SHA.
- `ROADMAP.md`: regenerate after the graph changes.

### Distribution

- `distribution/build/distribute.mjs`: no change expected; rebuild
  `distribution/latest/` and cut a new version when releasing, since it
  projects `spec/`, `setup/` and the maintainer skills.

### Graph atoms to revise (through proposals)

- `concept-content-addressed-provenance`, `concept-two-pillars`,
  `concept-write-integrity-by-verification`.
- `nw-provenance-content-addressed`, `nw-checker-hashes-raw-disk-bytes`,
  `nw-fleet-sha256-source-addressing`, `nw-fleet-remove-fold-translation`,
  `nw-multifile-push-clobbers-silently`.
- `task-enterprise-persistence` (success criterion, already agreed),
  `task-provenance-model`, `task-sources-sha256-migration` (its rename plan
  conflicts with the in-place decision).
- `artifact-conformance-checker`, `artifact-fleet-worktree-design`.

### Outside this repository

- The seed pasted into the claude.ai Konspekt Project's instructions (it
  describes "git blob SHA, `contentHash`" and still names
  `denisurusov/konspekt`).
- cdm-collateral and code_tracer: run the migration script later.
- Any custom GPT or Gemini Gem that carries a copy of the seed.
