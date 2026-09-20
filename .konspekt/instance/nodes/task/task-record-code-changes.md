```yaml
id: task-record-code-changes
type: task
title: Record the source and config changes associated with a task
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-09-20T16:00:00Z
review: proposed
provenance:
  sourceRef: d018aba3296105d67c74cad3b4cdf996dbe7773f
  contentHash: d018aba3296105d67c74cad3b4cdf996dbe7773f
  conversationId: engineer-executed-provenance
  timestamp: 2026-09-20T16:00:00Z
  confidence: 0.6
createdAt: 2026-09-20T16:00:00Z
updatedAt: 2026-09-20T16:00:00Z
```
# Task: Record the source and config changes associated with a task

Think about capturing the source/config **changes** a task produced — the diffs
or the commits — as provenance parallel to the executed-command log
([[task-executed-provenance-serialization]]), so a task carries not only what
commands ran but what changed. Related to content-addressed provenance
([[concept-content-addressed-provenance]]).

Sequenced **after** [[task-plugin-pop-mode]] — finish the UI work first. Open
questions: granularity (per commit vs per-file diff), storage (content-addressed
like `commands/`, or referenced git commit SHAs), and linkage (task → change,
one-to-many and ordered, like the executed log). Exploratory; confidence low.

Success (framing, not yet built): a task's detail surface can show the changes it
produced, drawn from a recorded change log.
