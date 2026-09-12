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

export const SERIALIZATION_VERSION = "v1";

// ---------- vocabularies (spec/data-model/schema.ts) ----------

export const NODE_TYPES = ["goal", "investigation", "experiment", "topic", "task", "note"];
export const NODE_STATUSES = ["open", "active", "resolved", "abandoned"];
export const NOTEWORTHY_KINDS = ["fact", "statement", "decision", "assumption", "constraint"];
export const WAYPOINT_KINDS = ["decision", "milestone", "pivot"];
export const REVIEWS = ["proposed", "accepted", "rejected"];
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
  project: ["id", "goal", "summary", "createdAt", "updatedAt", "personas"],
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
  for (const reg of registries) {
    if (!reg) continue;
    Object.assign(subtypeDefs, reg.subtypes || {});
    Object.assign(extraEdges, reg.edges || {});
    Object.assign(provRefKinds, reg.provenanceRefs || {});
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
