# Fleet mode: git implementation spec

Status: design (non-normative). `spec/` governs on any conflict. The git-binding
vocabulary this document introduces — `outbox`, the `proposed` ref, grant, branch
owner — stays in `docs/design/` and must not enter `spec/data-model` or
`spec/architecture`; the standard's unit remains a directory of markdown with a
`review` field per atom.

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

Canonical carries folded proposals marked `review: proposed` alongside accepted
atoms, so a proposer's sibling-directory read gives it the accepted graph plus
every peer proposal and claim folded so far. Visibility is bounded by the fold
lag: a proposer sees a peer's claim only after the next committer pass, never at
the moment of the peer's outbox commit. Collisions inside one pass stay tolerated
(see Claims); folding a proposal onto canonical makes it visible to peers before
a human accepts it, and does not make claims synchronous.

The committer is two roles kept apart:

- A **deterministic writer** (no model): verifies, orders, and folds each
  verified proposal onto canonical as `review: proposed`, indexing it on a
  durable `proposed` ref; on human approval it blesses the admitted atom in place
  (flips `review` to `accepted` and appends the accept record) under the push
  discipline (hash-object verify, atomic append, DCO trailer, post-write SHA
  recheck).
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
provenance:
  confidence: <0..1>       # self-reported; mandatory — the REVIEW.md review-sort key
binding: <node-id | none:<recorded-reason>>   # a resolved entity binding, or a recorded decision not to bind (BINDING.md)
source:
  hash: <git blob SHA of source.md>   # git hash-object, matching SERIALIZATION.md's verify probe
  path: sources/<hash>.md  # canonical filename the committer writes on accept
claim:                     # present only when kind: claim
  region: <roadmap item or node id the agent is working>
