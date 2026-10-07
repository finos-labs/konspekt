// konspekt conformance — the shared instance reader and checker.
//
// NEUTRAL BY DESIGN. This module belongs to neither `setup/` nor `visual/`;
// both import it, and neither imports the other. It exists because the parser
// and the conformance rules were previously embedded in the visualizer's build
// step, where an adopter never saw them and a second copy would inevitably
// drift (nw-derive-not-copy).
//
// Design commitments:
//   - Zero dependencies. Node only.
//   - Never throws on a broken instance. A broken instance is exactly when you
//     most want a report, so everything malformed becomes a `problem`.
//   - Pure. No wall-clock, no network, no git subprocess. The provenance verify
//     probe recomputes the git blob SHA arithmetically, so it works on a plain
//     directory with no repository present.
//   - Entities are keyed on the in-file `id`, never on the filename. Path is
//     not identity (nw-rename-fires-as-creation).
//   - Persona-agnostic. Persona layers (spec/personas/) add subtypes, edge
//     kinds, and provenance channels; this module merges a supplied registry
//     but hard-codes no layer value, and given none behaves exactly as core.
//
// Normative sources: ../spec/data-model/schema.ts, ../spec/architecture/SERIALIZATION.md,
// ../spec/personas/

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";
import {
  PRINCIPAL_KINDS, PRINCIPAL_ROLES, GRANT_ACTIONS, WHOLE_GRAPH,
  parsePrincipals, parseGrants, scopeEntityId, buildScopeIndex, acceptorsAt,
} from "./authority.mjs";

export const SERIALIZATION_VERSION = "v1";

// ---------- vocabularies (spec/data-model/schema.ts) ----------

export const NODE_TYPES = ["goal", "investigation", "experiment", "topic", "task", "note"];
export const NODE_STATUSES = ["open", "active", "resolved", "abandoned"];
export const NOTEWORTHY_KINDS = ["fact", "statement", "decision", "assumption", "constraint"];
export const WAYPOINT_KINDS = ["decision", "milestone", "pivot"];
export const REVIEWS = ["proposed", "accepted", "rejected"];
// Project.basis: whether work may be bound to an entity before it is accepted
// (spec/architecture/REVIEW.md § Acceptance before work).
export const BASES = ["proposed", "accepted"];
// Project.grantorAccepts: whether a grantor may also hold an accept grant
// (spec/architecture/AUTHORITY.md).
export const GRANTOR_ACCEPTS = ["allowed", "forbidden"];
export const ENTITY_TYPES = ["project", "node", "concept", "noteworthy", "artifact", "waypoint"];

// A NoteworthyStatus is only meaningful for two kinds; the others have no
// vocabulary and should carry no status at all.
export const NOTEWORTHY_STATUS_BY_KIND = {
  assumption: ["unvalidated", "validated", "refuted"],
  constraint: ["active", "lifted"],
};

// Edge domain/range exactly as schema.ts declares it. Enforced as WARNINGS,
// not errors: the 2026-07-20 census settled that the spec is right and one
// instance needs migrating, but the migration has not happened yet, so failing
// a build on it would only make the check unreadable.
export const EDGE_DOMAIN_RANGE = {
  decomposes: { from: ["node"], to: ["node"] },
  mentions: { from: ["node"], to: ["concept"] },
  relates: { from: ["concept"], to: ["concept"] },
  links: { from: ["node"], to: ["node"] },
  produces: { from: ["node"], to: ["artifact"] },
  notes: { from: ["node"], to: ["noteworthy"] },
  marks: { from: ["waypoint"], to: ["node"] },
  supersedes: { from: ENTITY_TYPES, to: ENTITY_TYPES },
};
export const EDGE_KINDS = Object.keys(EDGE_DOMAIN_RANGE);

// Fields the schema defines per entity type. Primary prose lives in the
// Markdown body per SERIALIZATION.md, so `summary.text`, `definition`, `text`
// and `description` are deliberately NOT front-matter fields. `subtype` is the
// generic persona discriminator (values defined by layers, not core).
const BASE_FIELDS = ["id", "createdAt", "updatedAt", "provenance", "review", "subtype"];
export const KNOWN_FIELDS = {
  project: ["id", "goal", "summary", "createdAt", "updatedAt", "personas", "basis", "grantorAccepts"],
  node: [...BASE_FIELDS, "type", "title", "summary", "status"],
  concept: [...BASE_FIELDS, "label", "aliases"],
  noteworthy: [...BASE_FIELDS, "kind", "status"],
  artifact: [...BASE_FIELDS, "name", "kind", "location", "version"],
  waypoint: [...BASE_FIELDS, "kind", "timestamp"],
};
const REQUIRED_FIELDS = {
  node: ["type", "title", "status"],
  concept: ["label"],
  noteworthy: ["kind"],
  artifact: ["name"],
  waypoint: ["kind", "timestamp"],
};

const ENTITY_DIRS = [
  { type: "concept", dir: "concepts", prefix: "concept-", collection: "concepts" },
  { type: "noteworthy", dir: "noteworthy", prefix: "nw-", collection: "noteworthy" },
  { type: "artifact", dir: "artifacts", prefix: "artifact-", collection: "artifacts" },
  { type: "waypoint", dir: "waypoints", prefix: "wp-", collection: "waypoints" },
];

// ---------- git blob SHA, computed rather than shelled out ----------
//
// `git hash-object` is sha1("blob <byteLength>\0" + bytes). Reimplementing it
// keeps this module pure and lets the verify probe run on a directory that is
// not a git repository at all — which matters, because the manual re-upload
// probe deliberately exercises a non-git path.

