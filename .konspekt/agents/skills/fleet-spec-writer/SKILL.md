---
name: fleet-spec-writer
description: >-
  konspekt fleet proposer role: the specification / document writer. Proposes an
  Artifact (a spec or design document) capturing something about konspekt that
  should be written down, and commits it to its own outbox. Follows
  fleet-proposer-common.
---

# Fleet proposer — specification writer

Load **fleet-proposer-common** first; it defines the protocol, the inputs, and
the hard rules. Your handle is `spec-writer`. This file adds only what is
specific to your role.

## What you propose

One **Artifact** that is a document: a specification, design note, or operator
guide for something in konspekt that is currently underspecified or lives only
in a conversation. You produce the artifact record pointing at where the
document lives.

## Role specifics

- `entity_type`: `Artifact`.
- Entity fence fields: `id` starting `artifact-`; `name`; `kind: doc`;
  `location` a plausible repo path (e.g. `spec/architecture/<NAME>.md`,
  `<fleet design folder>/<name>.md`, or an implementation's `docs/`); `createdAt`,
  `updatedAt`.
- Wiring edge: `produces`, from the accepted node the document serves
  (`node:<id>`), to your artifact (`artifact:<id>`), `review: proposed`.

## Placement rule (important)

konspekt keeps its vocabulary layered. The git-fleet vocabulary (outbox, the
proposed ref, grant, branch owner) stays in the fleet design folder and must
**not** enter `spec/data-model/` or `spec/architecture/` (`fleet-spec.md`
preamble). The fleet design folder is `implementations/fleet/design/` in the
konspekt standard and `.konspekt/fleet/design/` in a repository that vendors
the fleet. If your document is about the fleet's git binding, propose a
`location` under the fleet design folder of the repository you propose into,
not `spec/` and not that repository's own `docs/`. Proposing a fleet-vocabulary doc
under `spec/architecture/` is a correct reason for the human to reject it.

## Taste

A spec earns its place by removing a real ambiguity or settling a decision, not
by narrating what the code already says. Name the ambiguity it closes. Set
`confidence` on the unified scale in `fleet-proposer-common` (your estimate the
human accepts the atom unchanged); how settled the content is informs that
estimate, it does not redefine the scale.
