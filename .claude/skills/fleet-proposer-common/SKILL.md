---
name: fleet-proposer-common
description: >-
  Shared protocol for a konspekt fleet proposer agent (worktree-outbox cut).
  Loaded by the per-role proposer skills (fleet-presentation-writer,
  fleet-spec-writer, fleet-skill-builder). Not vendor-specific; it lives under
  .claude/skills for now and moves to a neutral location per
  task-vendor-neutral-interop.
---

# Fleet proposer — common protocol

You are one **proposer** in a konspekt agent fleet (`docs/design/fleet-spec.md`).
N proposers and one committer share one object store as N+1 git worktrees: you
have your own worktree on your own **outbox branch**; the committer holds
**canonical**. You read canonical and write only your own outbox. You never
write canonical and never touch a peer's branch.

Your per-role skill names your handle and what kind of atom you propose. This
file is the protocol all roles share.

## Inputs the invocation gives you

- `FLEET_ROOT` — the fleet root (holds `canonical/` and `outbox-<handle>/`).
- `CANONICAL` — `FLEET_ROOT/canonical`, a konspekt instance you read.
- `HANDLE` — your agent handle; it equals your outbox branch owner.
- `APP` — the committer app dir holding `cli.mjs`
  (`implementations/fleet/worktree/app`).
- `AUTHORING` — a scratch dir you own; author your files here, NOT in the
  worktree (so the commit stages only your proposal).

## The one job: propose exactly one atom

1. **Read canonical, read-only.** Skim `CANONICAL/project.md` and the relevant
   `CANONICAL/nodes/`, `concepts/`, `artifacts/`. Understand what exists before
   adding to it.
2. **Bind to an accepted entity.** Pick an entity that is `review: accepted`
   (`grep -rl "review: accepted" CANONICAL/nodes`) that your atom serves; its id
   is your `binding` and usually the `from` of your wiring edge. If nothing fits,
   use `none:<short-reason>` — an honest recorded decision not to bind.
3. **Author the entity body** (`AUTHORING/body.md`) in konspekt's **stored**
   format: a ```yaml fence, then prose.
   - The fence carries the entity's own fields: `id` (with the right prefix for
     its type — see your role skill), the type's required fields, `createdAt`,
     `updatedAt`.
   - **Do NOT put `review:` or `provenance:` in the fence.** The committer owns
     those and injects them at fold; if you write them they are stripped.
   - After the closing fence, write a short prose body (`# <Type>: <name>` then a
     paragraph). No edges block in `body.md`.
4. **Author the source excerpt** (`AUTHORING/source.md`): a short verbatim
   excerpt that justifies the atom. It is content-addressed; the committer writes
   it to `sources/<sha>.md`.
5. **Author the spec** (`AUTHORING/spec.json`):
   ```json
   {
     "entity_type": "<Concept|Noteworthy|Artifact|...>",
     "confidence": 0.0,
     "binding": "<accepted-node-id or none:<reason>>",
     "model": "<your model id>",
     "session": "<fleet session id>",
     "body_file": "body.md",
     "edges": [
       { "id": "e-<short>", "kind": "<kind>", "from": "<type:id>", "to": "<type:id>", "review": "proposed" }
     ]
   }
   ```
   `confidence` is your honest self-estimate in [0,1] — it is the review-queue
   sort key, so do not inflate it. Every atom must land **wired**: include at
   least one edge whose endpoint is your entity, with a valid domain/range and a
   unique, hyphenated edge id, `review: proposed`.
6. **Commit to your outbox** via the committer CLI:
   ```
   node "APP/cli.mjs" propose --root "FLEET_ROOT" --agent "HANDLE" \
     --spec "AUTHORING/spec.json" --source "AUTHORING/source.md" \
     --name "HANDLE" --email "HANDLE@fleet.local"
   ```
   Fix any CLI error and retry until it prints `proposed <id> by HANDLE`.
7. **Report** your atom id, the accepted node you bound to, your confidence, and
   the proposal id the CLI printed.

## Edge domain/range (core kinds)

| kind | from → to |
|------|-----------|
| `produces` | node → artifact |
| `mentions` | node → concept |
| `relates` | concept → concept |
| `notes` | node → noteworthy |
| `decomposes` | node → node |

## Id prefixes

`concept-` concept · `nw-` noteworthy · `artifact-` artifact · `wp-` waypoint ·
node ids live under `nodes/<type>/` and carry no fixed prefix.

## Hard rules

- Atoms you propose are always `atom_state: proposed`. Agents propose; humans
  accept. Never propose `accepted`.
- Write only under `AUTHORING` and your own outbox (through the CLI). Never edit
  `CANONICAL` or another proposer's worktree.
- One atom per invocation unless told otherwise.
