# Adopting the fleet committer — step-by-step

This guide walks an adopter through running the fleet committer on a repository:
N proposer agents each write proposals to their own git outbox branch, one
deterministic committer appends the verified proposals onto the canonical branch
as `review: proposed`, and a human accepts or rejects them. It uses the CLI in
`../app/cli.mjs`.

The one invariant to hold throughout: **agents propose, humans accept.** Each
proposer authors a konspekt atom in stored form with `review: proposed`; the
committer copies that atom onto canonical byte for byte and never rewrites it;
only a human changes `review` to `accepted`. The committer identity
(`--name`/`--email`) becomes the DCO `Signed-off-by` trailer on every commit it
makes.

## Prerequisites

- Node.js >= 20 (`../app/package.json` `engines`).
- `git` on `PATH`.
- A konspekt instance to receive proposals: either a directory that is itself an
  instance, or a repository whose instance is at `.konspekt/instance/` (see
  `--instance-subdir` below).
- A canonical branch that already validates: run `lib/validate.mjs` against it
  and get zero errors before you start, because the committer appends onto it.

## Step 0 — choose a git topology

How the git object store is laid out is a binding choice below the fleet model
(`.konspekt/instance/noteworthy/nw-fleet-git-topology-below-standard.md`). Three
layouts are equivalent at the protocol level; pick by what your hosting allows:

- **Linked worktrees off one object store** — one worktree on the canonical
  branch, one worktree per proposer on `outbox/<handle>`. This is what `init`
  builds and what this guide uses.
- **Separate local repositories** — one repo per proposer, one canonical repo.
- **Protected remote namespaces** — `refs/konspekt/outbox/<handle>/*` on a
  shared remote, one namespace per proposer.

Whichever you choose, the committer reads a manifest (`fleet.json`) that maps each
outbox branch to its owning handle, and that map is the anti-spoof binding: a
proposal whose declared origin disagrees with the branch it arrived on is set
aside.

## Step 1 — stand up a session

### Quick trial (throwaway object store)

`init` creates a fresh `git init` store with N+1 worktrees and writes
`fleet.json`. Use it to try the flow, not against your real repository.

```
node ../app/cli.mjs init \
  --root /path/to/session \
  --proposers agent-a,agent-b \
  --name "Committer Name" --email committer@example.com
```

Result under `/path/to/session`: `canonical/` (committer worktree on the
`canonical` branch), `outbox-agent-a/` and `outbox-agent-b/` (proposer worktrees
on `outbox/agent-a` and `outbox/agent-b`), and `fleet.json`.

Seed the canonical worktree with your instance (copy your `.konspekt/instance/`
or instance files into `canonical/`), then commit it on the canonical branch.

### Real repository

`init` always creates a throwaway store, so for a real repository add the
worktrees by hand against your existing repo and write `fleet.json` yourself:

```
# canonical worktree on a feature branch of your repo
git worktree add /path/to/session/canonical -b konspekt/fleet-session

# one outbox worktree per proposer, each on its own branch off canonical
git worktree add /path/to/session/outbox-agent-a -b outbox/agent-a konspekt/fleet-session
git worktree add /path/to/session/outbox-agent-b -b outbox/agent-b konspekt/fleet-session
```

Then write `/path/to/session/fleet.json`:

```json
{
  "canonicalPath": "/path/to/session/canonical",
  "canonicalBranch": "konspekt/fleet-session",
  "proposers": [
    { "handle": "agent-a", "path": "/path/to/session/outbox-agent-a", "branch": "outbox/agent-a" },
    { "handle": "agent-b", "path": "/path/to/session/outbox-agent-b", "branch": "outbox/agent-b" }
  ]
}
```

Every other command reads `fleet.json` through `--root /path/to/session`. When
canonical holds a full repository rather than a bare instance, pass
`--instance-subdir .konspekt/instance` to the commands that write or read the
instance (`run-pass`, `bless`, `rebuild-index`).

## Step 2 — write the propose grants

A grant names which entity types a proposer may propose. Write a grants file
mapping each handle to its grant; a handle with no entry gets the default
(`concept`, `noteworthy`, `artifact`, `node`, `waypoint`).

```json
{
  "agent-a": { "entityTypes": ["concept", "noteworthy"] },
  "agent-b": { "entityTypes": ["artifact"] }
}
```

The grant is triage for accountability, not an enforcement boundary; keeping an
off-scope commit off canonical is the sandbox's and hooks' responsibility.

## Step 3 — a proposer authors and submits an atom

Each proposer runs `propose` against its own handle. It authors the atom in
stored form: `propose` writes `proposals/<id>/` onto the agent's outbox branch,
holding four files:

