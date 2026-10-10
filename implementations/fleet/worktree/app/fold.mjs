// Fold: write a verified proposal onto canonical as `review: proposed`
// (fleet-spec.md § Committer protocol, step 4).
//
// The proposal payload arrives in the fleet `---` format (payload.mjs); the
// stored graph is konspekt's ```yaml-fenced entity format plus the edges and
// transitions logs. Fold is the one place that rewrites the former into the
// latter. It wires the atom WHOLE in one pass — source excerpt, entity file, the
// edge rows that reference it, and a birth row in the transition log for the
// entity and every edge — so canonical never lands partially wired
// (nw-fleet-committer-role-split). The git commit is the caller's (committer.mjs
// folds the whole verified batch in one commit); this module only writes files,
// which keeps it testable against lib/validate.mjs with no repository present.
//
// The committer is deterministic and holds no model: it supplies only the fields
// it owns — `review: proposed`, the provenance link to the source excerpt, and
// the self-reported confidence — and copies the proposer's entity id, labels,
// prose, and edge rows through unchanged. It invents no content.

import { join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { parseProposal } from "./payload.mjs";
import { appendFoldRecord } from "./proposed-ref.mjs";
import { parseYamlSubset } from "../../../../lib/conformance.mjs";

// Where each entity type's file lives, and the id prefix the store expects.
const ENTITY_DIR = {
  concept: { dir: "concepts", prefix: "concept-" },
  noteworthy: { dir: "noteworthy", prefix: "nw-" },
  artifact: { dir: "artifacts", prefix: "artifact-" },
  waypoint: { dir: "waypoints", prefix: "wp-" },
  // node is placed under nodes/<type>/, resolved from the entity's own `type`.
};

// Pull the konspekt entity out of a proposal body. The body is the proposed
// entity in the stored ```yaml-fenced format, optionally followed by an
// `edges:` block of the rows that wire it (outbox.renderEdgesBlock). Returns the
// raw fence text (unparsed, so scalar/array formatting round-trips untouched),
// the prose body, and the parsed edge rows.
export function parseEntityBody(body) {
  const fence = body.match(/^```ya?ml\n([\s\S]*?)\n```[ \t]*\n?/);
  if (!fence) {
    throw new Error("proposal body has no ```yaml entity fence to fold");
  }
  const fenceText = fence[1];
  const remainder = body.slice(fence[0].length);

  const lines = remainder.split("\n");
  const edgeAt = lines.findIndex((l) => l.trim() === "edges:");
  let prose;
  let edgeRows = [];
  if (edgeAt === -1) {
    prose = remainder.trim();
  } else {
    prose = lines.slice(0, edgeAt).join("\n").trim();
    edgeRows = parseEdgeRows(lines.slice(edgeAt + 1));
  }
  return { fenceText, prose, edgeRows };
}

function parseEdgeRows(tableLines) {
  const rows = [];
  for (const line of tableLines) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    if (cells[0] === "id" || /^-+$/.test(cells[0])) continue;
    const [id, kind, from, to, weight, review] = cells;
    rows.push({ id, kind, from, to, weight: weight ?? "", review: review ?? "" });
  }
  return rows;
}

// Drop the proposer's own `review:` line and `provenance:` block (if any) from
// the entity fence: the committer owns both and appends its own below. Removing
// a `provenance:` key takes its indented children with it.
function stripCommitterOwnedFields(fenceText) {
  const lines = fenceText.split("\n");
  const out = [];
  let skippingBlock = false;
  for (const line of lines) {
    const indent = line.length - line.replace(/^ +/, "").length;
    if (skippingBlock) {
      if (line.trim() === "" || indent > 0) continue; // still inside the block
      skippingBlock = false;
    }
    if (/^review:\s/.test(line)) continue;
    if (/^provenance:\s*$/.test(line) || /^provenance:\s/.test(line)) {
      skippingBlock = /^provenance:\s*$/.test(line); // block form has children
      continue;
    }
    out.push(line);
  }
  // Trim trailing blank lines the strip may have left.
  while (out.length && out[out.length - 1].trim() === "") out.pop();
  return out;
}

// The committer-owned fence tail: the fold state and the provenance link to the
// source excerpt. `confidence` is the self-reported value carried in the payload
// (fleet-spec.md § Proposal payload schema); it rides into the node so a folded
// atom is a legal atom from the moment it lands.
function committerFenceTail({ sourceHash, conversationId, timestamp, confidence }) {
  const tail = ["review: proposed", "provenance:"];
  tail.push(`  sourceRef: ${sourceHash}`);
  tail.push(`  contentHash: ${sourceHash}`);
  if (conversationId) tail.push(`  conversationId: ${conversationId}`);
  tail.push(`  timestamp: ${timestamp}`);
  if (confidence !== undefined && confidence !== null) tail.push(`  confidence: ${confidence}`);
  return tail;
}

function appendRows(path, rows) {
  if (rows.length === 0) return;
  let existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (existing.length && !existing.endsWith("\n")) existing += "\n";
  writeFileSync(path, existing + rows.map((r) => r + "\n").join(""), "utf8");
}

