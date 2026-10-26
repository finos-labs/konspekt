```yaml
id: task-persona-brief-spec-drift-check
type: task
title: Conformance check for persona brief vs. SPEC/registry vocabulary drift
status: open
summary:
  origin: human
  pinned: false
  updatedAt: 2026-10-26T21:30:00Z
review: accepted
provenance:
  sourceRef: 6d6895c8f348be0c0168c747d7ba6f2e065b5707
  contentHash: 6d6895c8f348be0c0168c747d7ba6f2e065b5707
  conversationId: fleet-adjustments-persona-drift-2026-10-26
  timestamp: 2026-10-26T21:30:00Z
  confidence: 0.8
createdAt: 2026-10-26T21:30:00Z
updatedAt: 2026-10-26T21:30:00Z
```
# Task: Conformance check for persona brief vs. SPEC/registry vocabulary drift

Add a check to the conformance tooling that flags when a persona's operating
brief (`spec/personas/<name>/AGENTS.md`) describes a binding mechanism its own
normative `SPEC.md` and `registry.mjs` no longer define.

## Why

The engineer brief and its `SPEC.md`/`registry.mjs` had silently diverged on how
an executed command binds to an entity: the brief still prescribed an `executed`
edge carrying a timestamp, which `registry.mjs` does not register and the core
edge table cannot serialize, while `SPEC.md` and `registry.mjs` had moved to the
append-only log `commands/executed.md`. Because agents operate from `AGENTS.md`,
the stale brief drove real wrong behavior: the `cdm-collateral` fleet dogfood
(2026-10-26) had one session propose widening the core edge table while an
earlier session in the same instance had correctly written 73 rows to
`commands/executed.md`. One instance, two behaviors, from one undetected drift.

The brief was corrected in commit `e653470` (bound to `[[task-fleet-adjustments]]`),
but nothing would have caught the drift automatically or would catch the next one.

## Shape (to design)

The check compares each persona's three surfaces for a shared vocabulary:

- `registry.mjs` is authoritative for the registered edge kinds, the command and
  changed-code logs, and the provenance refs.
- `AGENTS.md` and `SPEC.md` are prose. A full semantic diff is out of scope; the
  tractable first cut flags a brief that names a construct the registry does not
  register — for example an edge `kind` that appears in `AGENTS.md` but is absent
  from the registry's `edges` export.

Open design points: how much of the prose to parse (registered-token mentions
vs. deeper structure), whether to warn or error, and whether the check lives in
`lib/conformance.mjs` (runs under the conformance harness) or in a separate lint
step. These are decided when the task is taken; it is `open`, not scheduled.

Decomposes [[task-agent-fleet]]. Surfaced while working
[[task-fleet-adjustments]] (the brief fix itself landed there).
