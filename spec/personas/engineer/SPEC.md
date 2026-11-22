# konspekt — engineer persona (spec)

An extension layer over the persona-agnostic core (`../README.md`) for app-building work. It contributes two decision-record subtypes (ASR, ADR), one content-addressed provenance channel (executed commands), and two edge kinds (`drives`, `executed`). It adds nothing to core enums; all values below are registered in `registry.mjs` and merged by the conformance checker only when an instance activates `engineer`.

## ASR — Architecturally Significant Requirement

An ASR is a durable, load-bearing constraint or force that shapes decisions. It is a **Concept** carrying `subtype: asr`.

- Prose (the `definition` body) states the requirement.
- Its architectural significance is not a stored flag; it is the existence of a `drives` edge from the ASR to one or more ADRs. "The ASRs behind this decision" and "the decisions this requirement drove" are queries over `drives` edges, consistent with inventories-as-queries.
- Supersession, refutation, and merge reuse the core Concept machinery unchanged (`supersedes`, aliases).

## ADR — Architecture Decision Record

An ADR is a recorded decision with its context and consequences. It is a **Waypoint** of `kind: decision` carrying `subtype: adr`, so it already sits on the timeline where a decision belongs.

- The decision statement is the Waypoint `description` body. The ADR introduces **no new prose field** — context, decision, and consequences are expressed structurally rather than duplicated into fields:
  - **context / forces** = inbound `drives` edges from ASRs.
  - **consequences** = outbound core edges to the artifacts and nodes the decision touches (`produces`, `marks`, `decomposes`, …).
  - **status** (proposed / accepted / superseded) = the core `review` state plus a `supersedes` edge. An ADR that replaces an earlier one is the `from` of a `supersedes` edge; the superseded ADR stays in the graph, append over rewrite, so the reversal stays legible. No ADR-specific status enum is introduced.
- Constraint: `subtype: adr` requires `kind: decision`. A milestone or pivot is not an ADR.

## Executed commands — a provenance channel

Commands the maintainer runs while building are captured as content-addressed provenance, parallel to `sources/`:

- `commands/sha-256/<hex>.md` holds one command's **verbatim text**, no front-matter, no `id`. The filename is the hex SHA-256 of the file's bytes and the file is referenced as `command:ni:///sha-256;<base64url>`, so the verify probe is the one `sources/` uses (`../../architecture/SERIALIZATION.md` § Content references). Legacy `commands/<sha1>.md` files are kept after migration.
- The directory is **append-only**. Identical command text hashes to one file; two runs of it are one file.
- Only the command text is stored. Output (stdout/stderr/exit) is deliberately excluded — the record answers *what was run*, and capturing results would balloon the channel past its purpose.

### Scope of capture

Capture is **all bash commands** the maintainer executes in service of building, with one exemption: **konspekt-maintenance commands** — the `git`/hash operations and pushes that persist konspekt's own atoms and edges — are not captured, so "all" does not regress infinitely onto the act of recording. The target is the engineering/app-building work, and MCP tool calls are out of scope for this channel.

### The executed log — binding commands to entities

Executions are recorded in an append-only log, **not** as edges:

- `commands/executed.md` is a table `| entity | command |`. Each row is one execution: `entity` is the id of the entity the command was about — **any entity type** — and `command` is the content reference resolving to `commands/sha-256/<hex>.md`.
- The relationship is one-to-many (an entity has many commands), and **row order is execution order** — top to bottom is the timeline. There is no stored timestamp: natural execution order is append order, which a git-diffable append-only file preserves.
- The execution timeline is the log's row order; "the commands for entity X" is a filter over the `entity` column — a query, no stored list.

A log rather than `executed` edges keeps a high-volume, time-ordered, provenance-only record out of the goal graph's edge table (whose rows carry no timestamp), and lets any entity type be a command's subject without widening core edge domain/range.

## Changed code — a second provenance channel

Committed code changes are recorded the same way as commands, but the change itself is not stored — it already lives in git:

- `changes/changed.md` is an append-only table `| entity | commit | file | timestamp |`. Each row binds one code change to the entity it was about — **any entity type**: `commit` is the revision that carried it, `file` a repo-relative path it touched, and `timestamp` the ISO 8601 time the row was written. One-to-many, and **row order is commit order**. The timestamp is what lets the checker compare the binding with the acceptance of the entity under `basis: accepted` (`../../architecture/REVIEW.md` § Acceptance before work); a row written before the column existed has none and is exempt from that comparison.
- `commit` is an **opaque revision token**: the checker validates its shape and non-emptiness only, and no reader resolves it against a VCS, so the channel stays VCS-neutral. The diff is recoverable from `commit`; only which-files and which-commit are stored.
- Rows are written **push-based at commit time**, so a row trails its commit by one. Deriving the log by walking `git log` and parsing `<entity-id>:` subject prefixes is deliberately **not** done, because it would make generation git-specific.
- **Scope:** bookkeeping commits — those touching only `.konspekt/instance/**` or this log — are excluded; commits with no `<entity-id>:` subject prefix are dropped. As with commands, this answers *what changed for entity X*, a filter over the `entity` column.

## Review units — derived from the changed-code log

