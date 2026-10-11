```yaml
id: nw-fleet-remove-fold-translation
kind: decision
review: proposed
provenance:
  sourceRef: 9697c181f76581137f4d92c6629b203cabaeeac3
  contentHash: 9697c181f76581137f4d92c6629b203cabaeeac3
  conversationId: fleet-as-protocol
  timestamp: 2026-10-11T15:28:59Z
  confidence: 0.85
createdAt: 2026-10-11T15:28:59Z
updatedAt: 2026-10-11T15:28:59Z
```
# Noteworthy: the fold translation is removed; proposers author stored-form atoms directly

Proposers author **stored-form** konspekt atoms (the on-disk entity form, with
`review: proposed`) directly, rather than a separate proposal payload format that
the committer translates. The payload-to-stored-form translation — `fold.mjs` and
the `---`-framed payload schema in `outbox.mjs` — is removed.

The committer's write step keeps only verify-and-append: it runs the record-level
checks on the stored-form bytes it receives (the `git hash-object` source probe,
`lib/conformance.mjs`, the binding check, and the origin/namespace anti-spoof) and
appends the atom onto canonical as `review: proposed`. "Fold" now names that
verify-and-append, not a translation.

This realizes the option [[wp-adr-fleet-agentic-committer]] left open and matches
the single-agent case, where a conversation already authors stored-form atoms and
the only code is validation. It narrows [[nw-fleet-canonical-authoritative]],
whose "folds each verified proposal onto canonical" survives as the append;
what is removed is the separate payload format the append used to translate from.

Scopes [[task-agent-fleet]]; refines [[wp-adr-fleet-agentic-committer]] and
relates to [[nw-fleet-canonical-authoritative]].
