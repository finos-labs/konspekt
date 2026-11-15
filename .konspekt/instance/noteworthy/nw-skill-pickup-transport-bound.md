```yaml
id: nw-skill-pickup-transport-bound
kind: constraint
status: active
review: accepted
provenance:
  sourceRef: ni:///sha-256;3VERO-bLRZ9cBCQ4hUssZOagGi337QBkLuPNmZ9XqxI
  timestamp: 2026-06-23T19:30:00Z
  conversationId: skills-adoption-review
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 20fbf57db9ded22a7e797036ceb18d25ace56717
    contentHash: 20fbf57db9ded22a7e797036ceb18d25ace56717
createdAt: 2026-06-23T19:30:00Z
updatedAt: 2026-06-23T19:30:00Z
```
# Noteworthy: skill pickup is transport-bound

Skill auto-discovery is a host capability, not a portable guarantee. Claude Code
reads `SKILL.md` files from the working tree, so a maintainer skill is picked up
automatically. The Android app and web interface have no filesystem access to
the repo, so the same skill reaches the model only if the host injects it or a
human forces a read. The maintainer's own operating skills are therefore
discoverable on one transport and unreachable on another — the transport-contract
shape again ("host must inject what the model can't reach"), the same as
conversationId.

Surfaced by dogfooding: the atom-readiness skill governing this very capture did
not load on its own in the app; it entered context only because the human
pointed the maintainer at it in the repo.
