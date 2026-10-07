# konspekt — authority (spec)

Who may accept an atom, who may grant that right, and how both are recorded. `REVIEW.md` owns the rule that an acceptance has an authorized origin. This file defines the identities, the grants, and the scope rule that decide which identity that origin may be.

An instance that declares no principals is unaffected by this file: its acceptor is human (`REVIEW.md`), and no row records who wrote it.

## Terms

- **Principal.** An identity an instance declares. Its `kind` is `human` or `agent`. A principal is what proposes an atom, accepts an atom, or issues a grant. "Principal" is distinct from "the maintainer", which in this standard names the agent that maintains an instance, and from a persona layer (`../personas/`), which is a vocabulary extension.
- **Acceptor.** A principal that holds a grant in force. It may accept the atoms inside that grant's scope.
- **Grantor.** A human principal that holds the `grantor` role. A grantor issues and revokes grants. An agent MUST NOT hold the role.
- **Grant.** A recorded statement that one principal may accept the atoms inside one scope, issued by one grantor at one time.
- **Scope.** The entire graph, or one entity and its subgraph.

## Principals

`authority/principals.md` declares the principals of an instance (`SERIALIZATION.md` § Authority). The file's presence is what makes the rules in this file apply.

- A principal `id` is unique within the instance.
- The registry MUST contain at least one human principal with the `grantor` role. The principal that creates the instance is its first grantor.
- By default a grantor may also hold a grant. An instance forbids that by setting `grantorAccepts: forbidden` on `Project` (`../data-model/SPEC.md`); a grant to a grantor then confers nothing.

## Grants

`authority/grants.md` is an append-only table of grants (`SERIALIZATION.md` § Authority). Each row either grants or revokes the right of one principal to accept inside one scope.

- A grant is in force from its `timestamp` until a later `revoke` row for the same scope and acceptor.
- A row confers or revokes nothing when its scope does not resolve, its acceptor or grantor is not a declared principal, its grantor is not a human with the `grantor` role, its action is not `grant` or `revoke`, or its timestamp cannot be parsed.
- A revocation does not change acceptances written while the grant was in force.

## Scope

A scope is `*`, the entire graph, or `type:id`, one entity and its subgraph.

The subgraph of an entity contains:

- the entity;
- every node reachable from it by `decomposes`;
- every entity attached to one of those nodes by `notes`, `produces`, or `mentions`, and every waypoint that `marks` one of those nodes;
- every edge whose `from` endpoint is in the subgraph.

Membership counts every edge, including a proposed one, so a proposed atom is inside the subgraph of the node it is proposed under. Membership is evaluated on the graph as it is when the rule is checked.

Exactly one scope applies to an atom:

1. Among the entities that enclose the atom and have a grant in force, the one at the smallest distance applies. Distance is the number of `decomposes` and attachment steps from the atom's entity; the entity itself is at distance 0.
2. When no such entity exists, `*` applies if a grant on `*` is in force.
3. When two such entities are at the same smallest distance, no scope applies to the atom until a grantor issues a grant on a nearer entity, which may be the atom's own entity. An accepting client does not accept an atom in that state, and the conformance checker reports a proposed atom in that state as an error.

## Who may accept

1. A principal accepts an atom only while it holds a grant in force on the scope that applies to the atom.
2. More than one principal may hold a grant on the same scope. Any one of them accepts. There is no quorum.
3. An agent never accepts an atom it proposed. An agent accepts only an atom whose `review` birth row names its proposer.
4. An instruction to propose, or to start work, is not an acceptance (`REVIEW.md`).

## The record

The `by` column of `transitions/transitions.md` holds the principal that wrote each value (`SERIALIZATION.md` § Transitions): the proposer on a row that writes `proposed`, the acceptor on a row that writes `accepted`. When an instance declares principals, every row that writes `accepted` MUST name one, and that principal MUST hold a grant in force, at the row's `timestamp`, on the scope that applies to the atom. When several principals hold grants on that scope, `by` names the one that accepted.

## Enforcement

The store does not refuse a write on these rules. They are enforced in two places:

- **The accepting client** checks, before it writes an acceptance, that the acting principal holds a grant in force on the scope that applies to the atom, and does not write otherwise.
- **The conformance checker** reports, after the write, an acceptance that names no principal, names an undeclared principal, was written without a grant in force, or was written by the agent that proposed the atom. Because scope membership is evaluated on the graph as it is when the checker runs, an edge added after an acceptance can place the atom at the same distance from two scopes; for such an atom the checker passes an acceptance by a principal that held a grant on either scope.

## What is not verified

`by` is a declared value. The writer that appends a row also writes its `by`, and nothing in this file prevents a writer from recording another principal's id. The `key` column of the registry is reserved for a signing key; verifying an acceptance against it, and binding a principal id to a legal person, are outside this file.

## Scope of this file

**In:** principals, the grantor role, grants and revocations, the scope rule, the rules for who may accept, the `by` column, and the two enforcement points.

**Out:** how a principal's identity is authenticated, how a grantor is added or removed after the first, and how a client learns which principal is acting. The last is host policy.
