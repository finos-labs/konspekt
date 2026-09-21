```yaml
id: nw-first-fleet-level-triage-and-scoped-propose
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
# Noteworthy: first fleet level is human-only accept + machine triage + scoped propose

The first fleet level is **human-only accept with machine triage, plus scoped
agent proposals**. Machine personas rank, dedup, cluster, and pre-mark likely
accepts; the human still performs every accept. No machine signs, so
accountability is unchanged — which is precisely why this level ships **before**
persona-signing. It is where goal-observability earns its place, relieving the
one-reviewer-over-a-fleet throughput bottleneck.

**Propose scope** is a set of `(entity type, atom state)` pairs the fleet may
target. New-atom proposals target a type; transition proposals (the verb set:
validate, refute, resolve, supersede, lift) target an existing atom in a given
state. Propose scope is a **capability** boundary and **may overlap** — it does
not partition. The uniqueness invariant applies to acceptance only
([[nw-unique-acceptor-per-atom]]); importing the partition rule onto the propose
side would throttle the fleet for no reason, since propose is grow-only and
meaning-free.

Default propose set: the fleet may propose new **Noteworthy** and **Artifact**
atoms freely, and transition verbs against atoms in the **proposed** state.
**Concept** creation and any targeting of **accepted-state** atoms are config
toggles, default off — widening to fleet-driven correction of accepted state is
a deliberate opt-in, at the cost of the fleet re-opening work already signed.

Scopes [[task-agent-fleet]]; consumes [[goal-observability]]; connects to
[[task-review-ergonomics]].
