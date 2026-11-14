```yaml
id: artifact-components
name: Setup components
kind: code
location: setup/components/
review: proposed
provenance:
  sourceRef: ni:///sha-256;GL64s0C3knxFD_YrBEJa7nnb0vqfOhjp7ZJ7FKX54yY
  timestamp: 2026-07-20T18:00:00Z
  confidence: 0.9
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 5ed08b5539e0bb86e59aa8a79ec1c903f0c569b2
    contentHash: 5ed08b5539e0bb86e59aa8a79ec1c903f0c569b2
createdAt: 2026-07-20T18:00:00Z
updatedAt: 2026-07-20T18:00:00Z
```
# Artifact: Setup components

The setup kit's second mode. Scaffolding is create-or-refuse and so can never
retrofit anything onto a live instance; `--add` installs a component into one
that already exists.

Each component is a directory behind a `manifest.yml` declaring its files, its
install-time permissions (`requires`), and optionally runtime prerequisites it
does not ship (`needs`, currently unused). Installed files are projections of
the component — `--force` regenerates, `--check` reports drift — except files
marked `seed: true`, which are the adopter's config and written once.

Two components: `notify` (the change notifier) and `conformance` (CI running the
checker). Both write under `.github/workflows/`, which a GitHub App or MCP
connector cannot push — verified 2026-07-20 as a 403, so they install from a
terminal.

`conformance` ships `lib/` with it rather than requiring it. Declaring the
checker a prerequisite would have forced adopters to hand-vendor it, and a
hand-vendored checker forks — the exact drift the component exists to catch.
