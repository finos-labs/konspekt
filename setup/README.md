# konspekt — setup

[konspekt](https://github.com/denisurusov/konspekt) is an open standard for a
portable, human-readable record of a project's evolving state across
generative-AI conversations and platforms. The standard is two specs:

- `spec/data-model/` — *what state is*: entities, the single edge table, derived
  views. The part a stranger implements against.
- `spec/architecture/` — *how state moves and stays true*: reconciliation,
  serialization, transport, review.

If that fits how you want to carry project state, this kit prepares your repo to
use it.

## What it sets up

A `.konspekt/` umbrella at the root of your project repo:

    .konspekt/
    ├─ instance/            # the portable konspekt instance (ports across platforms)
    │  ├─ project.md        # root: goal + summary
    │  ├─ nodes/ concepts/ noteworthy/ artifacts/ waypoints/
    │  ├─ edges/edges.md    # the single edge table (starts empty)
    │  └─ sources/          # content-addressed provenance excerpts
    ├─ OPERATING.md         # this project's operating policy (the loop, triggers)
    └─ NOTES.md             # human scratchpad (the `note:` convention)

…plus agent instruction files so any tool working in the repo reads the instance
first and respects propose-accept. `AGENTS.md` carries the **konspekt stanza**
(created if absent) — it is the open cross-tool standard, read natively by Claude
Code, Cursor, Codex, Copilot, Grok, Windsurf, Zed, Aider, and others. `CLAUDE.md`
and `GEMINI.md` are written as thin **pointers** to it, for the tools that key off
their own filename; the stanza stays single-source in `AGENTS.md`. Pass
`--tool cursor|copilot|windsurf` (repeatable) for explicit per-tool files where a
team wants them — redundant with native `AGENTS.md` support, so off by default.

The split is deliberate: `instance/` is the portable unit — it is what moves
between platforms; `OPERATING.md` / `NOTES.md` are local envelope, not part of
the contract a second tool conforms to.

The instance always lives at `.konspekt/instance`. That path is a constant of
this binding, not a setting: this script is what writes it, so a tool that
hardcodes it is conforming rather than assuming.

## Run it

From the root of the repo you want to adopt konspekt (needs Node 18+). Copy this
`setup/` folder into your repo, or clone konspekt and run it from there:

    node setup/init.mjs --name "My Project" --goal "what this project is for"

Review what it wrote, then commit:

    git add .konspekt AGENTS.md CLAUDE.md GEMINI.md && git commit -m "adopt konspekt project state"

Or let the script do it — add `--push`. It is idempotent: it refuses to clobber
an existing `.konspekt/instance/`, and it skips an agent-file stanza already
present.

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

  It ships the checker with it: `lib/conformance.mjs` and `lib/validate.mjs` are
  installed as projections of konspekt's own copies, so a second repo needs
  nothing pre-vendored and `--check` catches it if the vendored copy is edited.
  Same `workflows` scope caveat as above.

  Fails on **errors only**. `edge-domain-range` and the status-vocabulary
  warnings are the open subject of `spec/architecture/SCHEMA-RECONCILIATION.md`,
  so gating on them would make the build permanently red over an undecided
  question. Add `--strict` to the workflow's validate step when that closes.

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