A **review unit** is a forge's unit of review and merge; on GitHub, the reference binding, it is a pull request. The layer links bound commits to the review units that contain them, so *which review units delivered entity X* is a join, not a hand-kept map (`nw-task-pr-map-derivable`):

- `changes/review-units.md` is an optional table `| review unit | state | merge commit | commit | timestamp | landed | match |`, one row per (review unit, commit). `review unit` is the unit's URL; `state` is `open`, `merged`, `closed`, or `direct`; `merge commit` is the revision the merge produced (empty unless merged); `commit` is a token copied exactly from the changed-code log; `timestamp` is the unit's merge time, else its close time, else its creation time. `landed` and `match` are optional columns, given together; a log with only the first five columns is valid.
- The entity is **not** stored: it is reached through the changed-code log's `commit` column. A commit in several units (stacked units) has a row per unit.
- **Direct commits** (`nw-direct-commits-recorded`). A bound commit on the default branch that no unit contains has one row with `state: direct`, an empty review unit and merge commit, and the commit's committer time as `timestamp`. A bound commit with no row is therefore not on the default branch yet, or the log has not been derived since it was bound; an absent row never means "pushed directly".
- **Landed commit** (`nw-landed-commit-recorded`). `landed` is the default-branch revision that carries the bound commit's change; `match` says how it was found: `same` (the commit itself reached the default branch, by a merge-commit merge or directly), `squash` (the unit's merge commit squashed its commits), `patch-id` (a commit that a rebase merge put on the default branch has the same `git patch-id --stable`), or `position` (a rebase merge in which no patch-id matched, for example after a conflict resolved in the rebase; the rebased commit at the bound commit's position in the unit). Only `merged` and `direct` rows land. Squash and rebase merges replace the bound commits on the default branch; `landed` is how a binding follows them.
- Rows are **derived, not typed**. A forge adapter outside the core (`tools/review-units.mjs`, GitHub through `gh`) reads the forge's record and rewrites the file whole, so a unit's row follows it from `open` to `merged` or `closed`. Any unit counts, opened by a human, an agent, or a bot, once it contains a bound commit. This is the one log in the layer that is pull-based; it may be, because the forge query lives in a tool, not in the format or the checker, which stay forge- and VCS-neutral.
- Units of code work only. The reference transport writes instance state to `main` without pull requests (`../../architecture/TRANSPORT.md`); that rule is unchanged.
- A binding audit that requires each default-branch commit to be bound (this repository's `tools/binding-audit.mjs`) counts a commit as bound when the changed-code log names it or when it is the `landed` of a row whose commit is bound, to that commit's entities. Until the log is derived after a squash or rebase merge, the new commit is reported as unbound.

## Edges this layer adds

| kind | from | to | meaning |
|------|------|----|---------|
| `drives` | concept (`subtype: asr`) | waypoint (`subtype: adr`) | the ASR is an architecturally significant force behind the ADR |

`drives` originates only from an ASR in v1. An architectural force already recorded as a `constraint` Noteworthy reaches an ADR through existing core edges rather than widening `drives`. (An earlier draft bound commands with an `executed` edge carrying a timestamp; that is superseded by the log above, because the core edge table cannot serialize a per-row timestamp.)

## Conformance additions

When `engineer` is active, the checker (via `registry.mjs`) additionally:

- accepts `subtype: asr` on a concept and `subtype: adr` on a waypoint, and warns on an ADR whose `kind` is not `decision`;
- accepts `drives` as an edge kind with the domain/range above (an out-of-range end is a warning, matching core edge domain/range);
- reports an ADR that no ASR drives, since with no inbound `drives` edge the ADR has no recorded context: an error (`subtype-missing-inbound-proposed`) when the ADR is `proposed`, because a proposal lands wired, and a warning (`subtype-missing-inbound`) when it is `accepted`. A rejected ADR and an ADR that is the `to` of a `supersedes` edge are exempt;
- resolves a `command:<reference>` against `commands/sha-256/<hex>.md` (or, for a legacy SHA-1, `commands/<sha1>.md`) — missing file is `dangling-provenance-ref` (error), and a hash that does not match the file is `provenance-ref-hash-mismatch` (warning);
- validates `commands/executed.md`: each row's `entity` must resolve to an entity file (`dangling-executed` error) and be an allowed subject type, and its `command` hash must resolve and verify like any provenance-ref;
- validates `changes/review-units.md` when present: a row whose `commit` is not, as a string, a `commit` of the changed-code log is `dangling-review-unit-commit` (error); an empty review unit (except on a `direct` row) or an empty commit, a `state` outside `open | merged | closed | direct`, a `merged` row with no merge commit, a `direct` row that names a review unit or merge commit, `landed` without `match` or the reverse, a `match` outside `same | squash | patch-id | position`, a landed commit on an `open` or `closed` row, or an unparseable timestamp is `review-unit-incomplete` (error); a repeated (review unit, commit) pair is `duplicate-review-unit-row` (warning); a commit of the changed-code log with no row is `review-unit-missing` (warning: it is on no default branch yet, the log is stale, or a rewrite before merge left the commit on no branch). The checker resolves nothing against the forge;
- leaves every core rule untouched, so an instance without `engineer` sees none of the above.
