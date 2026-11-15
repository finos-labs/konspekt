```yaml
id: wp-init-store-block-opt-in
kind: decision
timestamp: 2026-11-15T15:28:12Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;L2HVhz6saqj_do5eknTfWpzya1T2C4gfq3DJAOkVamY
  conversationId: linkedin-ni-references
  timestamp: 2026-11-15T15:28:12Z
  confidence: 0.9
createdAt: 2026-11-15T15:28:12Z
updatedAt: 2026-11-15T15:55:49Z
```
# Waypoint: setup/init.mjs writes a store block only when given --repo-url, and seeds no sha-256 directories

`setup/init.mjs` takes optional `--repo-url <https://host/owner/repo>` and
`--ref <branch>` flags with the meaning they have in `tools/migrate-ni.mjs`.
When `--repo-url` is given, the scaffolded `project.md` carries a git `store`
block whose `resolve` templates point at
`<repo-url>/blob/{ref}/<instance path>/...`; without it, no `store` block is
written and readers resolve references by the layout convention. `--ref`
defaults to `main`. The scaffolder does not read the URL from the git remote,
because a remote can name an SSH or internal host the adopter did not choose to
publish. `locators.allow: []` stays seeded as before.

The scaffolder creates no empty `sources/sha-256/` or `commands/sha-256/`
directory: git does not track empty directories, and a placeholder file would
sit in a directory meant to hold only files named by their hash. The first
write creates each directory.

Rejected alternatives: writing nothing ever (adopters who want a `store` block
would add it by hand), and deriving the URL from `git remote get-url origin`.
This is a tooling decision with no architectural force behind it, so it carries
no `subtype: adr`. The work is [[task-ni-references]].