export function gitBlobSha(buf) {
  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, "utf8");
  return createHash("sha1")
    .update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`, "utf8"), bytes]))
    .digest("hex");
}

// ---------- a small YAML-subset parser (just enough for konspekt v1) ----------
//
// Supports: `key: scalar`, one level of nested maps, inline flow arrays
// `[a, b, c]`, and folded/literal block scalars. Deliberately narrow; if
// front-matter ever outgrows it, swap in a real YAML library here and nowhere
// else.

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function coerce(raw) {
  if (raw === "" || raw === undefined) return "";
  const v = raw.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null" || v === "~") return null;
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (inner === "") return [];
    return inner.split(",").map((s) => stripQuotes(s.trim()));
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return stripQuotes(v);
}

const indentOf = (line) => line.length - line.replace(/^ +/, "").length;

export function parseYamlSubset(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const root = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) { i++; continue; }
    const indent = indentOf(line);
    const m = line.trim().match(/^([A-Za-z0-9_$.-]+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    const rest = m[2];

    if (rest === ">" || rest === ">-" || rest === "|" || rest === "|-") {
      const folded = rest.startsWith(">");
      const collected = [];
      i++;
      while (i < lines.length && (lines[i].trim() === "" || indentOf(lines[i]) > indent)) {
        collected.push(lines[i].slice(indent + 2));
        i++;
      }
      root[key] = folded
        ? collected.join(" ").replace(/\s+/g, " ").trim()
        : collected.join("\n").trimEnd();
      continue;
    }

    if (rest === "" && i + 1 < lines.length && lines[i + 1].trim() !== "" &&
        indentOf(lines[i + 1]) > indent) {
      const sub = {};
      i++;
      while (i < lines.length && (lines[i].trim() === "" || indentOf(lines[i]) > indent)) {
        if (lines[i].trim() === "") { i++; continue; }
        const sm = lines[i].trim().match(/^([A-Za-z0-9_$.-]+):\s*(.*)$/);
        if (sm) sub[sm[1]] = coerce(sm[2]);
        i++;
      }
      root[key] = sub;
      continue;
    }

    root[key] = coerce(rest);
    i++;
  }
  return root;
}

export function splitEntityFile(text) {
  const t = text.replace(/\r\n/g, "\n");
  const fence = t.match(/^```ya?ml\n([\s\S]*?)\n```\s*\n?/);
  if (!fence) return { front: {}, body: t.trim(), noFrontmatter: true };
  return { front: parseYamlSubset(fence[1]), body: t.slice(fence[0].length).trim() };
}

// ---------- the loader ----------

/**
 * Read an instance directory and check it. Never throws.
 *
 * @param {string} instanceDir
 * @param {{filenameRule?: "strict"|"slug-ok", checkSources?: boolean,
 *          personas?: object[]}} opts
 *   filenameRule  "strict" (default) requires filename === id, as
 *                 SERIALIZATION.md does. "slug-ok" also accepts the
 *                 pre-2026-07-19 bare-slug filename, for unmigrated instances.
 *   checkSources  verify provenance against sources/ (default true).
 *   personas      persona-layer registry modules (see spec/personas/). Each is
 *                 a plain object { persona, subtypes?, edges?, provenanceRefs? }.
 *                 The caller reads project.personas and supplies the matching
 *                 registries; this module merges what it is given and stays
 *                 path-agnostic. Given none, behaviour is exactly core.
 */
export function loadInstance(instanceDir, opts = {}) {
  const filenameRule = opts.filenameRule || "strict";
  const checkSources = opts.checkSources !== false;

  const problems = [];
  const problem = (severity, code, message, ref) =>
    problems.push({ severity, code, message, ref: ref || null });

  // ----- persona layers (opts.personas) -----
  // Registries are supplied by the caller (validate.mjs / snapshot.mjs), which
  // reads project.personas and imports each spec/personas/<name>/registry.mjs.
  // Merging what it is handed keeps this module pure and free of any assumption
  // about where a layer lives on disk.
  const registries = Array.isArray(opts.personas) ? opts.personas : [];
  const suppliedPersonas = new Set(registries.map((r) => r && r.persona).filter(Boolean));
  const subtypeDefs = {};
  const extraEdges = {};
  const provRefKinds = {};
  let commandLog = null;
  let changeLog = null;
  for (const reg of registries) {
    if (!reg) continue;
    Object.assign(subtypeDefs, reg.subtypes || {});
    Object.assign(extraEdges, reg.edges || {});
    Object.assign(provRefKinds, reg.provenanceRefs || {});
    if (reg.commandLog) commandLog = reg.commandLog;
    if (reg.changeLog) changeLog = reg.changeLog;
  }
  const edgeDomainRange = { ...EDGE_DOMAIN_RANGE, ...extraEdges };
  const edgeKinds = Object.keys(edgeDomainRange);

  const byId = new Map();
  const collections = {
    project: null, nodes: [], concepts: [], noteworthy: [], artifacts: [], waypoints: [],
  };

  const register = (entity, relFile) => {
    if (!entity.id) {
      problem("error", "missing-id", `entity in ${relFile} has no id`, relFile);
      return false;
    }
    if (byId.has(entity.id)) {
      problem("error", "duplicate-id",
        `id "${entity.id}" appears in both ${byId.get(entity.id)._file} and ${relFile}`,
        entity.id);
      return false;
    }
    byId.set(entity.id, entity);
    return true;
  };

  // ----- shared per-entity checks -----

  const sourcesDir = join(instanceDir, "sources");

  const checkEntity = (e) => {
    const known = KNOWN_FIELDS[e.entityType] || [];
    const required = REQUIRED_FIELDS[e.entityType] || [];

    for (const f of required) {
      if (e[f] === undefined || e[f] === "" || e[f] === null) {
        problem("warning", "missing-field", `${e.entityType} "${e.id}" has no ${f}`, e.id);
      }
    }

    // Fields the schema does not define for this entity type.
    for (const f of Object.keys(e)) {
      if (f.startsWith("_") || f === "body" || f === "entityType") continue;
      if (!known.includes(f)) {
        problem("info", "unexpected-field",
          `${e.entityType} "${e.id}" carries "${f}", which the schema does not define for it`,
          e.id);
      }
    }

    const enumCheck = (field, allowed) => {
      const v = e[field];
      if (v === undefined || v === "" || v === null) return;
      if (!allowed.includes(v)) {
        problem("warning", "unknown-enum",
          `${e.entityType} "${e.id}" has ${field} "${v}", not in [${allowed.join(", ")}]`, e.id);
      }
    };

    if (e.entityType !== "project") enumCheck("review", REVIEWS);
    if (e.entityType === "node") {
      enumCheck("type", NODE_TYPES);
      enumCheck("status", NODE_STATUSES);
    }
    if (e.entityType === "waypoint") enumCheck("kind", WAYPOINT_KINDS);
    if (e.entityType === "noteworthy") {
      enumCheck("kind", NOTEWORTHY_KINDS);
      const allowed = NOTEWORTHY_STATUS_BY_KIND[e.kind];
      if (e.status !== undefined && e.status !== "" && e.status !== null) {
        if (!allowed) {
          problem("warning", "status-without-vocabulary",
            `noteworthy "${e.id}" is kind "${e.kind}", which has no status vocabulary, ` +
            `but carries status "${e.status}"`, e.id);
        } else if (!allowed.includes(e.status)) {
          problem("warning", "unknown-enum",
            `noteworthy "${e.id}" (${e.kind}) has status "${e.status}", ` +
            `not in [${allowed.join(", ")}]`, e.id);
        }
      }
    }

    // Subtype: a layer-defined discriminator. Unknown subtype (declared by no
    // active persona) warns; a subtype on the wrong entity type or wrong core
    // kind warns; any subtype-required field that is missing warns.
    if (e.subtype !== undefined && e.subtype !== "" && e.subtype !== null) {
      const def = subtypeDefs[e.subtype];
      if (!def) {
        problem("warning", "unknown-subtype",
          `${e.entityType} "${e.id}" has subtype "${e.subtype}", which no active persona declares`,
          e.id);
      } else {
        if (def.entityType && def.entityType !== e.entityType) {
          problem("warning", "subtype-entity-mismatch",
            `subtype "${e.subtype}" is defined for ${def.entityType}, ` +
            `but "${e.id}" is a ${e.entityType}`, e.id);
        }
        if (def.constrainKind && e.kind !== def.constrainKind) {
          problem("warning", "subtype-kind-mismatch",
            `${e.entityType} "${e.id}" has subtype "${e.subtype}" but kind "${e.kind}", ` +
            `which requires kind "${def.constrainKind}"`, e.id);
        }
        for (const f of def.requires || []) {
          if (e[f] === undefined || e[f] === "" || e[f] === null) {
            problem("warning", "missing-field",
              `${e.entityType} "${e.id}" (subtype ${e.subtype}) has no ${f}`, e.id);
          }
        }
      }
    }

    // Provenance. Entities predating the content-addressed mechanism may carry
    // provenance without sourceRef/contentHash; SERIALIZATION.md says their
    // backfill is a separate pass, so that is `info`, not a failure.
    if (e.entityType !== "project") {
      const p = e.provenance;
      if (!p || typeof p !== "object") {
        problem("warning", "missing-provenance",
          `${e.entityType} "${e.id}" has no provenance block`, e.id);
      } else {
        if (!p.timestamp) {
          problem("warning", "missing-field",
            `${e.entityType} "${e.id}" provenance has no timestamp`, e.id);
        }
        if (!p.sourceRef || !p.contentHash) {
          problem("info", "provenance-not-content-addressed",
            `${e.entityType} "${e.id}" predates content-addressed provenance ` +
            `(no sourceRef/contentHash); awaiting backfill`, e.id);
        } else if (checkSources) {
          if (p.sourceRef !== p.contentHash) {
            problem("warning", "sourceref-hash-divergence",
              `${e.entityType} "${e.id}" has sourceRef "${p.sourceRef}" != contentHash ` +
              `"${p.contentHash}"; in the git binding the blob SHA is the hash`, e.id);
          }
          const srcPath = join(sourcesDir, `${p.sourceRef}.md`);
          if (!existsSync(srcPath)) {
            problem("error", "dangling-source",
              `${e.entityType} "${e.id}" points at sources/${p.sourceRef}.md, which is missing`,
              e.id);
          } else {
            const actual = gitBlobSha(readFileSync(srcPath));
            if (actual !== p.contentHash) {
              problem("error", "content-hash-mismatch",
                `${e.entityType} "${e.id}": sources/${p.sourceRef}.md hashes to ${actual}, ` +
                `but contentHash says ${p.contentHash}`, e.id);
            }
          }
        }
      }
    }
  };

  // ----- project.md -----

  const projectPath = join(instanceDir, "project.md");
  if (existsSync(projectPath)) {
    const { front, body } = splitEntityFile(readFileSync(projectPath, "utf8"));
    collections.project = { entityType: "project", ...front, body, _file: "project.md" };
    if (front.id) byId.set(front.id, collections.project);
    checkEntity(collections.project);
    // A persona the instance activates but whose registry was not supplied is
    // checked only against core rules; flag it so the gap is visible.
    const activated = collections.project.personas;
    if (Array.isArray(activated)) {
      for (const name of activated) {
        if (!suppliedPersonas.has(name)) {
          problem("info", "persona-not-loaded",
            `project activates persona "${name}", but its registry was not supplied; ` +
            `only core rules are applied for it`, collections.project.id || "project");
        }
      }
    }
  } else {
    problem("error", "missing-project", "instance has no project.md", null);
  }

  // ----- nodes/<type>/*.md -----

  const nodesDir = join(instanceDir, "nodes");
  if (existsSync(nodesDir)) {
    for (const typeDir of readdirSync(nodesDir).sort()) {
      const full = join(nodesDir, typeDir);
      if (!statSync(full).isDirectory()) continue;
      for (const f of readdirSync(full).sort()) {
        if (!f.endsWith(".md")) continue;
        const rel = `nodes/${typeDir}/${f}`;
        const { front, body } = splitEntityFile(readFileSync(join(full, f), "utf8"));
        const e = { entityType: "node", ...front, body, _file: rel };
        if (!register(e, rel)) continue;
        collections.nodes.push(e);
        if (f.replace(/\.md$/, "") !== e.id) {
          problem("warning", "filename-id-divergence",
            `file "${rel}" holds id "${e.id}" (node filenames must equal the id)`, e.id);
        }
        if (e.type && typeDir !== e.type) {
          problem("warning", "node-dir-mismatch",
            `node "${e.id}" has type "${e.type}" but lives under nodes/${typeDir}/`, e.id);
        }
        checkEntity(e);
      }
    }
  }

  // ----- flat entity dirs -----

  for (const { type, dir, prefix, collection } of ENTITY_DIRS) {
    const full = join(instanceDir, dir);
    if (!existsSync(full)) continue;
    for (const f of readdirSync(full).sort()) {
      if (!f.endsWith(".md")) continue;
      const rel = `${dir}/${f}`;
      const { front, body } = splitEntityFile(readFileSync(join(full, f), "utf8"));
      const e = { entityType: type, ...front, body, _file: rel };
      if (!register(e, rel)) continue;
      collections[collection].push(e);
      const base = basename(rel).replace(/\.md$/, "");
      const stripped = e.id.startsWith(prefix) ? e.id.slice(prefix.length) : e.id;
      const allowed = filenameRule === "strict" ? [e.id] : [e.id, stripped];
      if (!allowed.includes(base)) {
        problem("warning", "filename-id-divergence",
          `file "${rel}" holds id "${e.id}" (filename matches neither)`, e.id);
      }
      checkEntity(e);
    }
  }

  // ----- edges -----

  const edges = [];
  const edgesPath = join(instanceDir, "edges", "edges.md");
  if (existsSync(edgesPath)) {
    const text = readFileSync(edgesPath, "utf8");
    const { front } = splitEntityFile(text);
    const defReview = front.review || "accepted";
    const defConv = front.provenance && front.provenance.conversationId;
    const seenEdgeIds = new Set();
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("|")) continue;
      const cells = t.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length < 4) continue;
      if (cells[0] === "id" || /^-+$/.test(cells[0])) continue;
      const [id, kind, from, to, weight, review] = cells;
      const ref = (s) => {
        const ix = s.indexOf(":");
        return ix === -1 ? { type: null, id: s } : { type: s.slice(0, ix), id: s.slice(ix + 1) };
      };
      const edge = {
        id, kind, from: ref(from), to: ref(to),
        review: review || defReview, conversationId: defConv,
      };
      if (weight !== undefined && weight !== "") edge.weight = Number(weight);
      if (seenEdgeIds.has(id)) {
        problem("error", "duplicate-edge-id", `edge id "${id}" appears more than once`, id);
      }
      seenEdgeIds.add(id);
      edges.push(edge);
    }
  } else {
    problem("error", "missing-edges", "instance has no edges/edges.md", null);
  }

  // ----- graph-level conformance -----

  const referenced = new Set();
  for (const e of edges) {
    if (!edgeKinds.includes(e.kind)) {
      problem("error", "unknown-edge-kind",
        `edge "${e.id}" has kind "${e.kind}", not in [${edgeKinds.join(", ")}]`, e.id);
    }
    if (!REVIEWS.includes(e.review)) {
      problem("warning", "unknown-enum",
        `edge "${e.id}" has review "${e.review}", not in [${REVIEWS.join(", ")}]`, e.id);
    }
    if (e.weight !== undefined && e.kind !== "relates" && e.kind !== "links") {
      problem("warning", "weight-on-non-relates",
        `edge "${e.id}" (${e.kind}) carries a weight, which is meaningful only for relates/links`,
        e.id);
    }

    for (const [end, side] of [[e.from, "from"], [e.to, "to"]]) {
      // Provenance-ref endpoint (e.g. command:<hash>): resolved against a
      // content-addressed file the same way sources/ is, never an entity, so it
      // skips byId, orphan tracking, and entity type-matching.
      if (end.type && provRefKinds[end.type]) {
        const cfg = provRefKinds[end.type];
        const p = join(instanceDir, cfg.dir, `${end.id}${cfg.ext}`);
        if (!existsSync(p)) {
          problem("error", "dangling-provenance-ref",
            `edge "${e.id}" (${e.kind}) points at ${cfg.dir}/${end.id}${cfg.ext}, which is missing`,
            e.id);
        } else if (checkSources && gitBlobSha(readFileSync(p)) !== end.id) {
          problem("warning", "provenance-ref-hash-mismatch",
            `edge "${e.id}" ${end.type} ref "${end.id}" does not match the blob SHA of ` +
            `${cfg.dir}/${end.id}${cfg.ext}`, e.id);
        }
        const dr = edgeDomainRange[e.kind];
        if (dr && !dr[side].includes(end.type)) {
          problem("warning", "edge-domain-range",
            `edge "${e.id}" (${e.kind}) has ${side} channel "${end.type}"; ` +
            `${side} must be [${dr[side].join(", ")}]`, e.id);
        }
        continue;
      }

      referenced.add(end.id);
      const target = byId.get(end.id);
      if (!target) {
        problem("error", "dangling-edge",
          `edge "${e.id}" (${e.kind}) points at "${end.id}", which has no entity file`, e.id);
        continue;
      }
      if (end.type && target.entityType !== end.type) {
        problem("error", "type-mismatch",
          `edge "${e.id}" refers to "${end.id}" as ${end.type}, but it is a ${target.entityType}`,
          e.id);
        continue;
      }
      const dr = edgeDomainRange[e.kind];
      if (dr && !dr[side].includes(target.entityType)) {
        problem("warning", "edge-domain-range",
          `edge "${e.id}" (${e.kind}) has ${side} of type ${target.entityType}; ` +
          `schema.ts declares ${side} must be [${dr[side].join(", ")}]`, e.id);
      }
    }
  }

  // Orphans. An entity no edge references is invisible to every derived view,
  // since inventories are queries over edges rather than stored lists.
  //
  // A PROPOSED orphan is an error, not a warning: proposals land wired, so an
  // unwired one is a graph that was pushed in two pieces and caught mid-write.
  // That happened three times on 2026-07-20, each time because an atomic push
  // was split for payload size. Making it fail a build is the backstop for a
  // discipline that evidently cannot be relied on to hold by intention alone.
  for (const e of byId.values()) {
    if (e.entityType === "project") continue;
    if (referenced.has(e.id)) continue;
    if (e.review === "proposed") {
      problem("error", "orphan-proposed",
        `${e.entityType} "${e.id}" is proposed but referenced by no edge — ` +
        `a proposal must land wired, so this looks like a partial write`, e.id);
    } else {
      problem("warning", "orphan", `${e.entityType} "${e.id}" is referenced by no edge`, e.id);
    }
  }

  // ----- executed-command log (persona layer) -----
  // An append-only `| entity | command |` table binding each executed command to
  // the entity it was about, one row per execution in order. Provenance, not
  // edges: entity ids must resolve, and command hashes must resolve+verify like
  // any provenance-ref. Validated only when a layer declares the log.
  const executedRows = []; // { row, entity } — read again by the basis checks
  const changedRows = [];  // { row, entity, timestamp }
  if (commandLog) {
    const clPath = join(instanceDir, commandLog.file);
    if (existsSync(clPath)) {
      const cfg = provRefKinds[commandLog.ref];
      let row = 0;
      for (const line of readFileSync(clPath, "utf8").split("\n")) {
        const t = line.trim();
        if (!t.startsWith("|")) continue;
        const cells = t.split("|").slice(1, -1).map((c) => c.trim());
        if (cells.length < 2 || cells[0] === "entity" || /^-+$/.test(cells[0])) continue;
        row++;
        const [entity, command] = cells;
        executedRows.push({ row, entity });
        const target = byId.get(entity);
        if (!target) {
          problem("error", "dangling-executed",
            `executed log row ${row} references entity "${entity}", which has no entity file`, entity);
        } else if (commandLog.from && !commandLog.from.includes(target.entityType)) {
          problem("warning", "executed-domain",
            `executed log row ${row} binds a ${target.entityType} "${entity}"; ` +
            `must be [${commandLog.from.join(", ")}]`, entity);
        }
        if (cfg) {
          const p = join(instanceDir, cfg.dir, `${command}${cfg.ext}`);
          if (!existsSync(p)) {
            problem("error", "dangling-provenance-ref",
              `executed log row ${row} references ${cfg.dir}/${command}${cfg.ext}, which is missing`, entity);
          } else if (checkSources && gitBlobSha(readFileSync(p)) !== command) {
            problem("warning", "provenance-ref-hash-mismatch",
              `executed log row ${row} command "${command}" does not match the blob SHA of ` +
              `${cfg.dir}/${command}${cfg.ext}`, entity);
          }
        }
      }
    }
  }

  // ----- changed-code log (persona layer) -----
  // An append-only `| entity | commit | file | timestamp |` table binding each
  // committed code change to the entity it was about, one row per (entity,
  // commit, file) in commit order. `timestamp` records when the row was written;
  // rows written before the column existed have none. `commit` is an OPAQUE revision token — validated for shape only,
  // never resolved against a VCS, so the checker stays git-free and VCS-neutral
  // (nw-commit-is-opaque-revision). The diff lives in git, not here
  // (nw-derive-not-copy). Validated only when a layer declares the log.
  if (changeLog) {
    const chPath = join(instanceDir, changeLog.file);
    if (existsSync(chPath)) {
      let row = 0;
      for (const line of readFileSync(chPath, "utf8").split("\n")) {
        const t = line.trim();
        if (!t.startsWith("|")) continue;
        const cells = t.split("|").slice(1, -1).map((c) => c.trim());
        if (cells.length < 3 || cells[0] === "entity" || /^-+$/.test(cells[0])) continue;
        row++;
        const [entity, commit, file, timestamp] = cells;
        changedRows.push({ row, entity, timestamp: timestamp || "" });
        if (timestamp && Number.isNaN(Date.parse(timestamp))) {
          problem("error", "changed-incomplete",
            `changed log row ${row} has an unparseable timestamp "${timestamp}"`, entity);
        }
        const target = byId.get(entity);
        if (!target) {
          problem("error", "dangling-changed",
            `changed log row ${row} references entity "${entity}", which has no entity file`, entity);
        } else if (changeLog.from && !changeLog.from.includes(target.entityType)) {
          problem("warning", "changed-domain",
            `changed log row ${row} binds a ${target.entityType} "${entity}"; ` +
            `must be [${changeLog.from.join(", ")}]`, entity);
        }
        if (!commit) {
          problem("error", "changed-incomplete", `changed log row ${row} has an empty commit`, entity);
        }
        if (!file) {
          problem("error", "changed-incomplete", `changed log row ${row} has an empty file path`, entity);
        }
      }
    }
  }

  // ----- transition log (core) -----
  // An append-only `| ref | field | from | to | timestamp | source | by |` table
  // recording every assignment of `review` and `status`, for entities and edges
  // (SERIALIZATION.md § Transitions). Rows are not graph entities: a row has no
  // id and is never added to the entity set. An instance without the file
  // records no state history and remains conformant (`info`). When the file
  // exists, three rules are enforced as errors: a birth row per ref and field,
  // each row's `from` equal to the previous row's `to`, and the last row's `to`
  // equal to the value the entity file or edge row currently stores.
  const transitions = [];
  const trPath = join(instanceDir, "transitions", "transitions.md");
  if (!existsSync(trPath)) {
    problem("info", "no-transition-log",
      "instance has no transitions/transitions.md; review and status history is not recorded", null);
  } else {
    const edgeById = new Map(edges.map((e) => [e.id, e]));
    // Resolve a ref to the entity or edge whose current value the log must equal.
    const resolveRef = (ref) => {
      const ix = ref.indexOf(":");
      if (ix === -1) return null;
      const type = ref.slice(0, ix);
      const id = ref.slice(ix + 1);
      if (type === "edge") {
        const e = edgeById.get(id);
        return e ? { kind: "edge", review: e.review } : null;
      }
      const e = byId.get(id);
      if (!e || e.entityType !== type || type === "project") return null;
      return { kind: "entity", review: e.review, status: e.status };
    };
    const last = new Map(); // `${ref}\u0000${field}` -> { to, timestamp }
    let row = 0;
    for (const line of readFileSync(trPath, "utf8").split("\n")) {
      const t = line.trim();
      if (!t.startsWith("|")) continue;
      const cells = t.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length < 5 || cells[0] === "ref" || /^-+$/.test(cells[0])) continue;
      row++;
      const [ref, field, from, to, timestamp, source, by] = cells;
      transitions.push({
        ref, field, from: from || null, to, timestamp,
        ...(source ? { source } : {}), ...(by ? { by } : {}),
      });

      const target = resolveRef(ref);
      if (!target) {
        problem("error", "dangling-transition",
          `transition log row ${row} references "${ref}", which resolves to no entity or edge`, ref);
      }
      if (field !== "review" && field !== "status") {
        problem("error", "transition-unknown-field",
          `transition log row ${row} has field "${field}"; must be review or status`, ref);
      } else if (target && target.kind === "edge" && field === "status") {
        problem("error", "transition-unknown-field",
          `transition log row ${row} records a status on edge "${ref}"; an edge has only review`, ref);
      }
      if (!to) {
        problem("error", "transition-incomplete", `transition log row ${row} has an empty "to"`, ref);
      }
      if (field === "review" && to && !REVIEWS.includes(to)) {
        problem("warning", "unknown-enum",
          `transition log row ${row} sets review to "${to}"; must be one of [${REVIEWS.join(", ")}]`, ref);
      }
      const ms = Date.parse(timestamp);
      if (!timestamp || Number.isNaN(ms)) {
        problem("error", "transition-incomplete",
          `transition log row ${row} has a missing or unparseable timestamp "${timestamp || ""}"`, ref);
      }
      if (source) {
        const srcPath = join(sourcesDir, `${source}.md`);
        if (!existsSync(srcPath)) {
          problem("error", "dangling-source",
            `transition log row ${row} points at sources/${source}.md, which is missing`, ref);
        } else if (checkSources && gitBlobSha(readFileSync(srcPath)) !== source) {
          problem("error", "content-hash-mismatch",
            `transition log row ${row}: sources/${source}.md does not hash to its own name`, ref);
        }
      }

      const key = `${ref}\u0000${field}`;
      const prev = last.get(key);
      if (!prev) {
        if (from) {
          problem("error", "transition-chain-break",
            `transition log row ${row} is the first ${field} row for "${ref}" but has from "${from}"; ` +
            `a birth row has an empty from`, ref);
        }
      } else {
        if ((from || "") !== prev.to) {
          problem("error", "transition-chain-break",
            `transition log row ${row} changes "${ref}" ${field} from "${from || ""}", ` +
            `but the previous row left it at "${prev.to}"`, ref);
        }
        if (!Number.isNaN(ms) && !Number.isNaN(prev.ms) && ms < prev.ms) {
          problem("warning", "transition-out-of-order",
            `transition log row ${row} for "${ref}" ${field} is timestamped before the row it follows`, ref);
        }
      }
      last.set(key, { to, ms });
    }

    // Birth-row and agreement rules. The loop iterates the graph's entities and
    // edges, so an entity or edge with no row in the log is also reported.
    const expect = (ref, field, current) => {
      if (current === undefined || current === null || current === "") return;
      const l = last.get(`${ref}\u0000${field}`);
      if (!l) {
        problem("error", "transition-missing",
          `"${ref}" has ${field} "${current}" but no ${field} row in the transition log; ` +
          `every assignment is logged, including the first`, ref);
      } else if (l.to !== current) {
        problem("error", "transition-state-divergence",
          `"${ref}" has ${field} "${current}" but the transition log's last row left it at "${l.to}"`, ref);
      }
    };
    for (const e of byId.values()) {
      if (e.entityType === "project") continue;
      const ref = `${e.entityType}:${e.id}`;
      expect(ref, "review", e.review);
      expect(ref, "status", e.status);
    }
    for (const e of edges) expect(`edge:${e.id}`, "review", e.review);
  }

  // ----- authority (core) -----
  // Principals and grants (spec/architecture/AUTHORITY.md). An instance without
  // authority/principals.md declares no identities: the acceptor is human by the
  // rule in REVIEW.md, and no row is checked for who wrote it. When the registry
  // exists, every acceptance in the transition log must name a principal that
  // held a grant for that atom when the row was written. The store never
  // refuses a write on these rules; they are reported after the write.
  const authority = { present: false, principals: [], grants: [], acceptorsAt: null };
  const prPath = join(instanceDir, "authority", "principals.md");
  if (existsSync(prPath)) {
    authority.present = true;
    const principals = parsePrincipals(readFileSync(prPath, "utf8"));
    authority.principals = principals;
    const principalById = new Map();
    for (const p of principals) {
      if (!p.id) {
        problem("error", "principal-incomplete", `principals row ${p.row} has no id`, null);
        continue;
      }
      if (principalById.has(p.id)) {
        problem("error", "duplicate-principal", `principal id "${p.id}" appears more than once`, p.id);
      }
      principalById.set(p.id, p);
      if (!PRINCIPAL_KINDS.includes(p.kind)) {
        problem("error", "unknown-principal-kind",
          `principal "${p.id}" has kind "${p.kind}"; must be one of [${PRINCIPAL_KINDS.join(", ")}]`, p.id);
      }
      for (const r of p.roles) {
        if (!PRINCIPAL_ROLES.includes(r)) {
          problem("error", "unknown-principal-role",
            `principal "${p.id}" has role "${r}"; must be one of [${PRINCIPAL_ROLES.join(", ")}]`, p.id);
        }
      }
      if (p.roles.includes("grantor") && p.kind !== "human") {
        problem("error", "grantor-not-human",
          `principal "${p.id}" is a grantor but has kind "${p.kind}"; a grantor is human`, p.id);
      }
    }
    if (!principals.some((p) => p.kind === "human" && p.roles.includes("grantor"))) {
      problem("error", "no-grantor", "authority/principals.md declares no human grantor", null);
    }

    const grantorAccepts = collections.project && collections.project.grantorAccepts;
    if (grantorAccepts && !GRANTOR_ACCEPTS.includes(grantorAccepts)) {
      problem("warning", "unknown-enum",
        `project has grantorAccepts "${grantorAccepts}"; must be one of [${GRANTOR_ACCEPTS.join(", ")}]`,
        collections.project.id || "project");
    }

    const grPath = join(instanceDir, "authority", "grants.md");
    const grants = existsSync(grPath) ? parseGrants(readFileSync(grPath, "utf8")) : [];
    authority.grants = grants;
    const held = new Set(); // `${scope}\u0000${acceptor}` currently granted, in file order
    // A row that fails any check below confers and revokes nothing: only the
    // rows in `effective` are used to decide who may accept an atom.
    const effective = [];
    for (const g of grants) {
      const where = `grants row ${g.row}`;
      const before = problems.length;
      const id = scopeEntityId(g.scope);
      if (g.scope !== WHOLE_GRAPH) {
        const target = id && byId.get(id);
        const type = g.scope.slice(0, Math.max(0, g.scope.indexOf(":")));
        if (!target || target.entityType !== type || type === "project") {
          problem("error", "dangling-grant-scope",
            `${where} has scope "${g.scope}", which is neither "${WHOLE_GRAPH}" nor an entity of this instance`, g.scope);
        }
      }
      const acceptor = principalById.get(g.acceptor);
      if (!acceptor) {
        problem("error", "unknown-principal",
          `${where} names acceptor "${g.acceptor}", which is not a declared principal`, g.acceptor);
      }
      if (!GRANT_ACTIONS.includes(g.action)) {
        problem("error", "unknown-grant-action",
          `${where} has action "${g.action}"; must be one of [${GRANT_ACTIONS.join(", ")}]`, g.scope);
      }
      const grantor = principalById.get(g.grantor);
      if (!grantor) {
        problem("error", "unknown-principal",
          `${where} names grantor "${g.grantor}", which is not a declared principal`, g.grantor);
      } else if (grantor.kind !== "human" || !grantor.roles.includes("grantor")) {
        problem("error", "grant-without-grantor",
          `${where} is issued by "${g.grantor}", which is not a human principal with the grantor role`, g.grantor);
      }
      if (Number.isNaN(g.ms)) {
        problem("error", "grant-incomplete",
          `${where} has a missing or unparseable timestamp "${g.timestamp}"`, g.scope);
      }
      if (g.source) {
        const srcPath = join(sourcesDir, `${g.source}.md`);
        if (!existsSync(srcPath)) {
          problem("error", "dangling-source", `${where} points at sources/${g.source}.md, which is missing`, g.scope);
        } else if (checkSources && gitBlobSha(readFileSync(srcPath)) !== g.source) {
          problem("error", "content-hash-mismatch",
            `${where}: sources/${g.source}.md does not hash to its own name`, g.scope);
        }
      }
      if (g.action === "grant" && grantorAccepts === "forbidden" && acceptor && acceptor.roles.includes("grantor")) {
        problem("error", "grantor-accepts",
          `${where} grants accept rights to "${g.acceptor}", a grantor, and this instance sets grantorAccepts: forbidden`,
          g.acceptor);
      }
      const rowIsValid = !problems.slice(before).some((p) => p.severity === "error");
      if (!rowIsValid) continue;
      effective.push(g);
      const key = `${g.scope}\u0000${g.acceptor}`;
      if (g.action === "grant") {
        held.add(key);
      } else if (g.action === "revoke") {
        if (!held.has(key)) {
          problem("warning", "revoke-without-grant",
            `${where} revokes "${g.acceptor}" on "${g.scope}", which holds no grant at that row`, g.scope);
        }
        held.delete(key);
      }
    }

    const scopeIndex = buildScopeIndex(byId.values(), edges);
    authority.acceptorsAt = (ref, ms) => acceptorsAt(effective, scopeIndex, ref, ms);

    // Who wrote each value. `by`, when present, names a declared principal. A row
    // that sets review to `accepted` must name one, and that principal must have
    // held a grant on the atom's scope at the row's timestamp. Scope membership
    // is evaluated on the current graph.
    const birthBy = new Map(); // ref -> `by` of its review birth row
    transitions.forEach((t, ix) => {
      const row = ix + 1;
      if (t.by && !principalById.has(t.by)) {
        problem("error", "unknown-principal",
          `transition log row ${row} is written by "${t.by}", which is not a declared principal`, t.ref);
      }
      if (t.field !== "review") return;
      if (t.from === null) birthBy.set(t.ref, t.by || "");
      if (t.to !== "accepted") return;
      if (!t.by) {
        problem("error", "acceptance-unattributed",
          `transition log row ${row} accepts "${t.ref}" without naming the principal that accepted it`, t.ref);
        return;
      }
      const p = principalById.get(t.by);
      if (!p) return;
      const ms = Date.parse(t.timestamp);
      const who = authority.acceptorsAt(t.ref, Number.isNaN(ms) ? Infinity : ms);
      if (!who.acceptors.has(t.by)) {
        problem("error", "acceptance-without-grant",
          `transition log row ${row}: "${t.by}" accepted "${t.ref}" but held no grant on ` +
          `${who.scopes.length ? `scope ${who.scopes.join(" or ")}` : "any scope enclosing it"} at ${t.timestamp}`, t.ref);
      }
      if (p.kind === "agent") {
        const proposer = birthBy.get(t.ref);
        if (!proposer) {
          problem("error", "unattributed-proposal",
            `transition log row ${row}: agent "${t.by}" accepted "${t.ref}", whose birth row names no proposer; ` +
            `an agent accepts only an atom with a recorded proposer other than itself`, t.ref);
        } else if (proposer === t.by) {
          problem("error", "self-acceptance",
            `transition log row ${row}: agent "${t.by}" accepted "${t.ref}", an atom it proposed`, t.ref);
        }
      }
    });

    // A proposed atom needs exactly one applicable grant scope. Two scopes at
    // the same distance is an error a grantor resolves with a grant naming the
    // entity; no applicable grant means no principal can accept the atom.
    const pending = (ref, review) => {
      if (review !== "proposed") return;
      const who = authority.acceptorsAt(ref, Infinity);
      if (who.ambiguous) {
        problem("error", "ambiguous-grant-scope",
          `"${ref}" is proposed and lies at the same distance from grant scopes ${who.scopes.join(" and ")}; ` +
          `a grant naming a nearer entity is required`, ref);
      } else if (!who.acceptors.size) {
        problem("warning", "no-acceptor", `"${ref}" is proposed and no grant gives any principal the right to accept it`, ref);
      }
    };
    for (const e of byId.values()) {
      if (e.entityType !== "project") pending(`${e.entityType}:${e.id}`, e.review);
    }
    for (const e of edges) pending(`edge:${e.id}`, e.review);
  }

  // ----- acceptance before work (core) -----
  // Project.basis (spec/architecture/REVIEW.md § Acceptance before work). Under
  // `accepted`, work may be bound only to an accepted entity: a changed-code
  // row, an executed-command row, or a `resolved` status on an entity that is
  // not accepted is an error, as is a resolved node with an attached decision
  // that is not accepted. A changed-code row that has a timestamp must also
  // be later than the acceptance of its entity. Under `proposed`, the default,
  // none of this is checked.
  const basis = collections.project && collections.project.basis;
  if (basis && !BASES.includes(basis)) {
    problem("warning", "unknown-enum",
      `project has basis "${basis}"; must be one of [${BASES.join(", ")}]`, collections.project.id || "project");
  }
  if (basis === "accepted") {
    const notAccepted = (id) => {
      const e = byId.get(id);
      return e && e.entityType !== "project" && e.review !== "accepted";
    };
    for (const r of changedRows) {
      if (notAccepted(r.entity)) {
        problem("error", "work-on-unaccepted",
          `changed log row ${r.row} binds a commit to "${r.entity}", which is not accepted`, r.entity);
      }
    }
    for (const r of executedRows) {
      if (notAccepted(r.entity)) {
        problem("error", "work-on-unaccepted",
          `executed log row ${r.row} binds a command to "${r.entity}", which is not accepted`, r.entity);
      }
    }
    for (const e of byId.values()) {
      if (e.entityType !== "node" || e.status !== "resolved") continue;
      if (e.review !== "accepted") {
        problem("error", "work-on-unaccepted", `node "${e.id}" is resolved but not accepted`, e.id);
      }
    }
    const isDecision = (id) => {
      const d = byId.get(id);
      return d && (d.entityType === "noteworthy" || d.entityType === "waypoint") && d.kind === "decision";
    };
    for (const edge of edges) {
      // notes: node -> noteworthy.  marks: waypoint -> node.
      const node = edge.kind === "notes" ? edge.from.id : edge.kind === "marks" ? edge.to.id : null;
      const dec = edge.kind === "notes" ? edge.to.id : edge.kind === "marks" ? edge.from.id : null;
      if (!node || !isDecision(dec)) continue;
      const n = byId.get(node);
      if (n && n.entityType === "node" && n.status === "resolved" && notAccepted(dec)) {
        problem("error", "resolved-on-unaccepted-decision",
          `node "${node}" is resolved and its attached decision "${dec}" is not accepted`, node);
      }
    }
    // Order: the entity was accepted when the binding row was written.
    const timed = changedRows.filter((r) => r.timestamp && !Number.isNaN(Date.parse(r.timestamp)));
    if (timed.length && !existsSync(trPath)) {
      problem("warning", "basis-order-unverifiable",
        "basis is accepted but the instance has no transition log, so the order of acceptance and binding cannot be checked", null);
    } else {
      const history = new Map(); // ref -> [{ ms, to }] in file order
      for (const t of transitions) {
        if (t.field !== "review") continue;
        if (!history.has(t.ref)) history.set(t.ref, []);
        history.get(t.ref).push({ ms: Date.parse(t.timestamp), to: t.to });
      }
      for (const r of timed) {
        const e = byId.get(r.entity);
        if (!e || e.entityType === "project") continue;
        const ms = Date.parse(r.timestamp);
        let state = null;
        for (const h of history.get(`${e.entityType}:${e.id}`) || []) {
          if (!Number.isNaN(h.ms) && h.ms <= ms) state = h.to;
        }
        if (state !== "accepted") {
          problem("error", "bound-before-acceptance",
            `changed log row ${r.row} was written at ${r.timestamp}, when "${r.entity}" was ` +
            `${state ? `"${state}"` : "not yet recorded"}; an entity is accepted before work is bound to it`, r.entity);
        }
      }
    }
  }

  const sevRank = { error: 0, warning: 1, info: 2 };
  const sortById = (arr) => arr.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return {
    meta: {
      serializationVersion: SERIALIZATION_VERSION,
      filenameRule,
      personas: [...suppliedPersonas],
      counts: {
        nodes: collections.nodes.length,
        concepts: collections.concepts.length,
        noteworthy: collections.noteworthy.length,
        artifacts: collections.artifacts.length,
        waypoints: collections.waypoints.length,
        edges: edges.length,
        transitions: transitions.length,
        principals: authority.principals.length,
        grants: authority.grants.length,
        problems: problems.length,
      },
    },
    project: collections.project,
    nodes: sortById(collections.nodes),
    concepts: sortById(collections.concepts),
    noteworthy: sortById(collections.noteworthy),
    artifacts: sortById(collections.artifacts),
    waypoints: sortById(collections.waypoints),
    edges: sortById(edges),
    transitions,
    authority,
    byId,
    problems: problems.slice().sort((a, b) =>
      (sevRank[a.severity] - sevRank[b.severity]) ||
      (a.code < b.code ? -1 : a.code > b.code ? 1 : 0) ||
      String(a.ref).localeCompare(String(b.ref))),
  };
}

export const summarize = (problems) => ({
  error: problems.filter((p) => p.severity === "error").length,
  warning: problems.filter((p) => p.severity === "warning").length,
  info: problems.filter((p) => p.severity === "info").length,
});
