# spec / architecture

How state *moves and stays true* — the machinery around the data model.

- `RECONCILIATION.md` — merging a fresh extraction into an existing instance: resolution ladder, derived alias index, idempotence, status transitions, supersession.
- `SERIALIZATION.md` — the v1 human-readable on-disk form.
- `TRANSPORT.md` — the interface a durable store must satisfy: neutral, public read/write over the markdown instance; the checkpoint verb family (`sync` reconciles into the working copy, `persist` flushes to the store, `sync_persist` does both; read/`load` is a trivial precondition excluded from the family); GitHub as the reference binding; review carried in the conversation, so no pull requests in the default flow.
- `REVIEW.md` — the human-in-the-loop gate: the maintainer only ever writes `proposed` and acceptance is exclusively human; `provenance.confidence` triages attention only (sorts the diff, never accepts); review is batched at the persist checkpoint; proposals persist as `proposed`, so review never blocks persist.
- `BINDING.md` — provenance completeness (the fifth invariant): every proposed atom resolves to an entity binding or a recorded non-binding, enforced at extraction the way confidence is (never a persist gate), framed as referential integrity so it stays clear of acceptance judgment; the `binding: required | optional` per-instance policy. The behavior that satisfies it — how and when the human is asked which entity a conversation attaches to — is host policy, out of scope.

**Out of scope by design: triggers.** *When* a pass fires (per-turn, end-of-session, manual) is host policy, not standard — host discretion, with no designated home in the standard. The spec owns only the invariant that makes firing safe (idempotence), never the firing itself. The trigger is just a binding from an event to one of the verbs above, and that binding moves with the ingestion mode — which is exactly why it cannot be spec.
