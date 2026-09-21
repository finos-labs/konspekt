```yaml
id: nw-unique-acceptor-per-atom
kind: decision
review: accepted
provenance:
  sourceRef: 7a4c18fa5e2285df902a347033daed7611423d67
  contentHash: 7a4c18fa5e2285df902a347033daed7611423d67
  conversationId: fleet-authority
  timestamp: 2026-09-21T00:53:00Z
  confidence: 0.95
createdAt: 2026-09-21T00:53:00Z
updatedAt: 2026-09-21T00:53:00Z
```
# Noteworthy: unique authorized acceptor per atom

Invariant: **at most one persona holds accept authority for any given atom at
any time.** Accept scopes must partition; overlapping accept scopes are
forbidden.

This prevents the **acceptor-vs-acceptor contradiction problem** by
construction — two personas can never accept contradictory proposals about the
same atom, because only one persona may accept it. It closes a carried-forward
open design item the monotonic accept flip could not: the flip never had to
prevent the contradiction; uniqueness does, by never permitting two acceptors on
one atom. The cost is that the authorization matrix must partition rather than
arbitrate, and arbitration of overlapping acceptors is therefore never built.

Applies to **acceptance only**, not to proposing. Constrains
[[task-authority-mechanism]] and the predicate design in
[[nw-accept-scope-open-predicate]].
