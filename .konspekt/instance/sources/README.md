# Sources

Push-based provenance store. Each file here is an addressable **source excerpt**
— the text an extraction was drawn from — written at extraction time. Entities
cite it through `provenance.sourceRef` (`spec/data-model/schema.ts`).

Convention:

- A source excerpt is stored at `instance/sources/sha-256/<hex>.md`, where
  `<hex>` is the SHA-256 of the file's raw bytes.
- An entity's `provenance.sourceRef` is `ni:///sha-256;<base64url>` (RFC 6920),
  the same digest in base64url without padding. `contentHash` is derived from
  the reference and is not stored. Transition, checkpoint and grant `source`
  cells take the same reference.
- **Verify probe:** the SHA-256 of `instance/sources/sha-256/<hex>.md` must
  equal `<hex>`. A mismatch means the excerpt was edited after construction.
- **Migrated history.** This instance was migrated in place on 2026-11-14.
  The older `instance/sources/<sha1>.md` files, named by their git blob SHA-1,
  are kept; `deprecated.md` maps each to its `ni:` reference, and each migrated
  entity keeps its old `sourceRef` and `contentHash` under
  `provenance.deprecated`. New excerpts use only the `sha-256/` form; the
  checker warns on a new SHA-1 reference (`legacy-ref-after-migration`).
- **Verbatim, both sides.** An excerpt copies the source text from every
  participating turn — human prompts *and* assistant responses — selected (which
  spans to keep, eliding the rest) but **never paraphrased**. Rewriting a span
  reintroduces the non-determinism content-addressing exists to remove, turning
  the excerpt into an atom in disguise that no longer hashes to the real source.
  The asymmetry to avoid: capturing the human verbatim while summarizing the
  assistant. Both sides are source. (See `spec/architecture/SERIALIZATION.md`.)
- Excerpts are **append-only and content-addressed**: editing text yields a new
  hash, hence a new file, never a mutation of an existing one.

This directory is the first operation of the content-addressed provenance
mechanism (`task-provenance-model`). Entities predating it still carry only
`conversationId` + `timestamp`; their backfill is human-assisted — paste the
verbatim export, capture it here.