created: <iso8601>
---
```

The body is the proposed entity in konspekt's node format, followed by an edges
block listing the proposed rows exactly as they will land in `edges.md`. The
`provenance.confidence` and `binding` values above ride with the entity: the
writer folds them into the node, so a folded atom is a legal atom from the moment
it lands.

Two integrity properties come from the layout:

- **Origin cannot be spoofed.** An agent writes only to its own outbox branch,
  so the committer maps branch to agent and rejects any payload whose
  `origin.agent` disagrees with the branch owner.
- **Scope is checked, not trusted.** The committer verifies `(entity_type,
  atom_state)` against the agent's grant and sets aside anything out of scope
  with a reason. This is client-side; the store is never gated. The check is
  triage for accountability, not an enforcement boundary: keeping an off-scope or
  spoofed commit off canonical is the sandbox and hooks' job (out of konspekt's
  scope), so no reader treats the committer as a security control.

Source addressing for the v1 fleet binding is the **git blob SHA of the verbatim
excerpt** (`git hash-object`), carried in the payload and mapped to
`sources/<hash>.md` on accept. This matches `SERIALIZATION.md`'s verify probe and
the addressing the rest of the store already uses, so the fleet path adds no
second content-address to v1. The SHA-256-over-excerpt migration
(`task-sources-sha256-migration`) proceeds on its own track and flips the fleet
path when it lands store-wide.

## Committer protocol

A deterministic loop over the N outbox branches, one pass in flight at a time.

1. **Read.** Fetch new proposal commits per outbox branch since the last
   processed sequence.
2. **Verify.** Per proposal: recompute `proposal_id` and source hash, confirm
   `origin.agent` equals the branch owner, confirm scope is within grant, confirm
   the entity carries a `provenance.confidence` value and a resolved `binding` (or
   a recorded decision not to bind), and resolve `depends_on`. A proposal that
   fails any check is set aside with a reason and kept for the record, so a
   malformed atom never folds onto canonical.
3. **Order.** Two orderings, kept separate. *Fold order* is arrival order across
   branches; `depends_on` does not gate the fold, because the store is grow-only
   and persist never waits on review. *Bless order* holds a proposal back from
   acceptance while any id in its `depends_on` is still `proposed` or `rejected`.
   Presentation may cluster a dependent under its premises, which is a review-UI
   concern and not a property of the store.
4. **Fold.** Fold every verified proposal onto canonical as `review: proposed` in
   one commit — source excerpt, entity file, and edge rows carrying the per-row
   `review` override. **Canonical is authoritative for proposal state.** The
   durable `proposed` ref is a derived index (pending / accepted / rejected, with
   canonical-commit pointers) that the writer may rebuild by scanning `review`
   fields and accept records; it survives an agent's worktree teardown and keeps
   the review queue cheap to read. Because canonical holds the payload, a crash
   between the fold commit and a `proposed`-ref update cannot make the store lie:
   the ref is refreshed from canonical, and canonical is never refreshed from the
   ref.
5. **Present.** The review assistant reads the folded proposals (through the
   `proposed` index), clusters and summarizes, and puts the question to the
   human: these proposals, which to admit. It holds no write authority to
   canonical.
6. **Accept.** The human names the subset to admit, per proposal, marking
   whether the decision was by inspection or by batch. That selection, carrying
   the human `Signed-off-by`, is the accept instruction.
7. **Bless.** For each admitted proposal, one atomic **field-only** commit on the
   already-folded atom: flip `review` from `proposed` to `accepted` on the entity
   frontmatter and the atom's `edges.md` rows, and append an accept record tying
   `proposal_id` to acceptor, timestamp, and inspection-or-batch. Pre-write
   `hash-object` verify, post-write SHA recheck, DCO trailer. The source excerpt
   and entity already landed at fold, so bless re-copies no source and re-authors
   no prose — it changes the `review` field and appends the accept record. The
   atom was wired whole at fold, so canonical never lands partially wired.
8. **Record.** Update the derived `proposed` index: each admitted proposal is
   **accepted** with a pointer to its bless commit, a decided no is **rejected**,
   and the rest stay **pending**. A rejection also marks the folded atom
   `review: rejected` on canonical — a tombstone retained with its reason,
   consistent with the grow-only store and `REVIEW.md`'s reject-as-tombstone.
   Nothing is erased.

## Proposal state and reader filtering

Proposal state lives on canonical in each atom's `review` field; the `proposed`
index mirrors it for the queue:

- **accepted** — blessed on canonical; the index carries a pointer to the bless commit.
- **rejected** — a decided no, kept on canonical as a `review: rejected` tombstone
  with its reason and mirrored in the index for audit.
- **pending** — folded as `review: proposed`, not yet dispositioned.

Because canonical now carries `proposed` and `rejected` atoms, a reader filters on
`review`: default views show `accepted` (and `proposed` where a view wants pending
work) and omit `review: rejected`, the same way current-item views already drop
superseded nodes (`REVIEW.md`). Without that filter a tombstone renders as a live
node in the shipped tree-readers (implementation-zero, the IntelliJ plugin).

The accept record from step 7 is goal-accountability's responsibility report as
a standing output: for any accepted atom, which agent proposed it, who accepted,
when, and at what resolution.

## Claims

Dispatch is advisory. An agent writes a grow-only **claim** atom that it is
working a region, through the committer like any other proposal. Once the
committer folds it onto canonical as `review: proposed`, peers see it on their
next read of canonical — bounded by the fold lag, so a collision inside a single
committer pass is still possible and still tolerated, resolved by the acceptor or
by agents reading each other's claims. A finished or abandoned claim is closed by
a **claim-release** proposal referencing the claim. No new primitive, no
adjudicating server.

## Scope of this cut

In scope: the proposer path (origin plus serialized append), fold-to-canonical
with the derived `proposed` index, per-proposal admission, and advisory claims as
thin conventions.

Out of scope: per-agent-branch parallel commit (deferred until a measured
throughput reason); delegated machine acceptance (downstream of persona-signing);
code-change integration across agents (a separate track); the `edges.md`
traversal shard (`task-edge-traversal-layout`, decoupled from fleet concurrency).
