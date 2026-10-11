# Worktree-outbox fleet committer — app

The runnable committer for the co-located worktree-outbox fleet. N proposer
agents each write to their own git **outbox** branch; one deterministic
**committer** folds verified proposals onto the **canonical** branch as
`review: proposed`, and on the human's decision blesses or rejects them.

This README explains **when, how, and why each `.mjs` runs**. For the design
and rationale see `../docs/DESIGN.md`; for the fleet model see
`../../../../docs/design/fleet-spec.md`; `spec/` governs on any conflict.

## What triggers the code

Nothing runs on a timer, a hook, or a daemon. Every module is reached through
`cli.mjs`, and `cli.mjs` is invoked by hand — by a **proposer agent** (one
command, `propose`) or by the **committer operator** (everything else). A
"pass" is one CLI invocation that returns; there is no long-running loop in
this cut. So:

- **when** — only when a person or agent runs one of the five commands below;
- **how** — through `cli.mjs <command> --flags`;
- **why** — each command performs one span of the committer protocol
  (`fleet-spec.md` § Committer protocol).

All durable state is in git (the canonical and outbox branches) plus
`.konspekt-fleet/` runtime logs (gitignored, rebuildable). A fresh process
reattaches to a session by reading `fleet.json` (`loadFleet`); it holds no
in-memory state between commands.

## The five commands (the only entry points)

| Command | Who runs it | When | What it does |
|---------|-------------|------|--------------|
| `init` | operator | once, standing up a throwaway session | create N+1 worktrees + `fleet.json` |
| `propose` | a proposer agent | once per atom | write one `proposals/<id>/` onto the agent's own outbox branch |
| `run-pass --dry-run` | operator | before folding | read every outbox, print each proposal's verify verdict, write nothing |
| `run-pass` | operator | to fold | fold the verified set onto canonical as `review: proposed`, one commit |
| `rebuild-index` | operator | after a fold, or after a crash | regenerate the derived pending/accepted/rejected queue from canonical |
| `bless --accept … --reject …` | operator | after the human decides | one field-only commit per atom: flip `review`, append the decision record |

Common flags: `--root <fleet-root>` (every command); committer identity
`--name`/`--email` (becomes the DCO sign-off); `--instance-subdir
.konspekt/instance` when canonical carries a full repo rather than a bare
instance; `--grants <file>` for `run-pass` (handle → scope grant).

> `init` builds a *throwaway* object store (fresh `git init`). A real-repo
> session does not use `init`: its canonical is a feature branch of the real
> repo and the outbox worktrees are added by hand, per `fleet-spec.md`
> § Session branches. Both paths produce the same `fleet.json` that every other
> command reads.

## One session, end to end

Each step names the command, who triggers it, and the modules it pulls in. This
is the execution order; steps map to `fleet-spec.md` § Committer protocol.

1. **Stand up** — operator runs `init` (or sets up worktrees by hand for a
   real-repo session). → `worktrees.mjs` → `git.mjs`. Result: `canonical/` and
   `outbox-<handle>/` worktrees sharing one object store, plus `fleet.json`.
2. **Propose** — each proposer agent runs `propose` against its own handle. →
   `cli.mjs` → `outbox.mjs` (`assembleProposal`) → `payload.mjs` (compute
   `proposal_id` and `source.hash` via `lib/conformance.mjs gitBlobSha`) →
   `git.mjs` (commit onto the outbox branch). Result: `proposals/<id>/` on that
   agent's outbox, nowhere else.
3. **Dry pass** — operator runs `run-pass --dry-run`. → `committer.mjs`
   (`verifyPass`) → `verify.mjs`. Reads every outbox and prints `OK` /
   `SET ASIDE` with reasons. No write. This is the manual-UAT read-and-report
   checkpoint.
4. **Fold** — operator runs `run-pass`. → `committer.mjs` (`foldPass`) →
   `order.mjs` (`foldOrder`, arrival order) → `fold.mjs` (`foldProposals`,
   translate payload to stored form, inject `review`/provenance, wire edges) →
   `proposed-ref.mjs` (`appendFoldRecord` → `.konspekt-fleet/folded.md`) →
   `git.mjs` (one commit). Each verified atom lands whole as `review: proposed`.
