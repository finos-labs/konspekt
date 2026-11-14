```yaml
id: nw-webmobile-seed-is-pointer-not-payload
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;_qdwkMYV0_EeIfPD2qrMsiH8GiNJgn-n3TPoYGDtlC4
  timestamp: 2026-06-23T20:00:00Z
  conversationId: skills-adoption-review
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 7f02c2ff4543971f29c6e7298876cc4f6caaf899
    contentHash: 7f02c2ff4543971f29c6e7298876cc4f6caaf899
createdAt: 2026-06-23T20:00:00Z
updatedAt: 2026-06-23T20:00:00Z
```
# Noteworthy: web/mobile bootstrap is a pointer, not a payload

Seeding a web/mobile project mirrors `setup/init.mjs` for repos, but the seed
target differs. The repo seeder provisions a filesystem an agent auto-discovers;
a web/mobile conversation has no working tree, cannot read its own
`conversationId`, and cannot auto-pick-up a skill. So the bootstrap is a compact
instruction the human places once into the platform's persistent-context slot
(Claude Project, custom GPT, Gemini Gem) — the slot-equivalent of the `AGENTS.md`
stanza.

Decision: the seed is a **pointer, not a payload**. It does not carry the spec;
it names the backend repo and tells the conversation to read the skills, data
model, `OPERATING.md`, and live instance, then operate the loop. This holds
because the repo is self-describing and a connector bridges to it — so the
knowledge stays single-sourced in the repo and never drifts into
per-conversation copies. Web/mobile konspekt is therefore repo-backed and
connector-assumed, not repo-less: the instance stays in the repo; the seed comes
from outside; an ephemeral container, where present, is an execution convenience
(optional clone), not the store. Read-only connector → context-aware + propose;
read-write → full persist loop.
