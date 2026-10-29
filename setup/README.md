# konspekt — setup

[konspekt](https://github.com/finos-labs/konspekt) is an open standard for a
portable, human-readable record of a project's evolving state across
generative-AI conversations and platforms. The standard is two specs:

- `spec/data-model/` — *what state is*: entities, the single edge table, derived
  views. The part a stranger implements against.
- `spec/architecture/` — *how state moves and stays true*: reconciliation,
  serialization, transport, review.

If that fits how you want to carry project state, this kit prepares your repo to
use it.

## What it sets up

A fully adopted **adopter** repo has four surfaces. The scaffolder writes the
base; the optional components — the Claude Code layer among them — add the rest.
The tree below is that adopter repo; konspekt's own `.konspekt/` carries extra
internal surfaces the kit never installs (see **konspekt's own repo differs** at
the end of this section).
Everything the adopter *runs* lives under `.konspekt/`; only the
agent-instruction files and the tool-fixed `.claude/` and `.github/` directories
sit outside it.

    .konspekt/                       # the konspekt umbrella: portable unit + envelope + tooling
    ├─ instance/                     # the portable konspekt instance (ports across platforms)
    │  ├─ project.md                 # root: goal + summary + policy (binding: required, basis: proposed)
    │  ├─ nodes/ concepts/ noteworthy/ artifacts/ waypoints/
    │  ├─ edges/edges.md             # the single edge table (starts empty)
    │  ├─ transitions/transitions.md # the status-transition log (starts empty)
    │  ├─ sources/                   # content-addressed provenance excerpts (+ README)
    │  └─ changes/ commands/         # persona provenance logs, seeded empty (only with --persona engineer)
    ├─ OPERATING.md                  # this project's operating policy (loop, triggers, binding)
    ├─ NOTES.md                      # human scratchpad (the `note:` convention)
    ├─ notify.yml                    # notify-component config seed (empty subscriptions)
    ├─ lib/                          # installed tooling: every script the adopter runs
    │  ├─ conformance.mjs validate.mjs load-personas.mjs authority.mjs  # the checker closure
    │  ├─ binding-audit.mjs                                             # flags commits bound to no entity
    │  └─ konspekt-notify.mjs                                           # the change notifier
    └─ spec/personas/<layer>/        # where the checker looks for a persona registry (optional; vendor with --vendor-persona)
    .claude/                         # Claude Code operating layer (paths fixed by Claude Code)
    ├─ settings.json                 # SessionStart + PreToolUse wiring (merged, never clobbered)
    ├─ hooks/
    │  ├─ load-mandatory-skills.sh   # injects the required skills + OPERATING.md + the binding ask
    │  └─ require-binding.sh         # blocks edits until the conversation is bound to an entity
    └─ skills/<name>/SKILL.md        # the required skills (listed below)
    .github/workflows/               # CI workflows only (GitHub fixes this location)
    ├─ konspekt-conformance.yml      # runs the checker on every push/PR touching the instance
    ├─ konspekt-binding-audit.yml    # runs the binding audit on every push/PR
    └─ konspekt-notify.yml           # opens an issue when an entity changes review state
    AGENTS.md  CLAUDE.md  GEMINI.md  # agent-instruction files (stanza + pointers)

**Installed tooling lives under `.konspekt/lib/`.** Every script the adopter
executes — the conformance checker's full import closure
(`conformance.mjs`, `validate.mjs`, `load-personas.mjs`, `authority.mjs`), the
binding audit (`binding-audit.mjs`), and the change notifier
(`konspekt-notify.mjs`) — is installed there, so nothing an
adopter runs sits at the repo root or under `.github/`. `.github/` holds CI
workflows only, because GitHub fixes that path; the workflows invoke the scripts
by their `.konspekt/lib/` path. The checker resolves persona registries at
`.konspekt/lib/../spec/personas`, i.e. `.konspekt/spec/personas/<layer>/`. Those
registries are **not** auto-vendored: neither the scaffolder nor the
`conformance` component ships them. A layer named in `project.md` whose registry
is absent is non-fatal — `load-personas.mjs` skips it with a warning and the
checker applies core rules only for it. Vendoring a registry into the umbrella
is an explicit, opt-in step: `node setup/init.mjs --vendor-persona <layer>`
copies it from the standard into `.konspekt/spec/personas/<layer>/` (and
`--persona <layer> --vendor-persona` does it during scaffolding). It is kept
separate from scaffolding so adoption does not duplicate the standard's spec
into every repo unless asked, and `--check` then drift-checks the vendored copy
against the standard (`nw-component-ships-import-closure`).

This describes an *adopter* repo. konspekt's own repository is the exception on
both tooling surfaces, because it is the **source** the components project from.
The checker is edited at the repo root `lib/` — the one place `lib/` exists as
source, reached by `from: ../../../lib/…` — and the Claude Code layer is edited
at konspekt's own `.claude/`. konspekt therefore does not install the
`.konspekt/lib/` checker projection and does not regenerate its own
`.github/workflows/konspekt-conformance.yml`: its CI runs the root `lib/` checker
directly, which also keeps its root `spec/personas/` registries in reach. The
change notifier is different — its source is the `notify` component, not
konspekt's `lib/`, so even konspekt installs it to
`.konspekt/lib/konspekt-notify.mjs` like any adopter. Root `lib/` and `.claude/`
in konspekt are origin; `.konspekt/lib/` in an adopter is projection.

**The Claude Code layer is `.claude/`**, installed by
`node setup/init.mjs --add claude-code`. Claude Code fixes these paths, so they
sit outside `.konspekt/`. `settings.json` wires two hooks (merged into any
existing file, never overwritten — your own settings are preserved): a
**SessionStart** hook that injects the mandatory skills, the `OPERATING.md`
policy, and the unconditional
conversation-binding ask; and a **PreToolUse** hook that refuses edits until the
conversation is bound to a graph entity. The skills ship under `.claude/skills/`:

- **Mandatory at session start (5):** `claude-mandatory-read`,
  `claude-precise-engineering-diction`, `empirical-epistemology`,
  `ontology-perspective-discipline`, `konspekt-atom-readiness`.
- **On demand (7):** `project-agent-common`, `proof-ledger-maintenance`,
  `documentation-maintenance`, `documentation-compaction`,
  `documentation-index-curation`, `documentation-test-repair`,
  `code-commentary-maintenance`.

The on-demand set ships too because the mandatory skills and the on-demand ones
reference each other; a partial set leaves dangling skill references. This layer
applies to **Claude Code only** — other tools get just the `AGENTS.md` stanza.

**Agent-instruction files** make any tool working in the repo read the instance
first and respect propose-accept. `AGENTS.md` carries the **konspekt stanza**
(created if absent) — the open cross-tool standard, read natively by Claude Code,
Cursor, Codex, Copilot, Grok, Windsurf, Zed, Aider, and others. `CLAUDE.md` and
`GEMINI.md` are written as thin **pointers** to it, for the tools that key off
their own filename; the stanza stays single-source in `AGENTS.md`. Pass
`--tool cursor|copilot|windsurf` (repeatable) for explicit per-tool files where a
team wants them — redundant with native `AGENTS.md` support, so off by default.

**The four surfaces, by lifecycle:**

- **Portable unit** — `.konspekt/instance/`. What moves between platforms.
- **Local envelope** — `.konspekt/OPERATING.md`, `.konspekt/NOTES.md`,
  `.konspekt/notify.yml`. This repo's policy and config; not part of the contract
  a second tool conforms to.
- **Installed tooling** — `.konspekt/lib/` (the checker closure and the
  notifier). A projection of konspekt's own copies: regenerated with `--force`,
  verified with `--check`, never hand-edited. Persona registries under
  `.konspekt/spec/personas/` are **not** projected — they are vendored by an
  explicit step, if at all.
- **Harness** — `.claude/`, `.github/workflows/`. Tool-fixed locations for the
  Claude Code operating layer and CI, also installed as projections (`--force` /
  `--check`); the one exception is `.claude/settings.json`, which is merged into
  an existing file rather than projected, so `--check` leaves it alone.

The instance always lives at `.konspekt/instance`. That path is a constant of
this binding, not a setting: this script is what writes it, so a tool that
hardcodes it is conforming rather than assuming.

**konspekt's own repo differs.** The tree above is what an adopter gets.
konspekt's own `.konspekt/` additionally carries surfaces the kit neither
scaffolds nor installs into an adopter:

- `fleet/` and `agents/skills/` — the maintenance agent fleet and its
  vendor-neutral skills. konspekt-internal, tracked by `task-agent-fleet`; the
  kit installs the Claude Code skills to `.claude/skills/` (via the
  `claude-code` component) but never the fleet or the neutral `agents/skills/`
  source.
- `instance/authority/` — this instance's declared principals and grants
  (`principals.md`, `grants.md`). `init.mjs` does **not** seed these; an adopter
  that stays single-writer needs none, and one that adds a second acceptor
  writes its own tables (`spec/architecture/AUTHORITY.md`).
- `binding-audit.json` — the audit baseline and allowlist, written by hand only
  when an adopter starts the binding audit mid-history or exempts a commit.

None of these ship through `init.mjs` or a component today.

## Run it

From the root of the repo you want to adopt konspekt (needs Node 18+). Copy this
`setup/` folder into your repo, or clone konspekt and run it from there.

The scaffold-only command writes the base — the instance, the envelope, and the
agent-instruction files:

    node setup/init.mjs --name "My Project" --goal "what this project is for"

To get the **fully adopted repo pictured above** in one command — the base plus
every component (`.konspekt/lib/` tooling, the `.claude/` Claude Code layer, and
`.github/workflows/` CI) — add `--full`:

    node setup/init.mjs --name "My Project" --goal "what this project is for" --full

That single run produces the tree under **What it sets up**, surface for surface.
The one thing `--full` does not create is `.konspekt/spec/personas/<layer>/`: a
persona's registry is not vendored automatically (see the persona note above),
so a layer you activate degrades to core checking until you vendor its registry.

Add `--persona <layer>` (repeatable, or comma-separated) to activate a persona
layer — it writes a `personas: [...]` line into `project.md` and seeds the
provenance logs the layer's registry declares (for `engineer`:
`changes/changed.md` and `commands/executed.md`, as empty tables). The Claude
Code SessionStart hook injects the layer's operating brief from
`.konspekt/spec/personas/<layer>/AGENTS.md`, so vendor the layer
(`--vendor-persona`) if you use Claude Code; without it the hook warns that the
brief is missing.

