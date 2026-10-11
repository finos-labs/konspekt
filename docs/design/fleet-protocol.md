# Fleet as protocol: roles and verbs

Status: design (non-normative), draft. `spec/` governs on any conflict. This
document records the protocol vocabulary for the fleet under
`wp-adr-fleet-agentic-committer`: N agents following a protocol, where roles are
personas, flow is verbs, and rules are the authority grants
(`.konspekt/instance/authority/grants.md`). It is the working surface for
settling that vocabulary; cells marked **open** are not yet settled.

The ADR minimizes the committer's JavaScript machinery in favor of agentic
communication and permits the committer to be an agent that executes writes
under human-authorized acceptance. It supersedes `nw-fleet-committer-role-split`,
so the "deterministic writer plus LLM review assistant" split in
`docs/design/fleet-spec.md` § Model is superseded and that document needs a
follow-up edit. There is one fleet model at the konspekt level; how the git store
is laid out — N+1 worktrees in one repository, N separate local repositories, or
protected remote outbox namespaces — is a binding concern below the standard and
is not a konspekt-level mode (`nw-fleet-git-topology-below-standard`,
`nw-fleet-committer-ingest-contract`).

## Agent roles

A role is a persona a principal holds (`.konspekt/instance/authority/principals.md`).
One principal may hold several roles; in this instance `denisurusov` (human) is
both acceptor and grantor, and `claude` (agent) is proposer and may be committer.

| Role | Principal kind | Holds acceptance authority | Responsibility |
|------|----------------|----------------------------|----------------|
| proposer | agent | no | Ventures atoms into the working copy as `review: proposed`; never writes an acceptance. |
| committer | agent | no | Reads proposals, verifies them against the record, performs the byte-exact write onto canonical, and executes a human-authorized acceptance. Decides nothing that lands. |
| acceptor | human | yes | Holds a grant on the scope; issues `accept` / `reject`. The only role that authorizes durable acceptance. |
| grantor | human | n/a (issues authority) | Issues and revokes grants in `authority/grants.md`. |

## Verbs

Columns: **disposition** (alias of an existing verb, new, or dropped), **issuer**
(role plus grant scope), **record effect** (what it reads and writes, and the
deterministic tool that implements the write), **notes / overlap**.

Existing vocabulary the protocol sits alongside: checkpoint verbs `load`, `sync`,
`persist`, `sync_persist` (`spec/architecture/TRANSPORT.md`) and authority verbs
`pin`, `validate`, `refute`, `resolve`, `abandon`, `lift`
(`spec/data-model/SPEC.md` § Human vocabulary).

| Verb | Disposition | Issuer | Record effect | Notes / overlap |
|------|-------------|--------|---------------|-----------------|
| propose | alias of `sync` (into the working copy) | proposer (agent) | Writes a new atom and its edges with `review: proposed`; hashes the source excerpt, appends the atom file and the `edges.md` rows, appends birth rows to `transitions.md`. Grow-only, append-only. | Distinct from `persist`, which writes durably to the store. |
| claim | convention over a `status` transition | proposer (agent) | Proposes `status: open → active` on the worked node; the acting agent is carried in `provenance.origin.agent` and the transition `by`. Advisory, non-locking, grow-only; visible to peers after the next committer pass. | No new type and no new primitive — a claim is an existing node in the `active` state, attributed to an agent. `fleet-spec.md` § Claims behavior preserved. |
| release | the existing `resolve` / `abandon` vocabulary | proposer proposes; acceptor confirms | Proposes `status: active → resolved` (finished) or `active → abandoned` on the worked node. | Closes the `active` state a `claim` opened; reuses the existing status vocabulary. |
| fold | committer verb-implementation (verify + append), not a human verb | committer (agent) | Verifies a stored-form proposal against the record, then appends it onto canonical as `review: proposed` (byte-exact append). Writes no acceptance. | Proposers author stored-form atoms directly; the payload-to-stored-form translation is removed (`nw-fleet-remove-fold-translation`), so `fold` is verify + append, not a translation. |
| accept | alias of the existing human acceptance | acceptor (human, grant on scope) | Flips `review` `proposed` → `accepted`; appends a transition row with `by` = acceptor and the acceptance `source`; byte-exact `review`-field flip. | The acceptance in `spec/architecture/REVIEW.md`; fixed human by the ADR. |
| reject | alias of reject-as-tombstone | acceptor (human, grant on scope) | Flips `review` → `rejected` (retained tombstone); appends a transition row with a reason. | `spec/architecture/REVIEW.md` reject-as-tombstone; proposer withdrawal is `nw-fleet-retraction-is-rejection`. |

