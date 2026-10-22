# Fleet committer recovery and `proposed`-index durability

Status: non-normative design note (`docs/design/` — fleet vocabulary, not
`spec/`). `spec/` governs on any conflict. Realizes the artifact record
`artifact-fleet-recovery`; serves `task-fleet-worktree-committer`.

The fleet committer's success criterion includes leaving "the store honest after
a crash between the fold commit and a `proposed`-ref update." That guarantee, the
crash points it covers, and the exact recovery procedure are stated across a task
success line, one `fleet-spec.md` sentence, and comments in
`implementations/fleet/app/proposed-ref.mjs`. This note assembles them into one
recovery contract an operator can follow without reading source.

## The invariant

**Canonical is the only authoritative input; the index is a derived projection
and is never read back onto canonical** (`nw-fleet-canonical-authoritative`).

Each atom's `review` field on the canonical branch is the truth: `proposed` =
pending, `accepted` = blessed, `rejected` = tombstone. The `proposed` index is a
rebuildable projection of that truth. It makes the review queue cheap to read and
survives a proposer worktree teardown, but it never holds state that canonical
does not. Because the flow is one-directional — canonical → index, never index →
canonical — a crash that leaves the index stale or absent cannot make the store
lie: the index is refreshed from canonical, and canonical is never refreshed from
the index.

## Fleet-side state (outside the validated instance)

Two files live under `.konspekt-fleet/` in the canonical worktree. Both are fleet
vocabulary and must not enter the stored konspekt data model (`fleet-spec.md`
preamble), so they sit outside the instance tree that `lib/validate.mjs` checks.

- **`folded.md` — the fold log.** Append-only; one row per folded proposal:
  `| proposal_id | ref | agent | edges |` (`proposed-ref.mjs` `appendFoldRecord`).
  It carries the one piece of state **not** derivable from the stored atoms: the
  `proposal_id → atom` linkage (`proposal_id` is fleet vocabulary and never
  enters an atom). It also records the atom's wiring-edge ids, so bless/reject can
  flip exactly the atom's own rows without re-reading a possibly torn-down outbox.
- **`proposed-index.json` — the materialized index.** A pure cache of the join
  below. Losing it costs nothing; `buildIndex` reconstructs it from canonical plus
  the fold log.

### Durability caveat (dogfood in-place canonical)

In this repository's UAT the canonical worktree is the real repo, whose
`.gitignore` ignores `.konspekt-fleet/` (`.gitignore:10`). There the fold log is
**local runtime state, not committed** and not carried when canonical is cloned
or pushed. Canonical truth (the atoms and their `review`) travels; the
`proposal_id → atom` linkage in the fold log does not. Losing the fold log loses
the ability to answer "which proposal became this atom," but loses no graph state:
every atom and its `review` remain authoritative on canonical. A throwaway fleet
store that does not ignore `.konspekt-fleet/` commits the log with each fold, so
the linkage travels with history there. Making the linkage durable across clones
of an in-place canonical is not yet designed.

## The rebuild procedure (`rebuild-index`)

`rebuildIndex` is `buildIndex` followed by `materializeIndex`
(`proposed-ref.mjs`). `buildIndex` is a pure read and **is** the rebuild — there
is no incremental state to trust, so a fresh build after a crash is correct by
construction:

1. Read the fold log into `{ proposalId, ref, agent, edgeIds }` rows, in fold
   order.
2. Load the canonical instance (`loadInstance`), giving every atom by id.
3. For each fold row, join on the atom's id and read its **current** `review` on
   canonical, classifying the entry:
   - atom present, `review: proposed` → **pending**
   - atom present, `review: accepted` → **accepted**
   - atom present, `review: rejected` → **rejected**
   - atom present, `review` anything else → **unknown**
   - no atom for the row's id → **missing** (an orphaned fold row — see crash A)
4. Resolve each atom's canonical-commit pointer best-effort (`git log -1` over the
   atom file); null when untracked or outside a repository. The pointer is a
   convenience, not state.
5. Sort by `proposal_id` and overwrite `proposed-index.json`.

The output is a function of canonical plus the fold log only, so two rebuilds over
an unchanged canonical produce the same index.

## Crash points and what each leaves behind

The write path per pass is: **fold** = write atom files + append fold-log row,
then one commit (`committer.mjs` `foldPass`); **index** = `rebuild-index`;
**bless/reject** = flip `review` on the atom and its edges + append the decision
record, then one commit per atom (`blessPass`).

| Crash point | Canonical | Fold log | Recovery |
|---|---|---|---|
| A. During fold, after the fold-log row is appended but before the fold commit | atom not committed (working-tree writes discarded on reset) | has a row with no committed atom | `rebuild-index` classifies the row **missing**; reset the worktree and re-run the fold. The orphaned row is harmless — it points at no atom. |
| B. After the fold commit, before/while `rebuild-index` runs (the case the spec names) | atom present, `review: proposed` | has the row | `rebuild-index` reconstructs the pending entry exactly. No loss. |
| C. During bless/reject, before the commit | atom unchanged (still `proposed`) | unchanged | reset the worktree; the atom stays pending; re-issue the decision. |
| D. After a bless/reject commit, before `rebuild-index` | atom `accepted`/`rejected` | unchanged | the index is stale only; `rebuild-index` re-derives the correct state. No loss. |

In every case the correct action is to reset any uncommitted worktree changes and
run `rebuild-index`. Nothing reads the index back onto canonical, so no recovery
step can corrupt the graph.

## Operator runbook

Run `rebuild-index` whenever the cached queue could be behind canonical:

```
node implementations/fleet/app/cli.mjs rebuild-index --root <fleet-root> \
  --instance-subdir .konspekt/instance
```

- **After every fold** (`run-pass` without `--dry-run`) — the fold does not update
  the index itself.
- **After every bless/reject** — the decision flips `review` on canonical; the
  index must be re-derived.
- **After a crash or an interrupted committer** — the single safe recovery action.
- **Whenever the materialized index is suspect** — it is a cache; rebuilding is
  cheap and always correct.

A reader that wants the queue fast may read `proposed-index.json` directly and
fall back to `rebuild-index` when it is absent or suspected stale.