`project.md` is seeded with `binding: required` (every conversation binds to an
entity; `optional` permits a recorded decline) and `basis: proposed` (work may
bind to a proposed entity; `accepted` requires acceptance first). The shipped
hooks read both fields, and `OPERATING.md` § Conversation binding and
§ Acceptance before work describe them.

Review what it wrote, then commit — `git add .` after `--full`, or the base
paths otherwise:

    git add . && git commit -m "adopt konspekt project state"

Or let the script do it — add `--push`. It is idempotent: it refuses to clobber
an existing `.konspekt/instance/`, skips an agent-file stanza already present,
and merges rather than overwrites an existing `.claude/settings.json`.

## Then what

1. Edit `.konspekt/instance/project.md` — set the goal and a one-line summary.
2. Point your AI assistant at the repo. At the start of a session it reads
   `.konspekt/instance/`; as durable atoms crystallize it **proposes** them
   (`review: proposed`); your commands accept and `persist` them.
3. The verbs (`pin`, `validate`, `resolve`, …) and the data model are in the
   konspekt spec. `.konspekt/OPERATING.md` is the policy you just adopted —
   edit it to taste; it is yours, not the standard's.

## Viewing an instance in your IDE

A konspekt instance is plain Markdown you can read in any editor. For a live,
navigable view there is a reference **IntelliJ IDEA plugin** that renders the
instance (Changes / Stats / Goals) in a tool window, in-process, and refreshes as
the instance changes. It is a reference implementation, not part of the standard.

