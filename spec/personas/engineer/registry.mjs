// konspekt engineer persona — vocabulary registry.
//
// Loaded by the conformance checker ONLY when an instance activates this
// persona (project.md front-matter: `personas: [engineer]`) and the caller
// supplies this module via opts.personas. Core stays persona-agnostic: every
// value the engineer layer contributes lives here, never in the core checker.
//
// Zero dependencies, pure, no I/O — same commitments as lib/conformance.mjs,
// so the neutral checker can import it with no new machinery.
//
// Normative prose: ./SPEC.md

export const persona = "engineer";

// Subtypes this layer defines. `entityType` is the core entity the subtype
// refines; `constrainKind` (optional) pins the entity's core `kind`; `requires`
// lists any extra non-empty fields (none here — an ADR's decision is its body).
export const subtypes = {
  asr: { entityType: "concept", requires: [] },
  adr: { entityType: "waypoint", constrainKind: "decision", requires: [] },
};

// Edge kinds this layer adds, with domain/range in the same shape as core
// EDGE_DOMAIN_RANGE.
export const edges = {
  drives: { from: ["concept"], to: ["waypoint"] }, // ASR -> ADR
};

// Content-addressed provenance channels this layer adds, parallel to sources/.
// A `command:<hash>` reference resolves to `<dir>/<hash><ext>` and verifies by
// git-blob-SHA the same way sources/ does.
export const provenanceRefs = {
  command: { dir: "commands", ext: ".md" },
};

// Executed-command log (not edges). commands/executed.md is an append-only table
// `| entity | command |` binding each LLM-executed command to the entity it was
// about — any entity type — one row per execution, in execution order (row order
// IS the timeline; no stored timestamp). `command` is a content hash resolved via
// the `ref` provenance channel above (command:<hash> -> commands/<hash>.md).
export const commandLog = {
  file: "commands/executed.md",
  ref: "command",
  from: ["node", "concept", "noteworthy", "artifact", "waypoint"],
};

export default { persona, subtypes, edges, provenanceRefs, commandLog };