const txRow = (ref, field, to, timestamp) => `| ${ref} | ${field} |  | ${to} | ${timestamp} |  |  |`;
const edgeRow = (r) => `| ${r.id} | ${r.kind} | ${r.from} | ${r.to} | ${r.weight ?? ""} | proposed |`;

// Fold one verified proposal into `instanceDir`. Writes the source excerpt, the
// entity file, the wiring edge rows, and the birth transition rows. Returns a
// manifest of what it wrote. `now` supplies the transition timestamp when the
// payload carries no `created`.
//
// Throws only on a payload the committer cannot place (no entity fence, unknown
// entity type, missing id, or an entity its own edges do not wire): these are
// set-aside conditions the caller reports, never a partial write — the caller
// folds the batch in one commit, so a throw here aborts before any commit.
export function foldProposal(instanceDir, { proposalMd, sourceMd }, { now, fleetDir } = {}) {
  const { front, body } = parseProposal(proposalMd);
  const { fenceText, prose, edgeRows } = parseEntityBody(body);

  const entityType = String((front.scope && front.scope.entity_type) || "").toLowerCase();
  const entityFront = parseYamlSubset(fenceText);
  const id = entityFront.id;
  if (!id) throw new Error("entity fence has no id");

  let relDir;
  let prefix;
  if (entityType === "node") {
    const nodeType = entityFront.type;
    if (!nodeType) throw new Error(`node "${id}" has no type to place it under nodes/<type>/`);
    relDir = join("nodes", nodeType);
    prefix = "";
  } else {
    const place = ENTITY_DIR[entityType];
    if (!place) throw new Error(`unknown entity_type "${entityType}" — cannot place the entity file`);
    relDir = place.dir;
    prefix = place.prefix;
  }
  if (prefix && !id.startsWith(prefix)) {
    throw new Error(`${entityType} id "${id}" does not start with "${prefix}"`);
  }

  // The atom must land wired: at least one of its edges references the entity.
  const wiresEntity = edgeRows.some((r) => r.from.endsWith(`:${id}`) || r.to.endsWith(`:${id}`) || r.from === id || r.to === id);
  if (!wiresEntity) {
    throw new Error(`proposal for "${id}" carries no edge wiring it; a proposal must land wired`);
  }

  const sourceHash = front.source && front.source.hash;
  if (!sourceHash) throw new Error(`proposal for "${id}" has no source.hash`);
  const timestamp = front.created || now || new Date().toISOString();

  // ----- source excerpt -----
  const sourcesDir = join(instanceDir, "sources");
  mkdirSync(sourcesDir, { recursive: true });
  writeFileSync(join(sourcesDir, `${sourceHash}.md`), String(sourceMd), "utf8");

  // ----- entity file -----
  const fenceLines = [
    ...stripCommitterOwnedFields(fenceText),
    ...committerFenceTail({
      sourceHash,
      conversationId: front.origin && front.origin.session,
      timestamp,
      confidence: front.provenance && front.provenance.confidence,
    }),
  ];
  const entityText = "```yaml\n" + fenceLines.join("\n") + "\n```\n" + prose.trim() + "\n";
  const absDir = join(instanceDir, relDir);
  mkdirSync(absDir, { recursive: true });
  const relFile = join(relDir, `${id}.md`);
  writeFileSync(join(instanceDir, relFile), entityText, "utf8");

  // ----- edges (per-row review override: proposed) -----
  appendRows(join(instanceDir, "edges", "edges.md"), edgeRows.map(edgeRow));

  // ----- transitions (birth rows) -----
  const trRows = [txRow(`${entityType}:${id}`, "review", "proposed", timestamp)];
  if (entityType === "node" && entityFront.status) {
    trRows.push(txRow(`node:${id}`, "status", entityFront.status, timestamp));
  }
  for (const r of edgeRows) trRows.push(txRow(`edge:${r.id}`, "review", "proposed", timestamp));
  appendRows(join(instanceDir, "transitions", "transitions.md"), trRows);

  // ----- fleet fold log (derived-index linkage, outside the instance tree) -----
  // proposal_id is fleet vocabulary and does not enter the stored atom, so the
  // proposal -> atom linkage lands here, atomically in the same fold commit.
  appendFoldRecord(fleetDir || instanceDir, {
    proposalId: front.proposal_id ?? null,
    ref: `${entityType}:${id}`,
    agent: front.origin && front.origin.agent,
    edges: edgeRows.map((r) => r.id),
  });

  return {
    proposalId: front.proposal_id ?? null,
    entityType,
    entityId: id,
    file: relFile.split("\\").join("/"),
    edgeIds: edgeRows.map((r) => r.id),
    sourceRef: sourceHash,
  };
}

// Fold an ordered batch of verified proposals into `instanceDir`. Each is folded
// whole; a proposal the committer cannot place is set aside with its reason and
// the rest still fold. Returns { folded, setAside }.
export function foldProposals(instanceDir, items, { now, fleetDir } = {}) {
  const folded = [];
  const setAside = [];
  for (const it of items) {
    try {
      folded.push(foldProposal(instanceDir, it, { now, fleetDir }));
    } catch (e) {
      setAside.push({ proposalId: it.proposalId ?? null, reason: e.message });
    }
  }
  return { folded, setAside };
}
