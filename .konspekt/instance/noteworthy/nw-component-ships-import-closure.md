```yaml
id: nw-component-ships-import-closure
kind: constraint
status: active
review: proposed
provenance:
  sourceRef: 24b3f7fe9f0805f675a27cbfcb3f24bd9b0bdce2
  contentHash: 24b3f7fe9f0805f675a27cbfcb3f24bd9b0bdce2
  timestamp: 2026-10-14T01:44:02Z
  conversationId: cdm-collateral-adoption
  confidence: 0.8
createdAt: 2026-10-14T01:44:02Z
updatedAt: 2026-10-14T23:53:54Z
```
# Noteworthy: a component must vendor its code's full import closure

A component that ships executable code must project every file that code
statically imports, or the projection it installs is non-runnable. The
`conformance` component declares two files — `lib/conformance.mjs` and
`lib/validate.mjs` — but `validate.mjs` has a top-level
`import … from "./load-personas.mjs"` and `conformance.mjs` has a top-level
`import … from "./authority.mjs"`. Neither is in the manifest. Installing only
the declared files and running the checker fails before any instance is read:
`ERR_MODULE_NOT_FOUND: Cannot find module '…/lib/load-personas.mjs' imported
from …/lib/validate.mjs`. The crash is unconditional — it does not depend on the
instance activating a persona.

This surfaced through an adopter, `cdm-collateral` (engineer persona). To get a
running checker, its maintainer hand-copied `load-personas.mjs` and
`authority.mjs` into `lib/`, and the persona path then resolved a registry at
`lib/../spec/personas/engineer/registry.mjs`, creating a root-level `spec/` that
`init.mjs` never writes. All four files are byte-identical copies of the
standard's. That hand-vendoring is exactly the fork `nw-derive-not-copy` and the
projection rule in `nw-components-are-not-the-standard` exist to prevent: the
manifest's incompleteness pushed the adopter into copying by hand what the
component should have projected.

The always-required closure for the conformance checker is four files:
`conformance.mjs`, `validate.mjs`, `load-personas.mjs`, `authority.mjs`. The fix
is to add the two missing files to the component manifest so the projection is
self-sufficient, as the manifest's own comment already claims ("a second repo
needs nothing pre-vendored").

Persona registries are a separate case and should not be auto-vendored.
`load-personas.mjs` skips a persona whose registry is absent with a warning and
degrades to core checking, so a missing `spec/personas/<name>/registry.mjs` is
non-fatal. Vendoring registries into every adopter would reintroduce the
root-`spec/` sprawl this adopter tripped over and duplicate the standard's spec.
The registry stays read from the standard (or an explicit persona-aware install
step), not shipped by the conformance component.

General rule for future components: the manifest's `files:` list must be the
static-import closure of its entry points, not just the entry points. A check
that the declared closure is complete belongs in `--check`.

## Resolution — proposed

The prescribed fix shipped and is verified. The `conformance` component manifest
now declares the full closure — `conformance.mjs`, `validate.mjs`,
`load-personas.mjs`, `authority.mjs` — each projected to `.konspekt/lib/`, and
the consolidation moved the notifier there too (`.konspekt/lib/konspekt-notify.mjs`),
so nothing an adopter runs sits at the repo root or under `.github/`. Verified in
the reporting adopter, `cdm-collateral`: installing the component and running the
installed checker (`node .konspekt/lib/validate.mjs`) no longer raises
`ERR_MODULE_NOT_FOUND` — it reads the instance and reports cleanly. A single
`init.mjs --full` now reproduces the whole adopter tree, closure included.

The persona case this item carved out — registries stay **not** auto-vendored —
is honored by making vendoring an explicit, opt-in command rather than a hand
copy: `init.mjs --vendor-persona <layer>` projects a layer's registry into
`.konspekt/spec/personas/<layer>/`, the one place the installed checker resolves
it. Before, `cdm-collateral`'s activated `engineer` layer degraded to core-only
with a warning; after vendoring, the checker resolves it with zero problems.
`--check` drift-checks the vendored copy against the standard, so the hand-copy
sprawl this item named is now a tracked projection, not silent duplication.

One prescription is still open: the import-closure **completeness** check — that
a manifest's `files:` list equals the static-import closure of its entry points —
is not yet in `--check`. `--check` today catches content drift of declared files
and of vendored registries, not a missing closure member. Until that lands, a new
component's closure is still verified by hand.

Status held at `review: proposed`: the maintainer records the resolution but does
not self-accept. A human `lift` marks the constraint resolved once the open
completeness check is judged in or out of scope.
