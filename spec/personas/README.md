# konspekt — persona layers

The core (`../data-model/`, `../architecture/`) is **persona-agnostic**: it defines the entity set, the single edge table, provenance, review, and the serialization every instance shares. It names no working role and carries no vocabulary specific to one.

A **persona layer** is an extension that adds vocabulary on top of that core — subtypes, edge kinds, and content-addressed provenance channels — for a particular way of working. The first is `engineer/`, which brings architecture records (ASR, ADR) and executed-command provenance to app-building work.

## How a layer extends core without touching it

Core exposes exactly three generic hooks, and a layer contributes values into them:

1. **`subtype`** — an optional discriminator field on any entity. Core recognizes the field and leaves its values to layers. The engineer layer defines `asr` (on a Concept) and `adr` (on a Waypoint).
2. **Provenance-ref edge endpoints** — an edge `from`/`to` may address a content-addressed provenance file (`<channel>:<content reference>`, e.g. `command:ni:///sha-256;<digest>`) rather than an entity, resolved the same way `sources/` is. The engineer layer adds the `command` channel.
3. **Layer-defined edge kinds** — additional `EdgeKind`s with their own domain/range, merged by the checker before validation. The engineer layer adds `drives` and `executed`.

Core enums (`WaypointKind`, `EdgeKind`, …) are **not** grown with layer values. `adr` is not a new waypoint kind; it is a `subtype` on a `decision` waypoint. This is what keeps a non-engineer instance free of any engineer vocabulary.

## Registry and activation

Each layer ships a machine-readable **registry** (`<layer>/registry.mjs`) declaring its subtypes, edge kinds, and provenance channels. The registry is a plain, zero-dependency ES module so the neutral conformance checker can load it with no new machinery and no network — the same posture the checker itself holds.

An instance **opts in** by listing layers in `project.md` front-matter:

```yaml
personas: [engineer]
```

The checker validates against a layer only when the instance activates it and the layer's registry is supplied. Absent the list, core behavior is unchanged, so every existing instance stays conformant with no migration.

## Promotion

ASR and ADR are generic decision-record constructs living in `engineer/` for now. If a second persona needs them, they promote to a thin shared decision-records layer and the engineer layer depends on it; core does not change either way.
