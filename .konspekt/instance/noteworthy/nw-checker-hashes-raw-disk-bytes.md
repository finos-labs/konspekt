```yaml
id: nw-checker-hashes-raw-disk-bytes
kind: statement
review: accepted
provenance:
  sourceRef: b84968a4c646e0d05955fc0dcd5d04e7e786d270
  contentHash: b84968a4c646e0d05955fc0dcd5d04e7e786d270
  timestamp: 2026-09-10T09:00:00Z
createdAt: 2026-09-10T09:00:00Z
updatedAt: 2026-09-10T09:00:00Z
```
# Noteworthy: The conformance checker hashes raw disk bytes, so autocrlf=true reports false content-hash mismatches on a Windows checkout

The checker reads each source excerpt with `readFileSync` and hashes the bytes
on disk (`lib/conformance.mjs`). Git, under `core.autocrlf=true`, checks
LF-committed excerpts out as CRLF on Windows, so the on-disk bytes differ from
the committed blob. `git hash-object` normalizes CRLF→LF and returns the stored
hash (git and `git status` see the file as clean), but the checker's raw-byte
hash does not match the stored `contentHash`, producing `content-hash-mismatch`
errors that exist only in the local Windows working tree. CI checks out on Linux
(LF), where raw bytes equal the committed blob, so the errors do not appear
there. A source excerpt authored with LF endings — not checked out through the
autocrlf filter — hashes identically both ways and is unaffected. A
`.gitattributes` pinning the instance to `eol=lf` would remove the local noise by
keeping working-tree bytes equal to the committed blob.