## Interaction: a proposer suggests a new concept

Actors: a **proposer** agent, a **committer** agent, and the **human acceptor**.
The committer is an agent; it verifies and writes, and executes acceptance only
on the human's authorization (`wp-adr-fleet-agentic-committer`).

1. **Proposer — judge readiness.** The proposer decides a concept has
   crystallized and should be a `concept` atom.
2. **Proposer — author stored form.** It writes the Concept atom with
   `review: proposed` and a content-addressed source excerpt
   (`sources/<hash>.md`, `git hash-object`), citing the hash from the atom.
   (`propose`)
3. **Proposer — hand off.** Worktree mode: commit the atom onto its outbox
   branch, then call the committer with a pointer, the content hash
   (`nw-fleet-commit-then-call`). Pure agentic mode: send the payload in the
   call. Either way the call carries a pointer or payload, never authority.
4. **Committer — verify.** Fetch the bytes from the trusted store and run the
   record-level checks: the `git hash-object` source probe, the
   `lib/conformance.mjs` schema check, the binding check, and the
   origin/branch-owner anti-spoof. A failed check sets the proposal aside with
   reasons and writes nothing.
5. **Committer — fold.** If verified, append the Concept onto canonical as
   `review: proposed` in one commit and refresh the derived index. No acceptance
   yet; the concept is now visible to peers and sits in the human's review queue.
   (`fold`)
6. **Human — review.** The human reads the queue. The committer agent may
   cluster, summarize, and surface near-duplicate or dependency hints — read-side
   assistance with no write authority.
7. **Human — authorize.** The human issues `accept` (or `reject`).
8. **Committer — execute.** On `accept`, the committer performs the byte-exact
   `review` flip `proposed → accepted` and appends a transition row with `by` =
   the human acceptor and the acceptance `source`, in one field-only commit
   (`nw-fleet-canonical-authoritative`). On `reject`, it writes a
   `review: rejected` tombstone with a reason. (`accept` / `reject`)
9. **Persist.** The accepted state is written to the store (`persist`).

```
proposer                 committer (agent)              human (acceptor)
  | author concept          |                                |
  | (review: proposed)      |                                |
  |----- propose ---------->|                                |
  |  commit-then-call        | verify: hash, conformance,    |
  |  (pointer)               |         binding, anti-spoof   |
  |                          | fold -> canonical (proposed)  |
  |                          |------- into review queue ---->|
  |                          |                                | review
  |                          |<------------ accept -----------|
  |                          | review flip proposed->accepted |
  |                          | (by: human, one commit)        |
  |                          |-------- persist to store ----->|
```

## Settled

1. **Status write rule.** Agents propose `status` transitions on their own,
   written `review: proposed`; a human accepts. No work-commit binds to a node
   until it is accepted (`basis: accepted`, already enforced by `lib/validate.mjs`,
   `tools/binding-audit.mjs`, and `.claude/hooks/require-binding.sh`). `claim` and
   `release` carry no special write rule — they follow the standard
   propose/accept boundary (`concept-propose-accept-separation`). The "new claim
   type" option is dropped: a claim is a node in the `active` state attributed to
   an agent.
2. **`fold` removal.** Proposers author stored-form atoms directly; the
   payload-to-stored-form translation (`fold.mjs` and the payload schema in
   `outbox.mjs`) is removed (`nw-fleet-remove-fold-translation`). The committer
   keeps verify-and-append.

## Remaining implementation work

Module disposition follows from the above and is follow-on work under
`task-agent-fleet`:

- `fold.mjs` and the payload-format parts of `outbox.mjs` — removed.
- `worktrees.mjs` — topology-specific (the single-repo-worktree realization of the
  outbox boundary); kept for that topology, not part of the konspekt-level model.
- The byte-exact and check modules (`verify.mjs`, `git.mjs`, `bless.mjs`,
  hashing in `payload.mjs`, `lib/conformance.mjs`, `tools/binding-audit.mjs`) —
  stay as verb-implementations the committer calls.
- `cli.mjs` dispatch and the `committer.mjs` orchestration loops — become agentic
  protocol.
