```yaml
id: task-authority-not-scaffolded
type: task
title: init.mjs does not scaffold instance/authority/ tables
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-29T20:40:18Z
review: accepted
provenance:
  conversationId: adoption-readme-what-it-sets-up-2026-10-29
  timestamp: 2026-10-29T20:21:24Z
  confidence: 0.7
createdAt: 2026-10-29T20:21:24Z
updatedAt: 2026-10-29T20:40:18Z
```
# Task: init.mjs does not scaffold instance/authority/ tables

`setup/init.mjs` never writes `.konspekt/instance/authority/` (no
`principals.md`, no `grants.md`), yet `OPERATING.md` § Accept authority and
`spec/architecture/AUTHORITY.md` treat an instance's principals and grants as
declared there, and the Claude Code hooks read `KONSPEKT_PRINCIPAL` against that
declaration. A freshly scaffolded adopter therefore has no authority surface at
all.

## Why

The gap surfaced while reconciling `setup/README.md`'s "What it sets up" tree
with what the scaffolder actually writes (2026-10-29). The README's adopter tree
was corrected to stop implying `authority/` is scaffolded and to note that
konspekt's own `instance/authority/` is repo-internal. That is the doc half; the
open question is whether the scaffolder should also seed authority for adopters.

An adopter that stays single-writer arguably needs no explicit declaration — the
instance runs with no declared principals and acceptance is uncontested. But the
moment an adopter adds a second acceptor, or runs a client that sets
`KONSPEKT_PRINCIPAL`, the declaration must exist, and today there is no seeded
starting point to edit.

## Shape (to design)

Decide one of:

- **Leave as-is** — authority stays opt-in, declared by hand from
  `spec/architecture/AUTHORITY.md` when an adopter needs more than single-writer.
  The README note is then the whole fix.
- **Seed on a flag** — e.g. `--persona`-style opt-in that writes a minimal
  `principals.md` (one human `grantor`) and a `grants.md` (that human on the
  whole graph), matching this instance's single-individual shape.
- **Seed always** — every scaffolded instance gets the minimal single-writer
  declaration, so `KONSPEKT_PRINCIPAL` enforcement has something to check from
  day one.

Open points: whether seeding authority should pull the adopter's git
`user.name`/`user.email` for the principal id, and how this interacts with
`basis` / `binding` enforcement for a brand-new empty instance.

Decomposes [[task-adoption-path]]. Surfaced while reviewing `setup/README.md`
under [[goal-adoption]]; related to [[task-authority-mechanism]].
