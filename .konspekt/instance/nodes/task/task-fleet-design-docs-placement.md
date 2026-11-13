```yaml
id: task-fleet-design-docs-placement
type: task
title: Place the fleet design docs with the fleet implementation
status: active
review: accepted
provenance:
  sourceRef: c5b67de2993cffaa775c1393b3d2466c0baa3a0e
  contentHash: c5b67de2993cffaa775c1393b3d2466c0baa3a0e
  conversationId: fleet-design-docs-placement
  timestamp: 2026-11-13T00:55:48Z
  confidence: 0.75
createdAt: 2026-11-13T00:55:48Z
updatedAt: 2026-11-13T00:55:48Z
```
# Task: Place the fleet design docs with the fleet implementation

The five fleet design notes live at `docs/design/`, apart from the fleet
implementation at `implementations/fleet/`. An adopter that vendors the fleet
copies `implementations/fleet/app/` to `.konspekt/fleet/app/`; the design notes
then have no matching place, and `cdm-collateral` received them at its own
`docs/design/` (its commit `6140563`, under its `task-adopt-agent-fleet`).

Scope, as accepted by the human on 2026-11-12:

- Move `docs/design/fleet-{spec,protocol,recovery,outbox-lifecycle,confidence-scale}.md`
  to `implementations/fleet/design/` with `git mv`.
- Update every live reference: the three fleet skills in
  `.konspekt/agents/skills/` (then re-run `tools/sync-agents.mjs` to update
  `.claude/skills/`), the link in `implementations/fleet/app/README.md`, the
  comment in `implementations/fleet/app/fold.mjs`,
  `implementations/fleet/docs/DESIGN.md`, `ADOPTING.md` § Reference, and the
  self-references inside the five docs.
- Rewrite the placement rule in `fleet-spec-writer` so it names the fleet
  design folder for both cases: `implementations/fleet/design/` in the standard,
  and `.konspekt/fleet/design/` in an adopter.
- Add a "Vendoring into an adopter repo" section to `ADOPTING.md` that states the
  `implementations/fleet/{app,design}` → `.konspekt/fleet/{app,design}` mapping
  and the skill mirror.
- Update `location` on the five `artifact-fleet-*` entities as proposed changes
  with transition rows.
- Leave `sources/` excerpts unedited.

Re-vendoring `cdm-collateral` onto the new layout is out of scope for this task.
