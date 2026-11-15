```yaml
id: nw-legacy-ref-error-in-ni-instances
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;7Dz8GrBSolw4mMdLdi-VNkdnvueCG-iQgsidfNDqEVo
  conversationId: howto-video-0.0.15
  timestamp: 2026-11-15T19:10:23Z
  confidence: 0.85
createdAt: 2026-11-15T19:10:23Z
updatedAt: 2026-11-15T19:21:34Z
```
# Noteworthy: a SHA-1 reference in an ni:-form instance is an error

An instance is in the `ni:` form when `project.md` sets `references: ni`
or when `sources/deprecated.md` or `commands/deprecated.md` exists.
`setup/init.mjs` writes `references: ni` into a new instance and
`tools/migrate-ni.mjs` writes it into a migrated one. In an instance in the
`ni:` form, a validator reports a git blob SHA-1 reference outside
`provenance.deprecated` and `deprecated.md` as an **error**. A reader still
accepts the legacy form, so an instance that is not in the `ni:` form stays
valid with SHA-1 references.

This replaces the rule in `spec/architecture/SERIALIZATION.md` § Migration
that reported such a reference in a migrated instance as a warning, never an
error. The explicit field was chosen over detecting the form from content,
because content detection misses a new instance whose first reference is
SHA-1 and turns the mixed state during a migration into an error.
