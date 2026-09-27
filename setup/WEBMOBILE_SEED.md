# konspekt — web/mobile seed

The repo-native adopter runs `init.mjs`, which writes a konspekt stanza into
`AGENTS.md` so any agent in the working tree discovers the instance and respects
propose-accept. On web and mobile there is no working tree to discover: the
conversation cannot read files it was not handed, cannot see its own
`conversationId`, and cannot auto-pick-up a skill. So the web/mobile equivalent
of the `AGENTS.md` stanza is this — a compact instruction the human places once
into the platform's persistent-context slot (a Claude Project's instructions, a
custom GPT's system prompt, a Gemini Gem), or, lacking a slot, into the first
message of a conversation.

It is a **pointer, not a payload**. It does not teach konspekt; it tells the
conversation to go read konspekt. The knowledge stays in the repos — the spec
and skills in the konspekt standard, the operating policy and instance in your
backend repo — and the seed only orients the conversation and grants intent.
That works because both repos are self-describing (spec, skills, operating
policy, and instance are all legible in place) and because a connector gives the
conversation a way to reach them.

## Place this in your slot

Replace `<owner>/<repo>` with your konspekt backend repo, then paste:

---

This conversation is konspekt-enabled. Two repositories are involved, and every
path below is read from a specific one — do not assume a single repo:

- **Your backend repo — `<owner>/<repo>`.** Holds this project's operating
  policy and live graph. It does not carry the spec or the skills unless you
  vendored them.
- **The konspekt standard — `denisurusov/konspekt`.** Holds the portable spec,
  the maintainer skills, and the persona layers.

Before acting, read the following (via the GitHub connector — or, if your session
has a container, by cloning each repo for a full local pass). Each entry names
the repository it lives in.

From the konspekt standard (`denisurusov/konspekt`):

- `.claude/skills/` — the maintainer skills, especially `konspekt-atom-readiness`
- `spec/data-model/` — the entities, review states, and edge kinds you propose against
- `spec/architecture/` — reconciliation, serialization, transport, review
- `spec/personas/` — optional layers; if your backend repo's
  `.konspekt/instance/project.md` lists `personas`, read
  `spec/personas/<name>/AGENTS.md` for each and operate under it (e.g. `engineer`
  brings ASR/ADR and executed-command provenance)

From your backend repo (`<owner>/<repo>`):

- `.konspekt/OPERATING.md` — this project's operating loop, trigger policy, and
  conversation-binding rule
- `.konspekt/instance/` — the live graph you maintain

Then treat this conversation as konspekt-enabled and operate the loop:

- **Bind at open.** Before any durable work, ask me which entity this
  conversation attaches to — an existing entity (I give the id) or a new one (I
  name the type); propose `investigation` as the default for an exploratory
  start. Honor the `binding:` policy in your backend repo's
  `.konspekt/instance/project.md`: `required` makes the ask unconditional and
  "none" is not a legal answer; `optional` lets me decline, recorded as a
  waypoint. On web/mobile there is no `SessionStart` hook, so nothing enforces
  this ask but you — issue it before anything else.
- As durable atoms crystallize, **propose** them as `review: proposed`. Never self-accept.
- I accept and persist with `sync` / `persist`; the verbs (`pin`, `validate`,
  `resolve`, …) are defined in the spec.
- On acceptance, persist atomically via the GitHub connector, with
  content-addressed provenance (verbatim source excerpt → git blob SHA →
  `contentHash`).

---

## Requirements & limits

- **A GitHub connector with access to both repos.** Read access to the konspekt
  standard (`denisurusov/konspekt`) for the spec and skills, plus read access to
  your backend repo, lets the conversation be context-aware and propose.
  Read-write access to your backend repo is needed for the full persist loop
  (writing entities, rewriting `edges/edges.md`, pushing a commit); the standard
  repo needs read access only.
- **Human-placed, once per project.** Auto-discovery does not happen on
  web/mobile — the seed must be pasted into the slot by a person. This is the
  transport-bound pickup constraint, not a defect of the seed.
- **A container is optional.** If the session exposes one, the maintainer can
  clone the repo and work against a real tree (one-pass reads, real
  `git hash-object` verifies). It is an execution convenience, not the store: the
  durable instance always lives in the repo, and the seed always comes from
  outside.
