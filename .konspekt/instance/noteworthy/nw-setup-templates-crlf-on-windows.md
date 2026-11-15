```yaml
id: nw-setup-templates-crlf-on-windows
kind: fact
review: accepted
provenance:
  sourceRef: ni:///sha-256;W_56WLF6jEkXpz5lIIcXNwJjl1DP5Cpr2iYZMVtkd7w
  conversationId: source-uris
  timestamp: 2026-11-14T20:17:03Z
  confidence: 0.6
createdAt: 2026-11-14T20:17:03Z
updatedAt: 2026-11-15T00:50:13Z
```
# Noteworthy: A scaffold from a Windows checkout copied CRLF templates into the adopter instance

Before `b7c26b7`, `.gitattributes` had no rule for `setup/`. On a checkout
with `core.autocrlf=true`, git wrote the LF-committed files under
`setup/templates/` to the working tree with CRLF, and `setup/init.mjs` copies
those files byte for byte. A scaffold run from such a checkout therefore wrote
CRLF `project.md`, `edges/edges.md`, `transitions/transitions.md` and other
instance files into the adopter repository, although instance markdown is
pinned to LF because the checker hashes raw disk bytes
([[nw-checker-hashes-raw-disk-bytes]]). The observed symptom was two failing
policy-field checks in `test/setup-init.test.mjs`: its `/^binding:.*
/m`
regex does not match `binding: required
`. CI checks out on Linux, so the
failure appeared only locally. `b7c26b7` pinned `setup/templates/**` to LF and
`1a9b140` widened the rule to `setup/**` and `.github/workflows/**`.
