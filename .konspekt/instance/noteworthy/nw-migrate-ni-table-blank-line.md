```yaml
id: nw-migrate-ni-table-blank-line
kind: fact
review: accepted
provenance:
  sourceRef: ni:///sha-256;9PMWmzpZRU090yyr9HWTm1gGRMIW1VICJ6merPYAsVs
  conversationId: linkedin-ni-references
  timestamp: 2026-11-15T16:09:54Z
  confidence: 0.7
createdAt: 2026-11-15T16:09:54Z
updatedAt: 2026-11-15T16:11:33Z
```
# Noteworthy: migrate-ni ended a table at a blank line that the checker reads past

Before `afaf1d8`, `migrateTable` in `tools/migrate-ni.mjs` ended a table at
any non-table line, including a blank line. It then took the next data row as
a new header, matched the rows below against the wrong column names, and
rewrote none of them. The conformance checker reads every `|` line of these
files as a row, so it still found those SHA-1 references and reported them as
`legacy-ref-after-migration`. The script exited 0, because it failed only on
checker errors and that code is a warning.

cdm-collateral's first migration hit this: a stray blank line at line 1056 of
`transitions.md` (from its commit `ea620110`, 2026-11-10) left 457
transition rows on SHA-1 references. Removing the blank line changes no row,
and a re-run migrated them.

Since `afaf1d8`, a header is the row directly above a separator row and holds
across blank lines, and a `legacy-ref-after-migration` warning after a real
run fails the script. `test/migrate-ni.test.mjs` carries a blank line inside
its transitions table. Found during [[task-ni-references]].
