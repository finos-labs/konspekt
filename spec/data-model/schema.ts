// konspekt schema — reconciled from the canonical data-model design.
//
// Principle: store each fact once; every "inventory" is a query over edges,
// not a stored list. Hierarchy and all cross-links live in one Edge table,
// keyed by `kind`. Every entity carries provenance and a review state, so the
// LLM maintainer's proposals stay auditable.

// ---------- Enums ----------

// `decision` is intentionally absent here: a decision is a Noteworthy item,
// and becomes a Waypoint and/or a Node only under the rules in SPEC.md.
export type NodeType =
  | "goal"
  | "investigation"
  | "experiment"
  | "topic"
  | "task"
  | "note";

export type NodeStatus = "open" | "active" | "resolved" | "abandoned";

export type NoteworthyKind =
  | "fact"
  | "statement"
  | "decision"
  | "assumption"
  | "constraint";

// assumption: unvalidated | validated | refuted
// constraint: active | lifted
export type NoteworthyStatus =
  | "unvalidated"
  | "validated"
  | "refuted"
  | "active"
  | "lifted";

export type WaypointKind = "decision" | "milestone" | "pivot";

export type EntityType =
  | "project"
  | "node"
  | "concept"
  | "noteworthy"
  | "artifact"
  | "waypoint";

export type EdgeKind =
  | "decomposes" // node -> node (goal tree)
  | "mentions"   // node -> concept
  | "relates"    // concept -> concept (untyped; optional weight)
  | "links"      // node -> node (generic "linked to"; untyped, symmetric in
                 // meaning but stored directed; optional weight). The node-level
                 // counterpart to concept `relates`. Domain-flavored typed links
                 // (blocks, depends-on, ...) are left to persona layers, not core.
  | "produces"   // node -> artifact
  | "notes"      // node -> noteworthy
  | "marks"      // waypoint -> node (the branch it sits on / opened)
  | "supersedes";// entity -> entity (new replaces old; superseded = the `to`).
                 // proposed = flagged contradiction; accepted = confirmed.
                 // Persona layers add further EdgeKinds via their registry
                 // (see ../personas/); core carries none of them.

// Per-instance policy for provenance completeness (see ../architecture/BINDING.md).
// `optional` (the default when absent) permits a human to decline binding a
// conversation, recorded as a waypoint; `required` admits no legal unbound state.
// The mandatory-on-every-atom binding rule holds regardless of this value; this
// field only decides whether an explicit non-binding is a legal answer.
export type BindingPolicy = "required" | "optional";

// ---------- Cross-cutting ----------

// Where the maintainer extracted this from. Lets you trust, trace, and undo.
// Provenance is content-addressed: it points at the source TEXT, not at a
// host-supplied conversation/message id the maintainer cannot read from inside
// a chat. See ../architecture/RECONCILIATION.md.
export interface Provenance {
  sourceRef: ContentRef; // RFC 6920 `ni:///sha-256;<base64url>` over the raw
                       // bytes of the source excerpt (sources/sha-256/<hex>.md;
                       // ../architecture/SERIALIZATION.md § Content references).
                       // Verifies iff SHA-256 of the stored bytes equals the
                       // digest. Identity is the hash: edited text -> new hash
                       // -> a new source, so edits need no special-casing.
  contentHash?: string; // LEGACY form only: the git blob SHA-1, equal to a
                       // legacy sourceRef. With an `ni:` sourceRef it is
                       // derived by parsing and NOT stored.
  timestamp: string;   // ISO 8601 — when the source exchange HAPPENED (source
                       // time, not persist time). Binding-independent: never
                       // read from transport metadata (e.g. git commit time).
                       // The timeline key.
  confidence?: number; // 0..1, from the maintainer LLM
  conversationId?: string; // optional grouping metadata when a host exposes it;
                       // host-injected, never minted by the maintainer.
  locators?: Locator[]; // where the excerpt was taken from; never part of its
                       // identity (../architecture/SERIALIZATION.md § Sources)
  deprecated?: DeprecatedProvenance; // the pre-migration reference, kept by the
                       // in-place migration (SERIALIZATION.md § Migration)
}

