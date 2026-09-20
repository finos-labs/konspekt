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

- `commands/<contentHash>.md` holds one command's **verbatim text**, no front-matter, no `id`. The filename is the git blob SHA of the file, so the verify probe is `git hash-object` of that file equalling the referenced hash — the identical probe `sources/` uses.
- The directory is **append-only**. Identical command text hashes to one file; two runs of it are one file.
- Only the command text is stored. Output (stdout/stderr/exit) is deliberately excluded — the record answers *what was run*, and capturing results would balloon the channel past its purpose.

### Scope of capture

Capture is **all bash commands** the maintainer executes in service of building, with one exemption: **konspekt-maintenance commands** — the `git`/hash operations and pushes that persist konspekt's own atoms and edges — are not captured, so "all" does not regress infinitely onto the act of recording. The target is the engineering/app-building work, and MCP tool calls are out of scope for this channel.

### The executed log — binding commands to entities

Executions are recorded in an append-only log, **not** as edges:

- `commands/executed.md` is a table `| entity | command |`. Each row is one execution: `entity` is the id of the entity the command was about — **any entity type** — and `command` is the content hash resolving to `commands/<command>.md`.
- The relationship is one-to-many (an entity has many commands), and **row order is execution order** — top to bottom is the timeline. There is no stored timestamp: natural execution order is append order, which a git-diffable append-only file preserves.
- The execution timeline is the log's row order; "the commands for entity X" is a filter over the `entity` column — a query, no stored list.

A log rather than `executed` edges keeps a high-volume, time-ordered, provenance-only record out of the goal graph's edge table (whose rows carry no timestamp), and lets any entity type be a command's subject without widening core edge domain/range.

## Changed code — a second provenance channel

Committed code changes are recorded the same way as commands, but the change itself is not stored — it already lives in git:

- `changes/changed.md` is an append-only table `| entity | commit | file |`. Each row binds one code change to the entity it was about — **any entity type**: `commit` is the revision that carried it, `file` a repo-relative path it touched. One-to-many, and **row order is commit order** (no stored timestamp).
- `commit` is an **opaque revision token**: the checker validates its shape and non-emptiness only, and no reader resolves it against a VCS, so the channel stays VCS-neutral. The diff is recoverable from `commit`; only which-files and which-commit are stored.
- Rows are written **push-based at commit time**, so a row trails its commit by one. Deriving the log by walking `git log` and parsing `<entity-id>:` subject prefixes is deliberately **not** done, because it would make generation git-specific.
- **Scope:** bookkeeping commits — those touching only `.konspekt/instance/**` or this log — are excluded; commits with no `<entity-id>:` subject prefix are dropped. As with commands, this answers *what changed for entity X*, a filter over the `entity` column.

## Edges this layer adds

| kind | from | to | meaning |
|------|------|----|---------|
| `drives` | concept (`subtype: asr`) | waypoint (`subtype: adr`) | the ASR is an architecturally significant force behind the ADR |

`drives` originates only from an ASR in v1. An architectural force already recorded as a `constraint` Noteworthy reaches an ADR through existing core edges rather than widening `drives`. (An earlier draft bound commands with an `executed` edge carrying a timestamp; that is superseded by the log above, because the core edge table cannot serialize a per-row timestamp.)

## Conformance additions

When `engineer` is active, the checker (via `registry.mjs`) additionally:

- accepts `subtype: asr` on a concept and `subtype: adr` on a waypoint, and warns on an ADR whose `kind` is not `decision`;
- accepts `drives` as an edge kind with the domain/range above (an out-of-range end is a warning, matching core edge domain/range);
- resolves a `command:<hash>` reference against `commands/<hash>.md` — missing file is `dangling-provenance-ref` (error), and a hash that does not match the file is `provenance-ref-hash-mismatch` (warning);
- validates `commands/executed.md`: each row's `entity` must resolve to an entity file (`dangling-executed` error) and be an allowed subject type, and its `command` hash must resolve and verify like any provenance-ref;
- leaves every core rule untouched, so an instance without `engineer` sees none of the above.
