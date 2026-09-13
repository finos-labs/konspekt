# tools

Command-line tools that operate on a konspekt instance. Each is a
zero-dependency Node script (Node only, no install step) and a **pure function
of the instance graph**: run it twice over an unchanged instance and you get a
byte-identical result. That purity is what makes the `--check` freshness gates
below meaningful.

All four read the graph through the one shared reader in `../lib/conformance.mjs`
(the same module the conformance checker and the visual explorer use), so there
is no second parser and no second set of rules.

Run every command from the repository root. Each tool defaults to this repo's
own instance at `.konspekt/instance`; pass a different `instanceDir` as the
trailing argument to point it at another instance.

## `roadmap.mjs` — build `ROADMAP.md`

Regenerates the repo-root `ROADMAP.md` as a projection of the instance graph:
goals with their "why", and the tasks that decompose from them, bucketed into a
now / next / later horizon.

```sh
node tools/roadmap.mjs                 # write ROADMAP.md; prints the path and contentHash
node tools/roadmap.mjs --check         # regenerate in memory, diff the committed file; exit 1 if stale
node tools/roadmap.mjs [instanceDir] [outFile]
```

Authoritative guidance: `.konspekt/OPERATING.md` (when to regenerate, the
freshness gate) and `task-roadmap-generator` in the instance.

## `views.mjs` — derived-view CLI

Prints one of two derived views over the graph, as a table or (with `--json`)
for machine use. The view logic lives in `../lib/views.mjs`.

```sh
node tools/views.mjs goal <goalId> [--json] [instanceDir]         # decomposes sub-graph + roll-up
node tools/views.mjs provenance <entityId> [--json] [instanceDir] # provenance + supersession chain
```

`<id>` may be bare (`goal-portability`) or typed (`node:goal-portability`).
`KONSPEKT_FILENAME_RULE` is honored, matching the other tools.

Authoritative guidance: `spec/data-model/SPEC.md` → **Composite views**.

## `state-poster.mjs` — build the current-state poster

Regenerates `docs/visuals/posters/konspekt-current-state-poster.html`: a
hand-authored design whose drift-prone figures are spliced from the graph at
build time.

```sh
node tools/state-poster.mjs            # write the poster
node tools/state-poster.mjs --check    # regenerate in memory, diff the committed file; exit 1 if stale
node tools/state-poster.mjs [instanceDir] [outFile]
```

Authoritative guidance:
`.konspekt/instance/artifacts/artifact-state-poster-generator.md`.

## `roadmap-poster.mjs` — build the roadmap poster

Regenerates `docs/visuals/posters/konspekt-roadmap-poster.html`. Unlike
`roadmap.mjs`, this poster is a **curated subset** (a hand-composed selection of
goals and representative tasks). Every id in its editorial map is resolved
against the graph, so a renamed, removed, abandoned, or detached task makes
generation fail — that is the drift the freshness gate catches. New graph tasks
do not auto-appear; the selection stays curated by design.

```sh
node tools/roadmap-poster.mjs          # write the poster
node tools/roadmap-poster.mjs --check  # regenerate in memory, diff the committed file; exit 1 if stale
node tools/roadmap-poster.mjs [instanceDir] [outFile]
```

Authoritative guidance:
`.konspekt/instance/artifacts/artifact-roadmap-poster-generator.md`.

## Related surfaces (outside `tools/`)

- **Conformance check** — `node lib/validate.mjs [instanceDir] [--json] [--slug-ok] [--no-sources]`
  validates an instance (exit 0 clean, 1 on errors, 2 on bad usage). See
  `setup/README.md`.
- **Visual explorer** — the read-only context explorer under `visual/`; see
  `visual/README.md` for its build and serve steps.
