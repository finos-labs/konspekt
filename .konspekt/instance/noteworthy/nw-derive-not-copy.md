```yaml
id: nw-derive-not-copy
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;QKEExITgMtLUH1cRcfF8CbGjG28RQ2ZPIQ4UcYFKLgY
  timestamp: 2026-06-23T19:00:00Z
  conversationId: setup-and-operating-loop
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 0d635e027c43a6da1a590c6735cbe40f14a47448
    contentHash: 0d635e027c43a6da1a590c6735cbe40f14a47448
createdAt: 2026-06-23T19:00:00Z
updatedAt: 2026-06-23T19:00:00Z
```
# Noteworthy: Distribution is derived, not copied

Outward-facing artifacts (`distribution/`) are a regenerable projection of the
repo root, baked by `distribution/build/distribute.mjs` — not a hand-maintained
copy. A tracking copy of `spec/` would be two sources of truth that drift: the
same dual-authority problem that `reference/` became, one layer out. Root stays
the single source of truth; the projection is stamped with its source commit and
never hand-edited. Frozen `--version` builds are how a release pins, so an
adopter resolves to a spec that does not move under them.