Install the prebuilt zip from the latest release — no build required:
<https://github.com/finos-labs/konspekt/releases/latest> (Settings → Plugins → ⚙ →
*Install Plugin from Disk…*). It requires IntelliJ IDEA 2026.2 or newer. To build
it yourself, the source is at `implementations/intellij-plugin/app/` in the
konspekt repo (output:
`implementations/intellij-plugin/app/build/distributions/konspekt-intellij-<version>.zip`).

## Optional components

Scaffolding is create-or-refuse, so on its own it can never retrofit anything
onto an instance that already exists. Components are the second mode: add-ons
installed **into** a live `.konspekt/`.

    node setup/init.mjs --list                 # what's available
    node setup/init.mjs --add notify           # install one
    node setup/init.mjs --add notify --force   # regenerate after editing the component
    node setup/init.mjs --check                # report drift, write nothing

To install every component at adoption time instead of one at a time, scaffold
with `--full` (see **Run it**); the à la carte `--add` is for adding a component
to an instance that already exists.

Components are **not part of the standard**. A conformant instance with none of
them is complete, and the manual re-upload probe passes without them. Each lives
in `setup/components/<id>/` behind a `manifest.yml` declaring where its files go
and what the install needs.

Installed files are a **projection** of the component, never a tracking copy —
edit the component and re-run with `--force`; `--check` tells you when the two
have forked. The exception is a file marked `seed: true`, which is your config
and is written exactly once.

Run `init.mjs` from the root of the **target** repo. Component sources resolve
relative to the script, install targets relative to your working directory, so
installing into another project looks like:

    cd /path/to/other-repo
    node /path/to/konspekt/setup/init.mjs --add conformance

### Available

