```yaml
id: wp-adr-ni-sha256-references
kind: decision
subtype: adr
timestamp: 2026-11-14T19:30:00Z
review: accepted
provenance:
  sourceRef: ni:///sha-256;idqFoT14UBvBzfEOpS8AD5WPfA1E5Q2PaYK3Vo7RxO4
  conversationId: source-uris
  timestamp: 2026-11-14T19:30:00Z
  confidence: 0.8
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 79351f57f62b5883e4590949d7c1a1061dde8bd8
    contentHash: 79351f57f62b5883e4590949d7c1a1061dde8bd8
createdAt: 2026-11-14T19:30:00Z
updatedAt: 2026-11-14T19:43:57Z
```
# Waypoint: Content references are RFC 6920 ni:///sha-256 URIs over raw bytes

A content reference has the form `ni:///sha-256;<base64url>` (RFC 6920,
"Naming Things with Hashes"). The digest is SHA-256 over the raw bytes of the
stored file, with no git `blob <length>\0` header. The authority part is empty,
so no host enters the graph. `contentHash` is derived from the reference by
parsing and is not stored. Persona channel references keep their prefix:
`command:ni:///sha-256;<digest>`.

Stored files are named by the hex form of the same digest,
`sources/sha-256/<hex>.md` and `commands/sha-256/<hex>.md`, so `sha256sum`
output matches the file name and no file name starts with `-`. Fleet proposal
and claim ids, which name outbox directories, use the same hex form.

Rejected alternative: SWHID (ISO/IEC 18670). SWHID v1 is defined over SHA-1
only, v2 is not final, and no existing konspekt reference uses it.

Consequences: SERIALIZATION.md, `schema.ts` and SPEC.md change the provenance
fields; `lib/conformance.mjs` verifies by SHA-256; the fleet, the
implementation-zero server and the IntelliJ plugin resolve `ni:` references.
The design is `docs/design/source-addressing.md`; the work is
[[task-ni-references]].
