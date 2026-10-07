```yaml
id: nw-grant-scope-is-entity-subgraph
kind: decision
review: proposed
provenance:
  sourceRef: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  contentHash: 1d195ff1d54002f160df6c3ccf8439f6d382c9f7
  conversationId: accept-authority-design
  timestamp: 2026-10-07T12:20:00Z
  confidence: 0.85
createdAt: 2026-10-07T12:33:57Z
updatedAt: 2026-10-07T12:33:57Z
```
# Noteworthy: a grant's scope is the entire graph or one entity's subgraph

The scope of a grant is the entire graph, or one node and its subgraph. Scopes
by entity type, kind, subtype, or id pattern are not part of the model.

**Subgraph membership.** A node reachable by `decomposes`; an entity attached to
such a node by `notes`, `produces`, or `mentions`; a waypoint that `marks` such
a node; and an edge whose `from` endpoint qualifies. Membership counts proposed
edges and is evaluated on the current graph.

**Which grant applies.** The grant on the nearest enclosing entity applies. The
whole-graph grant applies only when no entity scope encloses the atom.

**Two scopes at the same distance.** Four nodes in this instance have more than
one parent. A proposed atom at the same distance from two granted entities is a
conformance error until a grantor issues a grant on a nearer entity.

One extension beyond the statement "one node and its subgraph": a scope may name
any entity, so that a noteworthy item attached to nodes in two scopes can be
given a grant of its own.

Proposes to supersede `nw-accept-scope-open-predicate`, which scoped accept
authority by an open predicate. Graph position replaces the predicate.

Notes [[task-authority-mechanism]].