- **`notify`** *(github binding)* — watches the instance and opens a GitHub issue
  when an entity is accepted, proposed, or superseded. Subscriptions are empty
  after install, so nothing fires until you name someone in
  `.konspekt/notify.yml`. Delivery uses the built-in `GITHUB_TOKEN`; no secret,
  no SMTP, no external service.

  This component writes under `.github/workflows/`. GitHub Apps and MCP
  connectors need an explicit `workflows` scope to **push** such a file — the
  local write succeeds and the push is what gets rejected — so install it from a
  terminal rather than through a connector. `--add` warns before it writes.

- **`conformance`** *(github binding)* — runs the konspekt conformance checker on
  every push and pull request that touches the instance, and fails the build on
  errors. This is what turns "the instance drifted" from something noticed by
  hand a month later into something a commit cannot land without.

  It ships the checker with it: the full import closure — `conformance.mjs`,
  `validate.mjs`, `load-personas.mjs`, and `authority.mjs` — is installed under
  `.konspekt/lib/` as projections of konspekt's own copies, so a second repo
  needs nothing pre-vendored and `--check` catches it if a vendored copy is
  edited. The closure is all four because `validate.mjs` imports
  `load-personas.mjs` and `conformance.mjs` imports `authority.mjs`; shipping
  fewer makes the installed checker crash on its first import with
  `ERR_MODULE_NOT_FOUND` before it reads a thing. Same `workflows` scope caveat
  as above.

  It also ships the **binding audit** (`.konspekt/lib/binding-audit.mjs` and
  `konspekt-binding-audit.yml`): every commit after the one that added
  `project.md` that changed files outside `.konspekt/instance/` must be bound to
  an entity by a row in `changes/changed.md`. A commit that only touches files
  the kit installs (`.konspekt/`, `.claude/hooks/`, `.claude/skills/`,
  `.claude/settings.json`, `.github/workflows/konspekt-*`) counts as
  bookkeeping and needs no row. It needs no configuration. It
  skips, and passes, unless `project.md` is `binding: required` and the instance
  has a changed-code log (seeded by `--persona engineer`). To start it later or
  exempt a commit, write `.konspekt/binding-audit.json`
  (`{"baseline": "<sha>", "allow": ["<sha>"]}`).

  `--check` also reports a `project.md` without `binding:` or `basis:` (an
  instance scaffolded before those fields were seeded) and fails; `--add`
  prints the same note. The scaffolder never edits an existing `project.md`, so
  add the two lines by hand.

  Fails on **errors only**. `edge-domain-range` and the status-vocabulary
  warnings are the open subject of `spec/architecture/SCHEMA-RECONCILIATION.md`,
  so gating on them would make the build permanently red over an undecided
  question. Add `--strict` to the workflow's validate step when that closes.

- **`claude-code`** *(Claude Code binding)* — installs the Claude Code operating
  layer described under **What it sets up**: the SessionStart and PreToolUse
  hooks and the twelve skills they depend on. `.claude/settings.json` is merged
  into any existing one — de-duped on the hook command, so a re-install with
  `--force` is idempotent — and never clobbers your own Claude Code settings;
  the hooks and skills are ordinary projections. Applies to Claude Code only;
  other tools read the `AGENTS.md` stanza instead. No `workflows` scope needed —
  it writes nothing under `.github/`.

### Checking an instance without installing anything

The checker takes an instance directory, so you can point konspekt's copy at any
instance — no install, no files added to the target repo:

    node lib/validate.mjs /path/to/other-repo/.konspekt/instance

Add `--json` for machine-readable output, `--slug-ok` for an instance that
predates the 2026-07-19 filename migration, `--quiet` for counts only.

## Web & mobile

The steps above seed a **repo**. If your project lives in a platform-native
context slot instead — a Claude Project, a custom GPT, a Gemini Gem — there is no
working tree for an agent to discover. The instance still lives in a repo
(reached over a GitHub connector); what changes is how a conversation learns to
tend it.

`WEBMOBILE_SEED.md` is that bridge: a compact, paste-able instruction — the
slot-equivalent of the `AGENTS.md` stanza — that points the conversation at the
repo and tells it to operate the loop. It is a pointer, not a payload: the
knowledge stays in the repo; the seed only orients the conversation. Place it
once in your slot (the file carries the paste-in text and the connector
requirements), wire a GitHub connector, and the conversation is konspekt-enabled.

Note that a connector-driven adoption cannot **install** a component that writes
under `.github/workflows/`, for the scope reason above. It can still maintain the
component's templates under `setup/components/`, which is not a workflows path.
That is a property of the connector, not of konspekt: the instance is fully
functional without any component.

konspekt is open and impact-primary: adoption, even by copying, is the win.
