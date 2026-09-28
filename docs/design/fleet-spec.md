# Fleet mode: git implementation spec

Status: design (non-normative). `spec/` governs on any conflict.

This document specifies the first git implementation of a fleet of agents
proposing into one konspekt instance under a single human reviewer
(`task-agent-fleet`). It records the decisions taken in conversation
`fleet-implementation` and the two artifacts everything else binds to: the
proposal payload schema and the committer protocol.

## Model

N proposer agents and one committer, arranged as **N+1 worktrees off one object
store**. Each proposer agent has its own worktree on its own **outbox branch**.
The committer has its own worktree holding the **canonical branch**. A linked
git worktree binds to one branch, so one worktree per agent is one outbox branch
per agent by construction.

Proposer agents **never write canonical**. They read canonical (a local
sibling-directory read on the same machine) and commit proposals into their own
outbox. Sync is one-directional: outbox to committer to canonical. There is one
graph and no per-agent local graph to reconcile.

The committer is two roles kept apart:

- A **deterministic writer** (no model): verifies, orders, folds proposals into
  a durable `proposed` ref, and on human approval writes admitted atoms to
  canonical under the push discipline (hash-object verify, atomic append, DCO
  trailer, post-write SHA recheck).
- An **LLM review assistant** (no write authority to canonical): reads the
  queue, clusters and summarizes, surfaces dependency and near-duplicate hints,
  and relays the human's per-proposal selection to the writer.

The single human acceptor is unchanged. The assistant asks; the human's answer
is the accept; the deterministic writer executes only the named subset.

## Runtime substrate

The fleet is designed to run inside an egress sandbox with the **committer host
as the single declared egress**. Agents make suggestions to the committer host
rather than pushing to a git remote, so the egress surface is one narrow
expected destination. The committer host is declared as expected egress so a
fleet detector does not flag normal coordination. Sandbox and egress enforcement
are out of konspekt's scope; konspekt supplies the accountable payload on that
egress.

## Proposal payload schema

One proposal is one directory on the agent's outbox branch:

```
proposals/<proposal-id>/
  proposal.md      # frontmatter + proposed entity body + proposed edge rows
  source.md        # verbatim excerpt, content-addressed
```

`proposal.md` frontmatter:

```yaml
---
proposal_id: <hash over the canonicalized proposal>
kind: entity | edge | claim
origin:
  agent: <handle>          # verified against the outbox branch owner
  model: <model id>
  session: <fleet session id>
scope:
  entity_type: Concept | Noteworthy | Artifact
  atom_state: proposed
target:
  node: <node-id | new>    # what this wires into
depends_on: [<proposal-id>, ...]   # premises that may still be un-accepted
source:
  hash: <SHA-256 over source.md>
  path: sources/<hash>.md  # canonical filename the committer writes on accept
claim:                     # present only when kind: claim
  region: <roadmap item or node id the agent is working>
created: <iso8601>
---
```

The body is the proposed entity in konspekt's node format, followed by an edges
block listing the proposed rows exactly as they will land in `edges.md`.

Two integrity properties come from the layout:

- **Origin cannot be spoofed.** An agent writes only to its own outbox branch,
  so the committer maps branch to agent and rejects any payload whose
  `origin.agent` disagrees with the branch owner.
- **Scope is checked, not trusted.** The committer verifies `(entity_type,
  atom_state)` against the agent's grant and sets aside anything out of scope
  with a reason. This is client-side; the store is never gated.

Source addressing is **SHA-256 over the verbatim excerpt**, carried in the
payload. The committer maps it to `sources/<hash>.md` on accept. This applies to
new proposals; existing git-blob-SHA sources migrate separately
(`task-sources-sha256-migration`).

## Committer protocol

A deterministic loop over the N outbox branches, one pass in flight at a time.

1. **Read.** Fetch new proposal commits per outbox branch since the last
   processed sequence.
2. **Verify.** Per proposal: recompute `proposal_id` and source hash, confirm
   `origin.agent` equals the branch owner, confirm scope is within grant,
   resolve `depends_on`. A proposal that fails any check is set aside with a
   reason and kept for the record.
3. **Order.** Arrival order across branches, adjusted so no proposal is
   presented before the proposals in its `depends_on`. Presentation order only;
   the store stays grow-only.
4. **Fold.** Append every verified proposal to a durable `proposed` ref. This is
   the durable record: proposals survive their agent's worktree teardown, and
   un-accepted ones stay visible.
5. **Present.** The review assistant reads the `proposed` ref, clusters and
   summarizes, and puts the question to the human: these proposals, which to
   admit. It holds no write authority to canonical.
6. **Accept.** The human names the subset to admit, per proposal, marking
   whether the decision was by inspection or by batch. That selection, carrying
   the human `Signed-off-by`, is the accept instruction.
7. **Append.** For each admitted proposal, one atomic commit to canonical:
   `source.md` to `sources/<hash>.md`, the entity file, the edge rows into
   `edges.md`, and an accept record tying `proposal_id` to acceptor, timestamp,
   and inspection-or-batch. Pre-write `hash-object` verify, post-write SHA
   recheck, DCO trailer. Entity, edges, and source in one commit, so canonical
   never lands partially wired.
8. **Record.** On the `proposed` ref, mark each admitted proposal **accepted**
   with a pointer to its canonical commit, mark a decided no **rejected** with a
   reason, and leave the rest **pending**. Nothing is erased.

## Proposal states on the proposed ref

- **accepted** — written to canonical; carries a pointer to the canonical commit.
- **rejected** — a decided no, retained with a reason; pushed later in the cycle
  and available for audit.
- **pending** — not yet reached.

The accept record from step 7 is goal-accountability's responsibility report as
a standing output: for any accepted atom, which agent proposed it, who accepted,
when, and at what resolution.

## Claims

Dispatch is advisory. An agent writes a grow-only **claim** atom that it is
working a region, through the committer like any other proposal. Other agents
read it; collisions are tolerated and resolved by the acceptor or by agents
reading each other's claims. A finished or abandoned claim is closed by a
**claim-release** proposal referencing the claim. No new primitive, no
adjudicating server.

## Scope of this cut

In scope: the proposer path (origin plus serialized append), the durable
`proposed` ref, per-proposal admission, and advisory claims as thin conventions.

Out of scope: per-agent-branch parallel commit (deferred until a measured
throughput reason); delegated machine acceptance (downstream of persona-signing);
code-change integration across agents (a separate track); the `edges.md`
traversal shard (`task-edge-traversal-layout`, decoupled from fleet concurrency).
