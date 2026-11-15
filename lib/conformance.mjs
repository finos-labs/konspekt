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
// Project.binding: provenance-completeness policy for this instance
// (spec/architecture/BINDING.md). Absent reads as `optional`.
export const BINDING_POLICIES = ["required", "optional"];
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
  project: ["id", "goal", "summary", "createdAt", "updatedAt", "personas", "binding", "basis", "grantorAccepts", "store", "locators"],
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

// ---------- RFC 6920 `ni:` references over SHA-256 (docs/design/source-addressing.md) ----------
//
// A reference is `ni:///sha-256;<base64url>`, the digest taken over the raw
// bytes (no git `blob <len>\0` header). The authority part is empty. Stored
// files are named by the hex form: `<dir>/sha-256/<hex>.md`. The legacy form,
// a 40-hex git blob SHA naming `<dir>/<sha>.md`, is still read, so an instance
// may mix migrated and unmigrated atoms.

export const NI_PREFIX = "ni:///sha-256;";

export function sha256Hex(buf) {
  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, "utf8");
  return createHash("sha256").update(bytes).digest("hex");
}

export function hexToBase64url(hex) {
  return Buffer.from(hex, "hex").toString("base64url");
}

export function base64urlToHex(b64) {
  return Buffer.from(b64, "base64url").toString("hex");
}

// The `ni:` reference for a byte string.
export function niRef(buf) {
  return NI_PREFIX + hexToBase64url(sha256Hex(buf));
}

// Parse an `ni:` SHA-256 reference into { alg, hex, b64 }, or null when the
// value is not one. The digest must be 43 base64url characters that decode to
// 32 bytes and re-encode to the same text, so padded or non-canonical forms are
// rejected.
export function parseNiRef(ref) {
  if (typeof ref !== "string" || !ref.startsWith(NI_PREFIX)) return null;
  const b64 = ref.slice(NI_PREFIX.length);
  if (!/^[A-Za-z0-9_-]{43}$/.test(b64)) return null;
  const hex = base64urlToHex(b64);
  if (hex.length !== 64 || hexToBase64url(hex) !== b64) return null;
  return { alg: "sha-256", hex, b64 };
}

// Resolve a content reference against a content-addressed directory
// (`sources/`, `commands/`). Returns { form, path, rel, verify(bytes) }, or null
// when the reference is neither form. `rel` is the path relative to `dir`, for
// messages; `verify` reports whether the stored bytes match the reference.
export function resolveContentRef(dir, ref) {
  const ni = parseNiRef(ref);
  if (ni) {
    return {
      form: "ni",
      path: join(dir, "sha-256", `${ni.hex}.md`),
      rel: `sha-256/${ni.hex}.md`,
      verify: (b) => sha256Hex(b) === ni.hex,
    };
  }
  if (typeof ref === "string" && /^[0-9a-f]{40}$/.test(ref)) {
    return { form: "git-blob-sha1", path: join(dir, `${ref}.md`), rel: `${ref}.md`, verify: (b) => gitBlobSha(b) === ref };
  }
  return null;
}

// ---------- a small YAML-subset parser (just enough for konspekt v1) ----------
//
// Supports: `key: scalar`, maps nested to any depth by indentation, block
// sequences (`- scalar` and `- key: value` items that open a map), inline flow
// arrays `[a, b, c]`, and folded/literal block scalars at any depth.
// Deliberately narrow; if front-matter ever outgrows it, swap in a real YAML
// library here and nowhere else.
//
// A line the parser cannot place is never dropped silently: it is recorded in
// the `issues` list that parseYamlSubsetWithIssues returns, and loadInstance
// reports it as a `frontmatter-unparsed` error. Silently losing or flattening a
// nested key is how a reader ends up trusting the wrong value.

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

const KEY_LINE = /^([A-Za-z0-9_$.-]+):(?:\s+(.*)|)$/;
const BLOCK_SCALAR = new Set([">", ">-", "|", "|-"]);
const isSkippable = (line) => line.trim() === "" || line.trim().startsWith("#");

