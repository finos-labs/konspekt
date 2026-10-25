```yaml
id: nw-fleet-committer-instance-subdir-from-config
kind: decision
review: accepted
provenance:
  sourceRef: 72d499f10c8947695c7543e5089ef0526025e824
  contentHash: 72d499f10c8947695c7543e5089ef0526025e824
  conversationId: fleet-resolve-and-adjustments-2026-10-25
  timestamp: 2026-10-25T15:05:00Z
  confidence: 0.9
createdAt: 2026-10-25T15:05:00Z
updatedAt: 2026-10-25T15:05:00Z
```
# Noteworthy: the config-driven committer resolves instanceSubdir from fleet.json and the fold fails closed

The committer locates the portable instance under the canonical worktree
through `instanceSubdir`, carried on the fleet descriptor. Config-driven attach
sets it from `fleet.json`'s `instanceSubdir`, defaulting to `.konspekt/instance`
(the standard adopter layout); the flat `--root` legacy attach leaves it `""`.
`run-pass`, `bless`, `rebuild-index`, `review`, and `accept-release` default to
the descriptor's value, so a config-driven `run-pass --canonical <path>` folds
into the adopter's instance without an `--instance-subdir` flag — `setup` and
`doctor` already defaulted this way (`nw-fleet-setup-authority-preflight`,
`DEFAULT_INSTANCE_SUBDIR`). An explicit `--instance-subdir` still overrides.

`foldProposal` refuses before any write when the target directory has no
`edges/edges.md`. A wrong instance path (an unset `instanceSubdir` that pointed
the fold at the repo root) previously wrote the source excerpt and the entity
file — creating `sources/` and the entity dir — and only then failed on the
`edges/edges.md` append (`writeFileSync` does not create the `edges/` parent),
scattering files outside the instance. The fold now sets such a proposal aside
with a clear reason and writes nothing. Observed 2026-10-25 against
`cdm-collateral` when `run-pass --canonical <cdm>` was run without the flag.

Notes [[task-fleet-adjustments]].
