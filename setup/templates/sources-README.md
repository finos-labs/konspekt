# Sources

Push-based provenance store. Each file is an addressable **source excerpt** —
verbatim text from both sides of the exchange an extraction was drawn from,
written at extraction time. Stored at `sources/sha-256/<hex>.md`, where `<hex>`
is the SHA-256 of the file's raw bytes. Entities cite it as
`provenance.sourceRef: ni:///sha-256;<base64url>` (RFC 6920; the same digest,
base64url without padding); `contentHash` is derived from the reference and is
not stored. Log cells that cite an excerpt (transition, checkpoint and grant
`source`) take the same reference.

- **Verbatim, both sides** — copy the source text; never paraphrase (a rewrite
  reintroduces the non-determinism content-addressing exists to remove).
- **Append-only** — editing text yields a new hash, hence a new file.
- **Verify:** the SHA-256 of `sources/sha-256/<hex>.md` must equal `<hex>`, the
  digest named by the `sourceRef`.

An instance migrated from the older git-blob-SHA-1 form keeps its
`sources/<sha1>.md` files and maps each to its `ni:` reference in
`sources/deprecated.md`. See the konspekt standard
(`spec/architecture/SERIALIZATION.md` § Content references, § Migration).
