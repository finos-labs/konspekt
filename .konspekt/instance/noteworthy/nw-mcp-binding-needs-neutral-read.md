```yaml
id: nw-mcp-binding-needs-neutral-read
kind: statement
review: accepted
provenance:
  sourceRef: ni:///sha-256;WOlDn7SaYULJGQOoVZwNMCcTQ3RW0XPZKjVBCuCrGF0
  timestamp: 2026-06-24T01:42:00Z
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 79ded4d46bf3a766907fe37c0d892da433809f82
    contentHash: 79ded4d46bf3a766907fe37c0d892da433809f82
createdAt: 2026-06-24T01:42:00Z
updatedAt: 2026-06-24T01:46:00Z
```
# Noteworthy: An MCP binding is a skin over the core, not an alternative to REST — and the neutral read keeps it conformant

A central-service binding does not choose *between* a REST API and MCP: MCP sits
*over* the same core read/write, so the service is built once and skinned twice
(MCP as the LLM-facing adapter, REST as the everything-else adapter). MCP
complements an API; it does not replace it. The load-bearing consequence: the
neutral, public read the conformance probe requires (`nw-manual-reupload-probe`)
must come from the non-LLM path — raw markdown over a URL / a plain export — not
from the MCP tool surface. An MCP-only central service is *public-ish* but fails
the manual-re-upload probe, because a human cannot export-and-paste the instance
without going through the tool surface; that is the centralized form of the
"neutral-to-dangerous" lock-in the transport contract warns about. So offering
both is not redundancy — the non-MCP read is what proves the binding isn't
capture. Corollary: keep the store dumb (`read`/`write` only); an MCP server that
adjudicates proposals breaks "review lives in the conversation."
