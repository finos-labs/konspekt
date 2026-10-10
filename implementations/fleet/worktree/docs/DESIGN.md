# Worktree-outbox fleet committer — implementation design

Status: design (non-normative). `spec/` governs on any conflict, and
`docs/design/fleet-spec.md` is the authoritative fleet design this implements.
This document is the implementation-level plan for `task-fleet-worktree-committer`
in `.konspekt/instance/`: the co-located worktree-outbox ingest channel and the
deterministic committer behind it.

## Scope

In scope (from `fleet-spec.md` § Scope of this cut): the proposer path (origin
plus serialized append), fold-to-canonical with the derived `proposed` index,
per-proposal admission, and advisory claims as thin conventions.

Out of scope: per-agent-branch parallel commit, delegated machine acceptance,
cross-agent code-change integration, the `edges.md` traversal shard, sandbox and
egress enforcement, and the LLM review assistant's own logic (only its read-only
seam is defined here).

## Placement and relationship to the MCP channel

`implementations/fleet/worktree/` is one of the two ingest channels of the single
committer contract (`nw-fleet-committer-ingest-contract`): worktree-outbox for
co-located container agents, MCP (`implementations/fleet/mcp/`) for proposers with
no working tree. Both satisfy the same proposal payload schema and committer
verify/fold/bless protocol.

Decisions pinned for this cut:

1. **The committer runs as its own long-lived CLI process**, not folded into the
   `implementation-zero` server. This keeps it closest in shape to the MCP channel
   (a standalone process that ingests proposals) and keeps the deterministic
   writer off the read-only viewer's path.
2. **Reader filtering of `review: rejected`** (so a tombstone does not render as a
   live node in the shipped tree-readers) is a **separate sibling task against the
   readers**, not part of this task. Tracked as `task-reader-rejected-filter`.
3. **The shared ingest-contract module** (payload schema + verify) is **extracted
   later**, once the worktree cut is self-contained and the MCP channel is built;
   the worktree cut does not depend on it first.

## Reuse of `lib/`

The committer is orchestration over the existing shared library, not a second
copy of the data model:

- `lib/conformance.mjs` — `loadInstance`, `gitBlobSha` (the v1 source address),
  `parseYamlSubset`, `splitEntityFile`, `EDGE_KINDS`, and the validators.
- `lib/authority.mjs` — grants and principals, for the scope-vs-grant check.
- `lib/validate.mjs` — the post-fold and post-bless conformance gate.

## Conventions

Node ESM (`.mjs`), minimal dependencies, matching `implementation-zero`. Layout
per `implementations/README.md`: `app/` for code, `docs/` for this design.

## Module layout (`app/`)

| File | Role |
|------|------|
| `git.mjs` | Plumbing: `git hash-object --no-filters`, atomic append+commit, post-write SHA recheck, DCO `Signed-off-by` trailer, worktree add/remove. |
| `worktrees.mjs` | Stand up N+1 worktrees off one object store; map outbox branch to owner handle. |
| `payload.mjs` | Parse/serialize `proposal.md` + `source.md`; canonicalize and compute `proposal_id`. |
| `outbox.mjs` | Proposer side: write one `proposals/<id>/` directory onto the agent's own outbox branch. |
| `verify.mjs` | Per-proposal checks: recompute `proposal_id` and source hash, `origin.agent` equals branch owner, scope within grant, entity carries `confidence` and a resolved `binding`, resolve `depends_on`. Failures are set aside with a reason, never folded. |
| `order.mjs` | Fold order (arrival) kept separate from bless order (`depends_on` gate). |
| `fold.mjs` | Fold verified proposals onto canonical as `review: proposed` in one commit — source, entity, edge rows with per-row override. |
| `proposed-ref.mjs` | Build and rebuild the derived `proposed` index from canonical. |
| `bless.mjs` | Field-only accept commit (flip `review` to `accepted`, append accept record); reject writes a `review: rejected` tombstone with reason. |
| `committer.mjs` | The deterministic loop: read, verify, order, fold, record; one pass in flight. |
| `review-assistant.mjs` | Read-only seam the LLM assistant fills; ships with a plain CLI prompt, no model. |
| `cli.mjs` | Entry points: `propose`, `run-pass`, `bless <ids>`, `rebuild-index`. |
| `test/` | Unit per module plus an integration test over a temp object store with N worktrees, asserting the folded/blessed tree passes `lib/validate.mjs`. |

## `proposal_id` canonicalization (pinned)

`proposal_id` is the **git blob SHA** (`git hash-object --no-filters`, sha1 over
`"blob <len>\0" + bytes`) of the **canonicalized proposal**. The v1 fleet binding
adds no second content-address (`fleet-spec.md` § Proposal payload schema), so the
id uses the same scheme as every other address in the store.

Canonical bytes are the bytes of `proposal.md` with:

- the single `proposal_id:` frontmatter line removed (the field cannot address
  itself),
- line endings normalized to `LF` (any `CRLF` or lone `CR` becomes `LF`),
- exactly one trailing `LF`.

`source.hash` is computed separately as `git hash-object --no-filters` over the
raw bytes of `source.md`, and is embedded in `proposal.md` frontmatter. Because
the id is taken over `proposal.md` (which carries `source.hash`), the
`proposal_id` transitively covers the source excerpt without hashing it twice.

The committer recomputes both on receipt and rejects any mismatch, so a proposal
that was altered after its id was assigned never folds.

## Milestones

Each milestone is independently testable.

1. **M1 — payload + addressing.** `payload.mjs` + `git.mjs` `gitBlobSha` reuse;
   `proposal_id` canonicalization fixed and tested.
2. **M2 — worktree harness.** `worktrees.mjs`: N+1 worktrees, branch-to-owner map,
   teardown.
3. **M3 — proposer outbox write.** A proposal lands on the agent's outbox branch,
   nowhere else.
4. **M4 — verify.** Green and red paths, including spoofed-origin and out-of-scope
   set-aside.
5. **M5 — fold.** Folded canonical passes `lib/validate.mjs`; the atom is wired
   whole in one commit.
6. **M6 — derived index.** Build, and rebuild from canonical after a simulated
   crash between the fold commit and the ref update.
7. **M7 — bless/reject.** Field-only accept, accept record, reject tombstone;
   re-validate.
8. **M8 — claims.** claim / claim-release as grow-only proposals, no new
   primitive.
9. **M9 — assistant seam.** Read-only interface plus CLI; the model itself stays
   out of scope.

## Invariants the code must hold

- Canonical is authoritative; the `proposed` ref is a derived, rebuildable index
  (`nw-fleet-canonical-authoritative`).
- The write path is deterministic with no model on it; bless is field-only; fold
  wires the atom whole, so canonical never lands partially wired
  (`nw-fleet-committer-role-split`).
- Origin is taken from the outbox branch owner; scope is checked, not trusted —
  triage for accountability, not a security boundary.
- The v1 source address is the git blob SHA; the SHA-256 migration
  (`task-sources-sha256-migration`) flips the fleet path when it lands store-wide.
- One serialized writer; proposer agents read canonical and never write it.
