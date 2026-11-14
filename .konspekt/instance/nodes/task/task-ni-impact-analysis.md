```yaml
id: task-ni-impact-analysis
type: task
title: Verify the impact of ni: source addressing, file by file
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-14T14:31:52Z
review: accepted
provenance:
  sourceRef: 68ef8f82d0b05369b631b6715a607008f414cec7
  contentHash: 68ef8f82d0b05369b631b6715a607008f414cec7
  conversationId: source-uris
  timestamp: 2026-11-14T14:31:52Z
  confidence: 0.8
createdAt: 2026-11-14T14:31:52Z
updatedAt: 2026-11-14T18:35:40Z
```
# Task: Verify the impact of ni: source addressing, file by file

The change list in `docs/design/source-addressing.md` was built from a text
sweep of the repository for addressing terms (`sourceRef`, `contentHash`,
`git hash-object`, blob SHA, `sources/`, `commands/`, `command:`). A text
match shows that a file mentions the scheme, not what has to change in it.

The work: open each listed file and record, per file, the exact change, or
"no change" with the reason. Settle the four questions the sweep raised (parser
depth for `provenance.deprecated` and `locators`, fleet proposal ids, fleet
source hashing, line-ending pins). Check for consumers the sweep cannot find by
text: binary assets (screenshots, the walkthrough video), generated outputs,
and copies of the seed outside the repository. Update the change list in the
design document with the result.

Success is a change list in which every entry names its concrete change, so
[[task-ni-references]] can be implemented from it without a second sweep.
