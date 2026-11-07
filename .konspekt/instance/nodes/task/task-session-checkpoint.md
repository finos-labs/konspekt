```yaml
id: task-session-checkpoint
type: task
title: Checkpoint and resume conversation context across sessions, LLMs and venues
status: open
review: accepted
provenance:
  sourceRef: 441a37e735189c3d6447dde1f314cc583893cf81
  contentHash: 441a37e735189c3d6447dde1f314cc583893cf81
  conversationId: session-checkpoint
  timestamp: 2026-11-07T14:18:16Z
  confidence: 0.8
createdAt: 2026-11-07T14:18:16Z
updatedAt: 2026-11-07T15:29:25Z
```
# Task: Checkpoint and resume conversation context across sessions, LLMs and venues

A conversation that ends leaves three things the graph does not hold: the entity it
was bound to, proposals discussed but not persisted, and the numbered open-items list
that never became atoms. A conversation that starts the next day, on a different LLM,
or through a different venue for the same LLM (web, mobile, IDE, CLI) has to re-derive
them, and the first thing it needs is where to bind ([[task-binding-operating-behavior]]).

Scope, as set by the project owner (2026-11-07):

- Two verbs, `checkpoint` and `resume`. `checkpoint` is a human manual command; the
  maintainer does not venture one.
- `checkpoint` appends one row to an append-only log,
  `checkpoints/checkpoints.md`, `| timestamp | entity | source | venue | model | by |`:
  the active entity at checkpoint time, and a `sources/` excerpt holding verbatim the
  binding switches, the pending proposals, and the open-items list as last presented.
  Open items stay verbatim in the excerpt; they are not turned into atoms.
- `resume` reads the last row, makes it the default answer to the first-turn binding
  ask (the human still confirms), and lists the excerpt's open items with the current
  review and status of every id the excerpt names.
- The record format is spec (`SERIALIZATION.md` § Checkpoints, `TRANSPORT.md` verb
  table) and checked by `lib/conformance.mjs`; the prompt wording is host policy in
  `.konspekt/OPERATING.md`, the setup templates, and `setup/WEBMOBILE_SEED.md`.
- The Claude Code `SessionStart` hook injects the last checkpoint row and its excerpt,
  so resume in the CLI and IDE does not depend on the agent finding the file.
- The `TRANSPORT.md` heading for `load`/`sync`/`persist`/`sync_persist` is renamed
  from "checkpoint verbs" to "orchestration verbs", so the word `checkpoint` names
  one verb.
