```yaml
id: nw-filename-id-resolved-by-rename
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;bDogKu_Wwlz6kW-Wc-CIBK1eHaw56iPTKh7d17gDQ8U
  timestamp: 2026-07-19T19:45:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 08ea702eb99991e21726573b73dc5fcf284e60b8
    contentHash: 08ea702eb99991e21726573b73dc5fcf284e60b8
createdAt: 2026-07-19T19:45:00Z
updatedAt: 2026-07-19T19:45:00Z
```
# Noteworthy: filename-equals-id resolved by renaming the files

Supersedes `nw-filename-id-rule-conflict`, which recorded the question as open
and contained one claim that was backwards.

**Decision: the files move, the rule stands.** All 50 non-conforming entity
files — 12 artifacts, 11 concepts, 27 noteworthy — were renamed so the filename
equals the `id`, restoring the type prefix that had been stripped
(`artifacts/spec.md` → `artifacts/artifact-spec.md`,
`noteworthy/timestamp-source-time.md` → `noteworthy/nw-timestamp-source-time.md`).
Nodes and waypoints already complied. Zero content changed: `id` values did not
move, so `edges.md` and every `type:id` reference were untouched throughout.

What the rule buys, and why it won over the practice: an edge reference now maps
to a file path by string manipulation, so a consumer can resolve
`noteworthy:nw-timestamp-source-time` without opening every file to build an
id→path index; and `ls` over a directory reads the inventory without parsing.
The stuttering path (`noteworthy/nw-…`) is the price.

**Correction to the superseded atom.** It asserted that renaming is a breaking
layout change requiring a v2 bump under `SERIALIZATION.md` versioning. That is
backwards. The spec already requires filename to equal `id`, so renaming is
conformance repair *within* v1. Amending the rule would have been the breaking
change, because that is what redefines the layout.

The migration ran through the GitHub MCP rather than `git mv`, because the
connector holds the write credential and the container does not, and the
connector exposes no move operation — only batch create and single-path delete.
Cost: roughly 50 commits, all attributed to the human account, and a per-batch
window in which no entity was duplicated but a directory was half-migrated.