// A content reference: `ni:///sha-256;<base64url>` (43 unpadded base64url
// characters), or in the legacy form a 40-hex git blob SHA-1. A persona-layer
// channel prefixes its name (`command:ni:///sha-256;...`).
export type ContentRef = string;

export type LocatorKind = "git-permalink" | "conversation" | "chat" | "web";
export interface Locator {
  uri: string;         // its host must be listed in Project.locators.allow
  kind: LocatorKind;
  retrievedAt: string; // ISO 8601
}

// The provenance values an entity carried before migration to `ni:`. History:
// not verified.
export interface DeprecatedProvenance {
  migratedAt: string;  // ISO 8601 — when the migration wrote the new reference
  sourceRef: string;   // the legacy git blob SHA-1
  contentHash?: string;
}

// Everything the maintainer extracts is PROPOSED, then an acceptor accepts or
// rejects (../architecture/REVIEW.md, ../architecture/AUTHORITY.md).
export type Review = "proposed" | "accepted" | "rejected";

// Summaries are regenerated on change — unless a human pins an edit.
export interface Summary {
  text: string;
  origin: "machine" | "human";
  pinned: boolean;   // if true, the maintainer never overwrites it
  updatedAt: string;
}

interface Base {
  id: string;
  createdAt: string;
  updatedAt: string;
  provenance: Provenance;
  review: Review;
  subtype?: string;    // generic persona-layer discriminator. Core recognizes
                       // the FIELD and leaves its VALUES to layers (see
                       // ../personas/) — e.g. the engineer layer's "asr" (on a
                       // Concept) and "adr" (on a Waypoint). Core defines none.
}

// ---------- Entities ----------

export interface Project {
  id: string;
  goal: string;
  summary: Summary;  // composed from node summaries
  createdAt: string;
  updatedAt: string;
  personas?: string[]; // persona layers this instance activates (see
                       // ../personas/). Absent = core-only. e.g. ["engineer"].
  binding?: BindingPolicy; // provenance-completeness policy for this instance
                       // (see ../architecture/BINDING.md). Absent = "optional".
  basis?: Basis;       // whether an entity is accepted before work is bound to
                       // it (../architecture/REVIEW.md § Acceptance before
                       // work). Absent = "proposed".
  grantorAccepts?: GrantorAccepts; // whether a grantor may also hold an accept
                       // grant (../architecture/AUTHORITY.md). Absent = "allowed".
  references?: ReferenceForm; // the content-reference form the instance is
                       // written in (../architecture/SERIALIZATION.md § Content
                       // references). "ni" = every new reference is an
                       // ni:///sha-256 reference. Absent = undeclared.
  store?: StoreDecl;   // where this instance's content is reached
                       // (../architecture/STORAGE.md). Absent = layout convention.
  locators?: { allow: string[] }; // hosts a provenance locator may name
}

export type Basis = "proposed" | "accepted";
export type GrantorAccepts = "allowed" | "forbidden";
export type ReferenceForm = "ni";

export interface GraphNode extends Base {
  type: NodeType;
  title: string;
  summary: Summary;
  status: NodeStatus;
}

export interface Concept extends Base {
  label: string;
  definition?: string;
  aliases: string[];   // surface forms, used for dedup / merge
}

export interface Noteworthy extends Base {
  kind: NoteworthyKind;
  text: string;
  status?: NoteworthyStatus;
}

export interface Artifact extends Base {
  name: string;
  kind?: string;       // doc, code, dataset, link, ...
  location?: string;   // path or URL
  version?: string;
}

export interface Waypoint extends Base {
  kind: WaypointKind;
  description: string;
  timestamp: string;   // when it HAPPENED (distinct from createdAt)
}

// ---------- Edges ----------

export interface EntityRef {
  type: EntityType;
  id: string;
}

// How an instance's content is reached (../architecture/STORAGE.md). Each
// resolve template substitutes {hex}, {b64}, {path}, {id} and {ref}.
export interface StoreDecl {
  kind: string;        // "git", or another binding
  ref?: string;        // the revision or branch the templates read ({ref})
  resolve: {
    source: string;
    command?: string;
    entity: string;
    edges: string;
    checkpoints?: string;
  };
}

