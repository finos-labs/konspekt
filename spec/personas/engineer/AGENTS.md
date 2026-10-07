# konspekt — engineer persona layer (operating brief)

Loaded when an instance activates this layer (`personas: [engineer]` in
`.konspekt/instance/project.md`). This is the operating counterpart to
`./SPEC.md` (normative vocabulary) and `./registry.mjs` (machine-readable
vocabulary): what the maintainer *does* while the layer is active. It does not
change the core operating loop — propose on your own judgment as
`review: proposed`, and never originate an acceptance.

The layer adds three constructs to app-building work. Use them as follows.

## ASR — architecturally significant requirement

When a durable, load-bearing architectural constraint crystallizes, propose it
as a **Concept** with `subtype: asr`. Its prose is the definition body. Its
significance is carried by a `drives` edge to each ADR the requirement shapes,
never a stored flag. In v1, `drives` originates only from an ASR.

An architectural force is an ASR only when it will drive ADRs through `drives`. A
limit that merely bounds the work, with no ADR to shape, is a core `constraint`
Noteworthy; do not record the same force as both.

## ADR — architecture decision record

When an architectural decision is made, propose it as a **Waypoint** of
`kind: decision` with `subtype: adr`. The decision statement is the description
body; there is no new prose field. Context is the inbound `drives` edges from
the ASRs that forced it; consequences are outbound edges to the entities it
touches; status rides the core `review` state plus `supersedes` for replacement
— reuse the existing supersedes / companion-atom pattern and add no ADR-specific
states.

## Executed-command provenance

Record **every bash command you execute** as content-addressed provenance,
mirroring `sources/`:

- Store the command text alone (no output) at `commands/<contentHash>.md`, where
  the filename is the git blob SHA of the file; the channel is append-only.
- Attach an `executed` edge from the enacting entity to `command:<hash>`,
  carrying a `timestamp`. The `from` is the ADR when the command carried out that
  decision, otherwise the active task node. A command run twice is one file and
  two edges.
- The execution timeline is a query — `edges where kind = executed` ordered by
  `timestamp`, ties broken on edge id — never a stored list.

**Exempt konspekt-maintenance commands** — git, hashing, and the push that
persists the ledger itself. Recording those would make persisting a command
itself a command, without end. Scope is bash only; MCP tool calls are out of
scope. The target is engineering / app-building work, not konspekt upkeep.

This exemption is about the **command-provenance channel only**. It never exempts
*work* from binding. Under `binding: required` (`spec/architecture/BINDING.md`)
every substantive deliverable — code, docs, presentation, releases, announcements
— must still resolve to an entity, and every non-bookkeeping commit must carry a
changed-code row that binds it. Do not read "a maintenance command is exempt from
command-provenance" as "this kind of work need not be captured." The forcing
function is `konspekt-atom-readiness`; the detection surface is
`tools/binding-audit.mjs`.

## Changed-code rows and acceptance before work

After each non-bookkeeping commit, append one row per changed file to
`changes/changed.md`: `| <entity-id> | <commit> | <file> | <timestamp> |`, where
`timestamp` is the ISO 8601 time you write the row.

Read the `basis` field of `.konspekt/instance/project.md`. When it is
`accepted` (`spec/architecture/REVIEW.md` § Acceptance before work):

- Before you edit a file outside `.konspekt/instance/`, run a command for the
  task, or write a changed-code row, read the bound entity's `review`. If it is
  not `accepted`, stop. Print the entity's text to the human and request its
  acceptance.
- An instruction to start work is not an acceptance. Do not write
  `review: accepted` on the entity because you were told to begin.
- Before you set a node to `resolved`, check that each decision attached to it
  is `accepted`. Request acceptance of any that is not.

## Boundaries

- Everything here still lands `review: proposed`; the human accepts. The layer
  extends the vocabulary and the maintainer's attention, not the review gate.
- Core enums are not grown with layer values: `adr` is a `subtype` on a
  `decision` waypoint, not a new waypoint kind. Normative detail is in
  `./SPEC.md`; the checker loads `./registry.mjs` only when this layer is active.