- `entity.md` — the konspekt atom: a ```yaml fence with `review: proposed` and a
  `provenance` block (the CLI fills `provenance` from the spec), then prose. The
  committer appends this file to canonical unchanged.
- `source.md` — the verbatim source excerpt the atom cites.
- `edges.md` — the edge rows that wire the atom into the graph.
- `meta.json` — the fleet envelope (origin, binding, depends_on, entity_type),
  which stays out of the stored atom.

`<id>` is the git blob SHA of the canonical `entity.md`, so the directory name,
the proposal id, and the atom's eventual file on canonical share one content
address.

Write a spec file describing the atom:

```json
{
  "entity_type": "concept",
  "fence": "id: concept-adoption-path\nlabel: adoption path\ncreatedAt: 2026-10-11T00:00:00Z\nupdatedAt: 2026-10-11T00:00:00Z",
  "prose": "# Concept: adoption path\n\nThe route a new adopter follows to stand up the fleet.",
  "confidence": 0.7,
  "session": "fleet-trial-1",
  "model": "claude-opus-4-8",
  "binding": "task-agent-fleet",
  "depends_on": [],
  "edges": [
    { "id": "e-mentions-adoption", "kind": "mentions", "from": "node:task-agent-fleet", "to": "concept:concept-adoption-path", "review": "proposed" }
  ]
}
```

Field notes:

- `fence` is the type-specific fence the proposer authors (id, the type's
  required fields, `createdAt`, `updatedAt`), without `review` or `provenance` —
  the CLI renders those. Point `fence_file` at a file instead of inlining.
- `prose` is the markdown body after the fence; `prose_file` is the file form.
- `confidence` (0..1) is the review-queue sort key; it is required.
- `binding` is the entity id this work binds to, or `none:<reason>` when it
  deliberately binds to nothing.
- `edges` wire the atom; a proposal must carry at least one edge that references
  the atom, or the committer sets it aside as unwired.

Submit it, naming the source excerpt file:

```
node ../app/cli.mjs propose \
  --root /path/to/session \
  --agent agent-a \
  --spec /path/to/spec.json \
  --source /path/to/source-excerpt.md \
  --name "Committer Name" --email committer@example.com
```

The command prints the proposal id and the commit it made on `outbox/agent-a`.
The proposal lands only on that agent's branch.

## Step 4 — dry-run verify

Before appending anything, read every outbox and print each proposal's verdict:

```
node ../app/cli.mjs run-pass \
  --root /path/to/session \
  --grants /path/to/grants.json \
  --dry-run
```

Each proposal is checked: the source excerpt hashes to the atom's
`provenance.contentHash`, the declared origin matches the outbox branch owner,
the entity type is within the agent's grant, `review` is `proposed`, confidence
is in range, binding is resolved, and `depends_on` resolves. A proposal that
fails any check is printed as `SET ASIDE` with reasons and is not appended.

## Step 5 — fold (append onto canonical)

Drop `--dry-run` to append the verified set onto canonical as `review: proposed`
in one commit:

```
node ../app/cli.mjs run-pass \
  --root /path/to/session \
  --grants /path/to/grants.json \
  --instance-subdir .konspekt/instance \
  --name "Committer Name" --email committer@example.com
```

For each verified proposal the committer writes `entity.md` to its place in the
instance, appends its edge rows, appends birth transition rows (recording the
proposing agent in the `by` column), writes the source excerpt under `sources/`,
and records the proposal-to-atom link in `.konspekt-fleet/folded.md`. The whole
batch is one commit, so canonical never lands partially wired. Omit
`--instance-subdir` when canonical is a bare instance.

## Step 6 — build the review queue

Regenerate the derived pending/accepted/rejected index from canonical:

```
node ../app/cli.mjs rebuild-index \
  --root /path/to/session \
  --instance-subdir .konspekt/instance
```

It prints each proposal's state and writes `.konspekt-fleet/proposed-index.json`.
The index is a projection of canonical's `review` fields; canonical is
authoritative, and the index is rebuildable, so losing it costs nothing.

## Step 7 — the human accepts or rejects

A person reads the queue and names the subset to admit. The committer executes
exactly that decision — it does not originate acceptance.

```
node ../app/cli.mjs bless \
  --root /path/to/session \
  --by <principal-id> \
  --accept <proposal-id-1>,<proposal-id-2> \
  --reject <proposal-id-3> --reason "out of scope" \
  --mode inspection \
  --instance-subdir .konspekt/instance \
  --name "Committer Name" --email committer@example.com
```

Each accepted proposal becomes one field-only commit that flips `review` to
`accepted` on the atom and its edges; each rejected proposal is flipped to
`rejected` with its reason. `--by` must be a principal that holds an accept grant
on the atom's scope. Rerun `rebuild-index` to see the queue follow.

Steps 3–7 repeat within a session. A proposer agent only ever runs step 3, only
on its own branch.

## Where state lives

- **canonical branch** — the graph: accepted, `proposed`, and `rejected` atoms.
  Authoritative.
- **`outbox/<handle>` branches** — each proposer's `proposals/<id>/` stored-form
  atoms.
- **`.konspekt-fleet/`** (gitignored) — `folded.md`, `decisions.md`, and the
  materialized index. Rebuildable from canonical; never committed.
- **`fleet.json`** (at `--root`) — the session manifest the CLI reads to attach.

## Tear down

Remove the proposer worktrees when the session ends; the canonical worktree and
its object store stay. Append any un-folded proposals onto canonical first, or
they are dropped with the worktree.

```
git -C /path/to/session/canonical worktree remove /path/to/session/outbox-agent-a
git -C /path/to/session/canonical worktree remove /path/to/session/outbox-agent-b
```

## Reference

- Commands and modules: `../app/README.md`.
- Fleet model and protocol: `../../../docs/design/fleet-spec.md` and
  `../../../docs/design/fleet-protocol.md`.
- The data model the atoms must satisfy: `../../../spec/data-model/SPEC.md` and
  `../../../spec/architecture/SERIALIZATION.md`.