export function parseYamlSubsetWithIssues(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const issues = [];
  let i = 0;

  const nextContent = () => {
    let j = i;
    while (j < lines.length && isSkippable(lines[j])) j++;
    return j;
  };

  // A block scalar's lines are everything after the key line that is blank or
  // indented deeper than the key. Content is de-indented by the first content
  // line's indent.
  const readBlockScalar = (keyIndent, marker) => {
    const collected = [];
    let base = null;
    while (i < lines.length && (lines[i].trim() === "" || indentOf(lines[i]) > keyIndent)) {
      if (base === null && lines[i].trim() !== "") base = indentOf(lines[i]);
      collected.push(lines[i]);
      i++;
    }
    const strip = base === null ? keyIndent + 2 : base;
    const body = collected.map((l) => l.slice(Math.min(strip, indentOf(l))));
    return marker.startsWith(">")
      ? body.join(" ").replace(/\s+/g, " ").trim()
      : body.join("\n").trimEnd();
  };

  // The value after `key:` on a line at `keyIndent`, consuming any nested lines.
  const readValue = (keyIndent, rest) => {
    if (BLOCK_SCALAR.has(rest)) return readBlockScalar(keyIndent, rest);
    if (rest !== "") return coerce(rest);
    const j = nextContent();
    if (j >= lines.length) return "";
    const childIndent = indentOf(lines[j]);
    const isSeq = lines[j].trim().startsWith("- ") || lines[j].trim() === "-";
    // A sequence may sit at the key's own indent (`key:\n- a`), as YAML allows.
    if (isSeq && childIndent >= keyIndent) { i = j; return readSeq(childIndent); }
    if (childIndent > keyIndent) { i = j; return readMap(childIndent); }
    return "";
  };

  // Lines at exactly `indent` that are `key: ...` belong to this map.
  const readMap = (indent, into = {}) => {
    while (i < lines.length) {
      if (isSkippable(lines[i])) { i++; continue; }
      const ind = indentOf(lines[i]);
      if (ind < indent) break;
      const trimmed = lines[i].trim();
      if (ind > indent || trimmed.startsWith("- ")) {
        if (ind === indent) break; // a sequence item ends the map that owns it
        issues.push({ line: i + 1, text: lines[i] });
        i++;
        continue;
      }
      const m = trimmed.match(KEY_LINE);
      if (!m) { issues.push({ line: i + 1, text: lines[i] }); i++; continue; }
      i++;
      into[m[1]] = readValue(ind, (m[2] || "").trim());
    }
    return into;
  };

  // Items at exactly `indent` that start with `- `.
  const readSeq = (indent) => {
    const out = [];
    while (i < lines.length) {
      if (isSkippable(lines[i])) { i++; continue; }
      const ind = indentOf(lines[i]);
      const trimmed = lines[i].trim();
      if (ind !== indent || !(trimmed.startsWith("- ") || trimmed === "-")) break;
      const itemText = trimmed === "-" ? "" : trimmed.slice(2).trim();
      const itemIndent = ind + 2;
      const km = itemText.match(KEY_LINE);
      if (km && !itemText.startsWith('"') && !itemText.startsWith("'")) {
        // `- key: value` opens a map whose further keys sit at itemIndent.
        i++;
        const item = {};
        item[km[1]] = readValue(itemIndent, (km[2] || "").trim());
        readMap(itemIndent, item);
        out.push(item);
      } else if (itemText === "") {
        i++;
        const j = nextContent();
        if (j < lines.length && indentOf(lines[j]) > ind) { i = j; out.push(readMap(indentOf(lines[j]))); }
        else out.push("");
      } else {
        i++;
        out.push(coerce(itemText));
      }
    }
    return out;
  };

  const root = {};
  while (i < lines.length) {
    if (isSkippable(lines[i])) { i++; continue; }
    if (indentOf(lines[i]) !== 0) { issues.push({ line: i + 1, text: lines[i] }); i++; continue; }
    readMap(0, root);
    if (i < lines.length && !isSkippable(lines[i])) { issues.push({ line: i + 1, text: lines[i] }); i++; }
  }
  return { value: root, issues };
}

export function parseYamlSubset(text) {
  return parseYamlSubsetWithIssues(text).value;
}

