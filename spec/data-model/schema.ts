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

// ---------- Cross-cutting ----------

// Where the maintainer extracted this from. Lets you trust, trace, and undo.
// Provenance is content-addressed: it points at the source TEXT, not at a
// host-supplied conversation/message id the maintainer cannot read from inside
// a chat. See ../architecture/RECONCILIATION.md.
export interface Provenance {
  sourceRef: string;   // content-pinned address of the source excerpt
                       // (e.g. a git blob SHA or `path@commit`)
  contentHash: string; // digest of that source text, captured at construction
                       // time. Verifies iff re-hashing sourceRef reproduces it.
                       // In the GitHub binding the blob SHA IS this hash, so the
                       // invariant holds structurally. Identity is the hash:
                       // edited text -> new hash -> a new source, so edits need
                       // no special-casing.
  timestamp: string;   // ISO 8601 — when the source exchange HAPPENED (source
                       // time, not persist time). Binding-independent: never
                       // read from transport metadata (e.g. git commit time).
                       // The timeline key.
  confidence?: number; // 0..1, from the maintainer LLM
  conversationId?: string; // optional grouping metadata when a host exposes it;
                       // host-injected, never minted by the maintainer.
}

// Everything the maintainer extracts is PROPOSED, then a human accepts/rejects.
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
}

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

// An edge end may address a content-addressed provenance file (e.g. an executed
// command) instead of an entity. It is resolved the way sources/ is — filename
// == git blob SHA == id — and is never entified, so it never enters the graph's
// entity set or its orphan/inventory queries. The channel name namespaces the
// ref; specific channels (e.g. the engineer layer's "command") are defined by
// persona layers, not core.
export type ProvenanceRefType = string;
export interface ProvenanceRef {
  type: ProvenanceRefType;  // channel, e.g. "command"
  id: string;               // contentHash of <channel>/<id>.md (git blob SHA)
}
export type EdgeEndpoint = EntityRef | ProvenanceRef;

export interface Edge extends Base {
  kind: EdgeKind;
  from: EdgeEndpoint;
  to: EdgeEndpoint;
  weight?: number;     // only meaningful for "relates"/"links" — link strength
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

export interface Konspekt {
  project: Project;
  nodes: GraphNode[];
  concepts: Concept[];
  noteworthy: Noteworthy[];
  artifacts: Artifact[];
  waypoints: Waypoint[];
  edges: Edge[];
}
