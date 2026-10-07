```yaml
id: task-acceptance-before-work
type: task
title: Require acceptance before work is bound
status: resolved
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-10-07T12:26:13Z
review: accepted
provenance:
  sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  conversationId: accept-authority-design
  timestamp: 2026-10-07T12:20:00Z
  confidence: 0.85
createdAt: 2026-10-07T12:26:13Z
updatedAt: 2026-10-07T13:57:53Z
```
# Task: Require acceptance before work is bound

Under `basis: accepted`, an acceptor accepts an entity before any work is bound to it. Work is a changed-code row, an executed-command row, or a `resolved` status. Where the harness permits, acceptance also precedes the first file edit. An instruction to start work does not accept the task node.

Scope: the `project.md` field `basis: proposed | accepted`, default `proposed`. Conformance errors under `accepted` for work bound to an entity that is not `accepted`, for a resolved node with an attached decision that is not `accepted`, and for a binding row earlier than the entity's acceptance row. A `timestamp` column on `changes/changed.md`. An order check in `tools/binding-audit.mjs`. An edit-time check in `.claude/hooks/require-binding.sh`.

Success is that a commit bound to a `proposed` entity fails the `validate` and `audit` checks, and that this instance sets `basis: accepted` and passes after its unaccepted bound commits and resolved nodes are reviewed.

Resolved 2026-10-07: five entities carrying proposed bound commits and the six decisions attached to four resolved nodes were accepted (`denisurusov`), the twelve pre-adoption commits were excluded by `basisBaseline` in `.konspekt/binding-audit.json` (set to the authority-and-basis merge `486785c`), and `project.md` now sets `basis: accepted`. `validate` and `binding-audit` both pass under the active policy.