export function splitEntityFile(text) {
  const t = text.replace(/\r\n/g, "\n");
  const fence = t.match(/^```ya?ml\n([\s\S]*?)\n```\s*\n?/);
  if (!fence) return { front: {}, body: t.trim(), noFrontmatter: true };
  const { value, issues } = parseYamlSubsetWithIssues(fence[1]);
  return { front: value, body: t.slice(fence[0].length).trim(), frontIssues: issues };
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

  // Entity front-matter, with every line the parser could not place reported.
  const readEntityFile = (abs, rel) => {
    const r = splitEntityFile(readFileSync(abs, "utf8"));
    for (const iss of r.frontIssues || []) {
      problem("error", "frontmatter-unparsed",
        `${rel}: front-matter line ${iss.line} could not be parsed: ${JSON.stringify(iss.text.trim())}`, rel);
    }
    return r;
  };

  // ----- persona layers (opts.personas) -----
  // Registries are supplied by the caller (validate.mjs / snapshot.mjs), which
  // reads project.personas and imports each spec/personas/<name>/registry.mjs.
  // Merging what it is handed keeps this module pure and free of any assumption
  // about where a layer lives on disk.
  // Resolve a content reference in a table cell or channel ref against a
  // content-addressed directory. An `ni:` reference maps to `sha-256/<hex>.md`;
  // any other value keeps the legacy reading, `<value>.md` checked by git blob
  // SHA. Returns { path, rel, verify(bytes) } or null for a malformed `ni:` ref.
  // `where` and `owner` name the cell for the legacy-ref-after-migration warning.
  const resolveCell = (dir, ref, ext = ".md", where = null, owner = null) => {
    if (typeof ref === "string" && ref.startsWith("ni:")) return resolveContentRef(dir, ref);
    if (where) noteLegacyRef(where, ref, owner);
    return { path: join(dir, `${ref}${ext}`), rel: `${ref}${ext}`, verify: (b) => gitBlobSha(b) === ref };
  };

  // SERIALIZATION.md § Migration: "Once an instance is migrated, every new
  // reference it receives is in the `ni:` form." The migration writes
  // deprecated.md and rewrites every entity sourceRef and every reference cell,
  // so in a migrated instance the only SHA-1 values it leaves are under
  // provenance.deprecated and in deprecated.md, and this checker reads neither.
  // Any other SHA-1 reference was therefore written after the migration. A
  // reader still accepts the legacy form, so this is a warning.
  const instanceMigrated =
    existsSync(join(instanceDir, "sources", "deprecated.md")) ||
    existsSync(join(instanceDir, "commands", "deprecated.md"));
  const noteLegacyRef = (where, ref, owner) => {
    if (!instanceMigrated) return;
    problem("warning", "legacy-ref-after-migration",
      `${where} uses the git blob SHA-1 reference "${ref}", but this instance is migrated ` +
      `(deprecated.md exists) and takes only ni:///sha-256 references; rerun tools/migrate-ni.mjs`,
      owner);
  };

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

  // Hosts a provenance locator may name: project.md locators.allow
  // (SERIALIZATION.md § Store and locators). Set once project.md is read, which
  // happens before any other entity is checked; null means no allow-list.
  let locatorAllow = null;
  const LOCATOR_KINDS = ["git-permalink", "conversation", "chat", "web"];
  const checkLocators = (e, locators) => {
    if (!Array.isArray(locators)) {
      problem("warning", "locator-malformed", `${e.entityType} "${e.id}" provenance.locators is not a list`, e.id);
      return;
    }
    locators.forEach((l, i) => {
      const where = `${e.entityType} "${e.id}" locator ${i + 1}`;
      if (!l || typeof l !== "object" || !l.uri || !l.kind || !l.retrievedAt) {
        problem("warning", "locator-malformed", `${where} needs uri, kind and retrievedAt`, e.id);
        return;
      }
      if (!LOCATOR_KINDS.includes(l.kind)) {
        problem("warning", "locator-malformed", `${where} has kind "${l.kind}", not in [${LOCATOR_KINDS.join(", ")}]`, e.id);
      }
      if (Number.isNaN(Date.parse(l.retrievedAt))) {
        problem("warning", "locator-malformed", `${where} has an unparseable retrievedAt "${l.retrievedAt}"`, e.id);
      }
      let host = null;
      try { host = new URL(String(l.uri)).hostname; } catch { /* reported below */ }
      if (!host) {
        problem("warning", "locator-malformed", `${where} has uri "${l.uri}", which is not an absolute URL`, e.id);
      } else if (!locatorAllow || !locatorAllow.includes(host)) {
        problem("warning", "locator-not-allowed",
          `${where} names host "${host}", which project.md locators.allow does not list`, e.id);
      }
    });
  };

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
        if (p.locators !== undefined) checkLocators(e, p.locators);
        if (typeof p.sourceRef === "string" && p.sourceRef.startsWith("ni:")) {
          // Migrated form: contentHash is derived from the reference, not stored.
          const res = resolveContentRef(sourcesDir, p.sourceRef);
          if (!res) {
            problem("error", "malformed-source-ref",
              `${e.entityType} "${e.id}" has sourceRef "${p.sourceRef}", which is not an ni:///sha-256 reference`, e.id);
          } else {
            if (p.contentHash !== undefined) {
              problem("error", "stored-content-hash",
                `${e.entityType} "${e.id}" stores contentHash beside an ni: sourceRef; ` +
                `with ni: references contentHash is derived, not stored`, e.id);
            }
            if (checkSources) {
              if (!existsSync(res.path)) {
                problem("error", "dangling-source",
                  `${e.entityType} "${e.id}" points at sources/${res.rel}, which is missing`, e.id);
              } else if (!res.verify(readFileSync(res.path))) {
                problem("error", "content-hash-mismatch",
                  `${e.entityType} "${e.id}": sources/${res.rel} does not hash to its sourceRef ${p.sourceRef}`, e.id);
              }
            }
          }
        } else {
          if (p.sourceRef) noteLegacyRef(`${e.entityType} "${e.id}" sourceRef`, p.sourceRef, e.id);
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
    }
  };

  // ----- project.md -----

  const projectPath = join(instanceDir, "project.md");
  if (existsSync(projectPath)) {
    const { front, body } = readEntityFile(projectPath, "project.md");
    collections.project = { entityType: "project", ...front, body, _file: "project.md" };
    if (front.id) byId.set(front.id, collections.project);
    checkEntity(collections.project);
    // store and locators (SERIALIZATION.md § Store and locators, STORAGE.md).
    const st = collections.project.store;
    if (st !== undefined) {
      const r = st && st.resolve;
      const missing = !st || typeof st !== "object" || !st.kind ? ["kind"] : [];
      for (const k of ["source", "entity", "edges"]) if (!r || typeof r[k] !== "string" || !r[k]) missing.push(`resolve.${k}`);
      if (missing.length) {
        problem("warning", "store-incomplete", `project.md store has no ${missing.join(", ")}`, collections.project.id || "project");
      }
    }
    const loc = collections.project.locators;
    if (loc !== undefined) {
      if (!loc || !Array.isArray(loc.allow)) {
        problem("warning", "locators-malformed", "project.md locators.allow is not a list", collections.project.id || "project");
      } else {
        locatorAllow = loc.allow.map(String);
      }
    }
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
        const { front, body } = readEntityFile(join(full, f), rel);
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
      const { front, body } = readEntityFile(join(full, f), rel);
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
    const { front, frontIssues } = splitEntityFile(text);
    for (const iss of frontIssues || []) {
      problem("error", "frontmatter-unparsed",
        `edges/edges.md: front-matter line ${iss.line} could not be parsed: ${JSON.stringify(iss.text.trim())}`, "edges/edges.md");
    }
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
        const res = resolveCell(join(instanceDir, cfg.dir), end.id, cfg.ext,
          `edge "${e.id}" (${e.kind}) ${end.type} ref`, e.id);
        if (!res) {
          problem("error", "malformed-source-ref",
            `edge "${e.id}" (${e.kind}) has ${end.type} ref "${end.id}", which is not an ni:///sha-256 reference`, e.id);
        } else if (!existsSync(res.path)) {
          problem("error", "dangling-provenance-ref",
            `edge "${e.id}" (${e.kind}) points at ${cfg.dir}/${res.rel}, which is missing`,
            e.id);
        } else if (checkSources && !res.verify(readFileSync(res.path))) {
          problem("warning", "provenance-ref-hash-mismatch",
            `edge "${e.id}" ${end.type} ref "${end.id}" does not match the hash of ` +
            `${cfg.dir}/${res.rel}`, e.id);
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

  // Subtype inbound requirements (persona layer). A subtype may declare
  // `inbound: [{ kind, fromSubtype? }]`: an entity carrying it needs at least
  // one non-rejected edge of that kind pointing at it, from an entity with
  // subtype `fromSubtype` when one is given. Retired entities are exempt: a
  // rejected one, and one that is the `to` of a supersedes edge.
  //
  // A PROPOSED entity that misses one is an error, for the reason orphan-
  // proposed is: a proposal lands wired. The adopter CI gates on errors only,
  // so a warning let 20 ADRs land without drives edges in cdm-collateral
  // (2026-11-06). An accepted entity that misses one stays a warning.
  const supersededIds = new Set(edges.filter((e) => e.kind === "supersedes").map((e) => e.to.id));
  for (const ent of byId.values()) {
    const def = ent.subtype ? subtypeDefs[ent.subtype] : null;
    if (!def || !Array.isArray(def.inbound) || def.entityType !== ent.entityType) continue;
    if (ent.review === "rejected" || supersededIds.has(ent.id)) continue;
    for (const req of def.inbound) {
      const met = edges.some((e) => e.kind === req.kind && e.to.id === ent.id && e.review !== "rejected" &&
        (!req.fromSubtype || (byId.get(e.from.id) || {}).subtype === req.fromSubtype));
      if (!met) {
        const what = `${ent.entityType} "${ent.id}" (subtype ${ent.subtype}) has no inbound ${req.kind} edge` +
          (req.fromSubtype ? ` from a ${req.fromSubtype}` : "");
        if (ent.review === "proposed") {
          problem("error", "subtype-missing-inbound-proposed",
            `${what} — a proposal must land with its ${req.kind} edge in the same write`, ent.id);
        } else {
          problem("warning", "subtype-missing-inbound", what, ent.id);
        }
      }
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
          const res = resolveCell(join(instanceDir, cfg.dir), command, cfg.ext,
            `executed log row ${row} command`, entity);
          if (!res) {
            problem("error", "malformed-source-ref",
              `executed log row ${row} command "${command}" is not an ni:///sha-256 reference`, entity);
          } else if (!existsSync(res.path)) {
            problem("error", "dangling-provenance-ref",
              `executed log row ${row} references ${cfg.dir}/${res.rel}, which is missing`, entity);
          } else if (checkSources && !res.verify(readFileSync(res.path))) {
            problem("warning", "provenance-ref-hash-mismatch",
              `executed log row ${row} command "${command}" does not match the hash of ` +
              `${cfg.dir}/${res.rel}`, entity);
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
        const res = resolveCell(sourcesDir, source, ".md", `transition log row ${row} source`, ref);
        if (!res) {
          problem("error", "malformed-source-ref",
            `transition log row ${row} has source "${source}", which is not an ni:///sha-256 reference`, ref);
        } else if (!existsSync(res.path)) {
          problem("error", "dangling-source",
            `transition log row ${row} points at sources/${res.rel}, which is missing`, ref);
        } else if (checkSources && !res.verify(readFileSync(res.path))) {
          problem("error", "content-hash-mismatch",
            `transition log row ${row}: sources/${res.rel} does not hash to its reference`, ref);
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
        const res = resolveCell(sourcesDir, g.source, ".md", `${where} source`, g.scope);
        if (!res) {
          problem("error", "malformed-source-ref",
            `${where} has source "${g.source}", which is not an ni:///sha-256 reference`, g.scope);
        } else if (!existsSync(res.path)) {
          problem("error", "dangling-source", `${where} points at sources/${res.rel}, which is missing`, g.scope);
        } else if (checkSources && !res.verify(readFileSync(res.path))) {
          problem("error", "content-hash-mismatch",
            `${where}: sources/${res.rel} does not hash to its reference`, g.scope);
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

  // ----- checkpoint log (core) -----
  // An append-only `| timestamp | entity | source | venue | model | by |` table,
  // one row per human `checkpoint` (SERIALIZATION.md § Checkpoints,
  // TRANSPORT.md § Checkpoint and resume). An instance without the file has no
  // checkpoints and is conformant. When it exists: the entity resolves, the
  // source excerpt exists and hashes to its name, timestamps parse and do not
  // decrease, and, when principals are declared, `by` names a human principal.
  const checkpoints = [];
  const cpPath = join(instanceDir, "checkpoints", "checkpoints.md");
  if (existsSync(cpPath)) {
    const principalKind = new Map(authority.principals.map((p) => [p.id, p.kind]));
    let row = 0;
    let prevMs = NaN;
    for (const line of readFileSync(cpPath, "utf8").split("\n")) {
      const t = line.trim();
      if (!t.startsWith("|")) continue;
      const cells = t.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length < 3 || cells[0] === "timestamp" || /^-+$/.test(cells[0])) continue;
      row++;
      const [timestamp, entity, source, venue, model, by] = cells;
      checkpoints.push({
        row, timestamp, entity, source,
        ...(venue ? { venue } : {}), ...(model ? { model } : {}), ...(by ? { by } : {}),
      });
      const ms = Date.parse(timestamp);
      if (!timestamp || Number.isNaN(ms)) {
        problem("error", "checkpoint-incomplete",
          `checkpoint log row ${row} has a missing or unparseable timestamp "${timestamp || ""}"`, entity || null);
      } else if (!Number.isNaN(prevMs) && ms < prevMs) {
        problem("error", "checkpoint-out-of-order",
          `checkpoint log row ${row} is timestamped before the row it follows`, entity || null);
      }
      if (!Number.isNaN(ms)) prevMs = ms;
      if (!entity) {
        problem("error", "checkpoint-incomplete", `checkpoint log row ${row} has an empty entity`, null);
      } else {
        const target = byId.get(entity);
        if (!target || target.entityType === "project") {
          problem("error", "dangling-checkpoint",
            `checkpoint log row ${row} references entity "${entity}", which has no entity file`, entity);
        }
      }
      if (!source) {
        problem("error", "checkpoint-incomplete", `checkpoint log row ${row} has an empty source`, entity || null);
      } else {
        const res = resolveCell(sourcesDir, source, ".md", `checkpoint log row ${row} source`, entity || null);
        if (!res) {
          problem("error", "malformed-source-ref",
            `checkpoint log row ${row} has source "${source}", which is not an ni:///sha-256 reference`, entity || null);
        } else if (!existsSync(res.path)) {
          problem("error", "dangling-source",
            `checkpoint log row ${row} points at sources/${res.rel}, which is missing`, entity || null);
        } else if (checkSources && !res.verify(readFileSync(res.path))) {
          problem("error", "content-hash-mismatch",
            `checkpoint log row ${row}: sources/${res.rel} does not hash to its reference`, entity || null);
        }
      }
      if (authority.present) {
        if (!by) {
          problem("error", "checkpoint-incomplete",
            `checkpoint log row ${row} has no by; the instance declares principals`, entity || null);
        } else if (!principalKind.has(by)) {
          problem("error", "checkpoint-unknown-principal",
            `checkpoint log row ${row} names "${by}", which is not a declared principal`, entity || null);
        } else if (principalKind.get(by) !== "human") {
          problem("error", "checkpoint-not-human",
            `checkpoint log row ${row} names ${principalKind.get(by)} principal "${by}"; checkpoint is a human command`,
            entity || null);
        }
      }
    }
  }

  // ----- acceptance before work (core) -----
  // Project.basis (spec/architecture/REVIEW.md § Acceptance before work). Under
  // `accepted`, work may be bound only to an accepted entity: a changed-code
  // row, an executed-command row, or a `resolved` status on an entity that is
  // not accepted is an error, as is a resolved node with an attached decision
  // that is not accepted. A changed-code row that has a timestamp must also
  // be later than the acceptance of its entity. Under `proposed`, the default,
  // none of this is checked.
  const binding = collections.project && collections.project.binding;
  if (binding && !BINDING_POLICIES.includes(binding)) {
    problem("warning", "unknown-enum",
      `project has binding "${binding}"; must be one of [${BINDING_POLICIES.join(", ")}]`, collections.project.id || "project");
  }
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
        checkpoints: checkpoints.length,
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
    checkpoints,
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
