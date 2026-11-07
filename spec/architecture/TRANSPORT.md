# konspekt — transport (spec)

The interface a durable store must satisfy to hold a konspekt instance, and the bindings that implement it. Reconciliation settles *how* a pass stays correct; serialization settles *what* lands on disk; transport settles *where* the instance lives and *how* a conversation reads it in and writes it back — the half of the operating loop that lets state outlive a single conversation.

Triggers — *when* a pass fires — are deliberately absent. Once re-runs are no-ops (see `RECONCILIATION.md`), firing is host policy, not standard — host discretion, with no designated home in the standard. This document specifies the store, not the schedule.

## The contract

A konspekt instance is a directory of human-readable markdown (`SERIALIZATION.md`). A transport is any store that can hold that directory and hand it back. The contract is deliberately dumber than the orchestration vocabulary that sits on top of it: two operations.

- **read** — pull the current instance (or a subtree) out of the store.
- **write** — put a set of changed files back, producing a new durable version.

That is all. Versioning (each write yields a recoverable prior state) and neutral, public access (below) are required; branching, locking, and merge are not — the model leans on none of them.

### The orchestration verbs map onto read/write

The operating loop's orchestration vocabulary — `sync`, `persist`, `sync_persist`, the `load` precondition, and `checkpoint` / `resume` — is *orchestration* over the two store operations, not part of the store contract:

| verb | store op | touches |
|------|----------|---------|
| `load` | read | pulls the durable instance into the working copy |
| `sync` | — | reconciles incoming atoms into the **working copy** only; no store op |
| `persist` | write | flushes the working copy to the store |
| `sync_persist` | write | `sync` then `persist`, as one durable step |
| `checkpoint` | write | appends one row to `checkpoints/checkpoints.md` and its `sources/` excerpt |
| `resume` | read | reads the last checkpoint row and its excerpt |

So the store only ever sees `read` and `write`. A binding implements *those two*; the verbs are identical everywhere because they are defined above the binding. This is why `sync` needs no store at all — it is pure working-copy reconciliation, which is why it was excluded from the durable family.

### Checkpoint and resume

A conversation holds state the graph does not: the entity it is bound to, proposals it has discussed and not persisted, and open items that never became atoms. `checkpoint` and `resume` carry that state to a later conversation, whether it runs the next day, on a different LLM, or through a different venue for the same LLM. Both work through the store's `read` and `write`, so any conforming binding supports them, and the record is in the instance, where a different vendor's conversation can read it.

- **`checkpoint`** is issued by a human. The maintainer writes one row to `checkpoints/checkpoints.md` and one `sources/` excerpt, in the same write (`SERIALIZATION.md` § Checkpoints). The row names the active entity. The excerpt holds, verbatim, the human's command, each binding switch made in the conversation, each pending proposal, and the open-items list as last presented. The maintainer does not issue `checkpoint` on its own judgment and does not paraphrase the items into atoms.
- **`resume`** is a read at conversation open, after `load`. The maintainer reads the last row and its excerpt, offers the row's entity as the default answer to the binding ask (`BINDING.md`), and lists the excerpt's open items, giving the current `review` and `status` of each id the excerpt names. The human confirms the binding as usual. A checkpoint never binds a conversation by itself, and an instance's binding policy applies unchanged.

A pending proposal recorded in a checkpoint is still only a proposal. Resuming does not persist it; the next conversation proposes it again if it still applies.

## Conformance

A binding conforms **iff** it offers neutral, public read and write over the instance directory. This is a requirement, not an aspiration, and it is what makes the standard's portability claim hold regardless of who implements a binding.

- **Neutral** — the instance is the agreed markdown serialization, not a vendor-internal representation. What you read is what another binding can write.
- **Public** — read and write are reachable by something other than the vendor's own surface: an API, a file export, a git remote — any interface a second tool can drive.

**Manual re-upload is the conformance probe.** If a human can round-trip the instance by export-and-paste — pull it out of binding A, hand it to binding B, and have B read it — the interface is public and neutral enough. If they cannot, the binding has defected from the portability goal, however slick its native UX. Manual re-upload is therefore not a fallback tier; it is the test every fancier binding must pass.

This converts the lock-in worry into one testable line. A binding that materializes state but exposes no neutral public read/write simply is not a konspekt transport. What remains is **soft gravity** — state has inertia wherever it is materialized — but with one-click export that is friction, not capture, and the spec spends no further ink on it.

## Review lives in the conversation

Persisting is not accepting. The store is dumb: `persist` writes whatever review state the working copy holds. Acceptance of a maintainer's proposal happens **in the conversation**, before persist, via the human vocabulary (`../data-model/SPEC.md`) — a human-issued verb carries its own acceptance, so the entity is already `review: accepted` by the time it is written.

