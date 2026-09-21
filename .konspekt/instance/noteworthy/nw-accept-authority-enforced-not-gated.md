```yaml
id: nw-accept-authority-enforced-not-gated
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
# Noteworthy: accept authority is enforced by the client, never gated by the store

The accept-authority matrix lives in the **authority layer** as persona policy
and is enforced by the **accepting client** through signature verification and
post-hoc flagging — **never gated by the central store**. The store cannot
compute "persona P may accept atom class C" without becoming an adjudicator, so
authorization is made **auditable** rather than gated: an accept whose signature
does not match the authorization record is detectable after the fact and raises
a flag requiring an action, the same pattern as a rejected app write raising a
UI flag today.

Enforcement gains a second check beyond signature verification: detecting
accept-scope **overlap** as a misconfiguration, since overlap is an invariant
violation under [[nw-unique-acceptor-per-atom]] rather than a policy choice.

Downstream of persona-signing ([[task-signed-accepts]]); enforces
[[task-authority-mechanism]].
