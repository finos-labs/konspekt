# instance

konspekt, eating its own dog food: the live state of *building konspekt*, recorded in konspekt's own format (serialization **v1**). The project is its own first guinea pig.

The point of dogfooding is not proof — the author is a non-representative user who tolerates friction others won't. It is to generate *hypotheses*: each time a convention earns its keep, the portable lesson is the underlying need it served, not the mechanic.

## Structure

Per-entity files and directories per `../spec/SERIALIZATION.md`:

- `project.md` — the Project entity and index.
- `nodes/<type>/` — one directory per NodeType (`goal/`, `investigation/`, `task/`, …).
- `concepts/`, `noteworthy/`, `artifacts/`, `waypoints/` — one file per entity.
- `edges/edges.md` — the single typed edge table.
- `sources/` — content-addressed source excerpts that entities cite through `provenance.sourceRef` (`sources/README.md`).

Each file is YAML front-matter plus a Markdown body that holds the entity's primary prose field (a node's `summary.text`, a concept's `definition`, and so on).
