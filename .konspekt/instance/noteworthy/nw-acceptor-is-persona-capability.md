```yaml
id: nw-acceptor-is-persona-capability
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
# Noteworthy: the acceptor is a persona holding an accept capability

Acceptor identity is not a new concept: it is a persona holding an **accept
capability**, reusing goal-accountability's bindable, signable persona
identity — never a raw human-vs-machine flag. This is the one mechanism the
whole accept-authority spectrum reduces to; the only axis that varies is how
many personas hold the capability and how their scopes are drawn.

Every accept traces to a legally bound signer. Acceptance is the act that admits
an output into the accepted graph, so it is the act that must carry
responsibility. A machine persona may accept **iff** it is bound and its
binding traces to the human quorum that admitted it — delegated authority in the
ordinary sense, where the delegator stays accountable for the delegation.
"Only human can accept" is the degenerate case of this single mechanism, not a
separate one.

Binds [[goal-accountability]] to [[task-authority-mechanism]]; the signing rule
is carried by [[task-signed-accepts]].