5. **Index** — operator runs `rebuild-index`. → `proposed-ref.mjs`
   (`rebuildIndex`) reads canonical (`lib/conformance.mjs loadInstance`) joined
   to the fold log, and materializes pending/accepted/rejected.
6. **Present** — the human reads the queue and names a subset to admit. (The
   read-only review-assistant seam that would cluster and summarize here is M9,
   not yet built; today the operator reads the index directly.)
7. **Bless / reject** — operator runs `bless` with the human's `--accept` /
   `--reject` ids. → `committer.mjs` (`blessPass`) → `bless.mjs` (`decideAtom`:
   flip `review` on the entity and its edges; append to
   `.konspekt-fleet/decisions.md`) → `git.mjs` (one atomic commit per atom).
   Accept needs `--by <principal>`; reject carries `--reason`.

Steps 2–7 repeat within a session. Steps 3–7 are all the committer operator; a
proposer agent only ever touches step 2, only on its own branch.

## Module map, by role

| Module | Reached by | Role |
|--------|-----------|------|
| `cli.mjs` | the shell | the only entry point; parses flags and dispatches the five commands |
| `worktrees.mjs` | `init`, and every command via `loadFleet` | stand up / attach the N+1 worktrees; map outbox branch → owner handle (`fleet.json`) |
| `outbox.mjs` | `propose` | proposer side: assemble + sign a payload, write `proposals/<id>/`, commit to the outbox |
| `payload.mjs` | `outbox.mjs`, `verify.mjs` | serialize/parse `proposal.md`; canonicalize and compute `proposal_id` |
| `verify.mjs` | `run-pass` (both modes) via `committer.mjs` | per-proposal checks (id, source hash, origin == branch owner, scope within grant, confidence + binding present, `depends_on`); failures set aside |
| `order.mjs` | `run-pass` (fold) | fold order (arrival) kept apart from bless order (`depends_on` gate) |
| `fold.mjs` | `run-pass` (fold) | translate verified payloads to stored entities, inject committer-owned fields, wire edges, write source excerpt |
| `proposed-ref.mjs` | `run-pass` (fold) and `rebuild-index` | append the fold log; build/rebuild the derived index from canonical |
| `bless.mjs` | `bless` | field-only accept (flip `review`, append accept record) and reject tombstone |
| `committer.mjs` | `run-pass`, `bless` | the deterministic passes: `verifyPass`, `foldPass`, `blessPass` — read every outbox, apply one pass, commit |
| `git.mjs` | most of the above | plumbing: `hash-object`, worktree add/remove, commit with DCO sign-off, post-write SHA recheck |

Four modules (`payload`, `fold`, `proposed-ref`, `bless`) reuse the shared data
model from `../../../../lib/conformance.mjs` (`gitBlobSha`, `loadInstance`,
`parseYamlSubset`) rather than re-implementing it.

## State on disk

- **`canonical` branch** — the graph: accepted, `proposed`, and `rejected`
  atoms. Authoritative.
- **`outbox/<handle>` branches** — each proposer's `proposals/<id>/` payloads.
- **`.konspekt-fleet/`** (gitignored) — `folded.md`, `decisions.md`, and the
  materialized index. Runtime logs, rebuildable from canonical, never committed
  (`fleet-spec.md` § Runtime state outside history).
- **`fleet.json`** (at the fleet root) — the session manifest: canonical path
  and branch, and each proposer's handle/path/branch. `loadFleet` reads it.

## Tests

```
cd implementations/fleet/worktree/app
node --test
```

One `test/<module>.test.mjs` per module, a subprocess test over `cli.mjs`
(`cli.test.mjs`), and integration tests that stand up a temp object store with
N worktrees and assert the folded/blessed tree passes `lib/validate.mjs`.

## Status

M1–M7 are implemented: `init`, `propose`, `run-pass` (dry + fold),
`rebuild-index`, and `bless`. M8 (claims / claim-release as grow-only
proposals) and M9 (the read-only review-assistant seam) are planned
(`../docs/DESIGN.md` § Milestones); the `review-assistant.mjs` listed there does
not exist yet.