This is the whole reason the transport can stay a versioned blob store with no review machinery: review is a *data-level* property (`review: proposed → accepted`) carried by the entity, asserted where the human is already working, identical on every binding. The transport never needs to know it happened.

Two consequences worth stating:

- **No pull requests in the reference flow.** A PR is a review surface bolted onto the transport; using it forces the human out of the conversation and into the store's UI to accept. Auto-merging the PR to avoid that just deletes the review gate while keeping the ceremony — which is write-to-main wearing a costume. So the GitHub binding writes to `main` directly. Writing accepted state to main is contract-legal, not a shortcut: the review gate already happened, carried by human authority, not by a branch.
- **Synchronous review needs no extra verbs.** When the human is in the loop — accept in chat, `persist` writes accepted state — plain prose acceptance desugars to `review: accepted`, and the status verbs (`validate`, `resolve`, …) already carry acceptance for entities that have a status axis. Nothing is missing for v1.

## Reference binding: GitHub

The v1 reference binding is a GitHub repository.

- **read** = read file / tree contents; **write** = commit a set of files.
- **Versioning** is native (commit history); recovery is `git` revert / checkout.
- **Neutral & public**: raw markdown over a URL any tool can fetch; write over the git remote or API. Passes the manual-re-upload probe trivially — the files *are* the instance.

GitHub is chosen as reference precisely because it is **not a moat**: every engineer reads it, it is vendor-neutral, and "we used a git repo" is impossible to mistake for defensibility. The reference exists to be *out-implemented* — its job is to prove the contract is real and hand a second implementer something concrete to conform to or copy. That is the success condition (legible over defensible), not a thing to protect.

Today the maintenance *runtime* for this binding is whatever conversation holds the store's credentials (in practice: a human driving an LLM with a GitHub connector). That is a property of where we are, not of the binding — see the trajectory below.

## Binding trajectory

The three architectures on the table are not three transports; they are **one contract with three bindings**, differing on a single axis: *where the durable store and the maintenance runtime live.*

| binding | store + runtime | status |
|---------|-----------------|--------|
| **GitHub** | neutral git store; runtime is the conversation holding credentials | v1 reference |
| **Vendor-baked** | both inside each gen-AI platform | the best outcome; not yet real |
| **Connector + central service** | a dedicated konspekt host the platforms call | plausible alternative |

Starting with GitHub forecloses none of them, because v1 specs the *contract*, not the vendor. The contract is the invariant; only the binding moves.

**Vendor-baked is the best outcome — and the one that most needs the conformance clause.** Native maintenance as you talk is unbeatable for *follow-the-thread*. But for *port-across-platforms* it is neutral-to-dangerous: if each vendor bakes in a private store with no neutral public read, lock-in simply moves up a level, from "my chat history" to "my baked-in konspekt." The conformance clause is exactly what disarms this — a baked-in store that does not expose neutral public read/write is not a conformant binding, by definition. The dream is safe **iff** every vendor binding still round-trips through the probe.

## Asynchronous review (future projection)

Everything above assumes **synchronous** review: the human is present, accepts in conversation, `persist` writes accepted state. A future binding may run a pass **unattended** — extract, reconcile, write a pile of `review: proposed` entries — and have a human clear that queue *later*. This is where the deferred machinery lives, none of it part of v1.

- **A review surface** — a queue, a dashboard, or (on GitHub) a pull request — is the natural projection of the proposed/accepted gate *when review is out-of-band*. PRs were demoted from the synchronous flow precisely here: they earn their keep only when no human is in the conversation to accept.
- **`accept` / `reject` verbs.** Clearing an async queue is mostly bare accept/reject over **statusless** entities (a concept, a fact, an edge — things with no `validate` / `resolve` to carry acceptance). v1 covers these in prose; an async binding needs first-class verbs.
  - `accept <ref>` → `review: accepted`.
  - `reject <ref>` → `review: rejected` — a **tombstone, not a delete**: the entity stays in the graph (append over rewrite) so the maintainer does not re-propose it next pass.
  - **Warning for whoever builds this: `reject` ≠ `refute` / `abandon`.** `refute` and `abandon` act on the **status** axis — the claim is *in* the graph and judged false or dead. `reject` acts on the **review** axis — the extraction was an *error*; there is no such claim. Collapsing them folds "this is wrong" (domain) into "you misread the conversation" (extraction) and loses a distinction the maintainer cannot recover from prose. Keep the axes separate.

These ship only if and when an async binding is built. v1 is synchronous, prose-accept, write-to-main.
