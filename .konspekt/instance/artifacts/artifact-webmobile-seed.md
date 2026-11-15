```yaml
id: artifact-webmobile-seed
name: Web/mobile seed instruction
kind: doc
location: setup/WEBMOBILE_SEED.md
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
# Artifact: web/mobile seed instruction

The slot-equivalent of the `AGENTS.md` stanza, for conversations that live on
web/mobile rather than in a repo working tree. A compact pointer-instruction the
human pastes once into a platform context slot (Claude Project, custom GPT,
Gemini Gem): it names the backend repo, tells the conversation to read the
skills, data model, `OPERATING.md`, and live instance, then operate the
propose→accept→persist loop via the GitHub connector. A pointer, not a payload —
the knowledge stays in the repo. Lives at `setup/WEBMOBILE_SEED.md`; documented
in `setup/README.md` alongside `init.mjs`.