// An edge end may address a content-addressed provenance file (e.g. an executed
// command) instead of an entity. It is resolved the way sources/ is — the `ni:`
// reference names <channel-dir>/sha-256/<hex>.md — and is never entified, so it never enters the graph's
// entity set or its orphan/inventory queries. The channel name namespaces the
// ref; specific channels (e.g. the engineer layer's "command") are defined by
// persona layers, not core.
export type ProvenanceRefType = string;
export interface ProvenanceRef {
  type: ProvenanceRefType;  // channel, e.g. "command"
  id: ContentRef;           // content reference of the channel file
}
export type EdgeEndpoint = EntityRef | ProvenanceRef;

export interface Edge extends Base {
  kind: EdgeKind;
  from: EdgeEndpoint;
  to: EdgeEndpoint;
  weight?: number;     // only meaningful for "relates"/"links" — link strength
}

// ---------- State history ----------
//
// One row of the append-only transition log (transitions/transitions.md; see
// ../architecture/SERIALIZATION.md § Transitions). `review` and `status` on an
// entity or edge store the CURRENT value; a Transition records when a value was
// written. Every entity and edge has a birth row (from = null), each later row's
// `from` equals the previous row's `to`, and the last row's `to` equals the
// current value. A Transition is not a graph entity: it has no id, no
// provenance block, and no review state.
export type TransitionField = "review" | "status";
export interface Transition {
  ref: string;             // "type:id" for an entity, "edge:<id>" for an edge
  field: TransitionField;  // an edge has only "review"
  from: string | null;     // previous value; null on the birth row
  to: string;              // value written
  timestamp: string;       // ISO 8601 — when the value was WRITTEN
  source?: ContentRef;     // content reference of the sources/ excerpt
                           // holding the human acceptance or authority verb
  by?: string;             // id of the Principal that wrote the value: the
                           // proposer on "proposed", the acceptor on "accepted"
}

// ---------- Authority ----------
//
// Who may accept (../architecture/AUTHORITY.md; table formats in
// ../architecture/SERIALIZATION.md § Authority). Both are optional: an instance
// that declares no principals has a human acceptor and records no `by`.
export type PrincipalKind = "human" | "agent";
export type PrincipalRole = "grantor";       // held by a human only
export interface Principal {
  id: string;              // unique within the instance
  kind: PrincipalKind;
  roles: PrincipalRole[];
  key?: string;            // reserved for a signing key; unused in v1
}

export type GrantAction = "grant" | "revoke";
export interface Grant {
  scope: string;           // "*" (the entire graph) or "type:id" (one entity
                           // and its subgraph)
  acceptor: string;        // Principal id that may accept inside the scope
  action: GrantAction;     // "revoke" ends the grant for this scope + acceptor
  grantor: string;         // id of a human Principal with the grantor role
  timestamp: string;       // ISO 8601 — when the row was written; the grant is
                           // in force from this time
  source?: ContentRef;     // content reference of the sources/ excerpt
                           // holding the grantor's statement, if any
}

// ---------- Derived views (never stored) ----------
//
//   project concept inventory
//     = concepts c where exists edge(kind="mentions", from: any node, to: c)
//   node concept inventory
//     = concepts c where exists edge(kind="mentions", from: thisNode, to: c)
//   goal tree
//     = edges where kind="decomposes"
//   timeline
//     = waypoints ordered by timestamp
//   open assumptions
//     = noteworthy where kind="assumption" and status="unvalidated"
//   current items
//     = entities with no inbound edge(kind="supersedes")
//   acceptance latency
//     = for a ref, timestamp(review -> "accepted") minus timestamp of the
//       preceding review -> "proposed" transition
//   cycle time
//     = for a node, the interval between two status transitions

export interface Konspekt {
  project: Project;
  nodes: GraphNode[];
  concepts: Concept[];
  noteworthy: Noteworthy[];
  artifacts: Artifact[];
  waypoints: Waypoint[];
  edges: Edge[];
  transitions?: Transition[];  // absent when the instance records no history
  principals?: Principal[];    // absent when the instance declares none
  grants?: Grant[];
}
