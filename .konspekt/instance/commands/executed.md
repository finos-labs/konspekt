# Executed commands (engineer layer)

Append-only log binding each LLM-executed command to the entity it was about, one
row per execution in execution order (top to bottom is the timeline; there is no
stored timestamp). `command` is the git blob SHA of commands/<command>.md, which
holds the verbatim text. Written push-based at execution time.

Backfill note: these rows reconstruct the IntelliJ-plugin build in first-execution
order; the channel was not live during that work, so repeated runs are collapsed.
New rows below this backfill are recorded live.

| entity | command |
|--------|---------|
| task-intellij-plugin | d7af0071a5c5c218199ba899201ca54d4aa7f1cd |
| task-intellij-plugin | f25c7f09d71aa5746dd2273e70281fa87aabb701 |
| task-intellij-plugin | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-intellij-plugin | 451867baf7eff69f5ea0f475fce6b45054ead873 |
| task-intellij-plugin | 2434825abc523d17270385e39c14c475dd0657cf |
| task-related-commands-view | 665a4a190fbae07725ab359f16eb46eb09f8b24e |
| task-related-commands-view | a507f620c5e3878fed269db1d24794cf843a8ee2 |
