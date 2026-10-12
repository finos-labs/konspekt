// Proposer side: author a stored-form atom and write it onto the agent's own
// outbox namespace (nw-fleet-remove-fold-translation).
//
// The proposer authors the konspekt atom in its final stored form — a ```yaml
// fence carrying `review: proposed` and a complete `provenance` block, then
// prose — exactly as a single-agent conversation writes a proposed atom. There
// is no separate payload schema: the committer appends entity.md to canonical
// byte for byte. Alongside it the proposer writes the verbatim source excerpt,
// the edge rows that wire the atom, and a small fleet envelope (origin, binding,
// depends_on, entity_type) that stays out of the stored atom.
//
// A proposal is one directory `proposals/<proposal-id>/` holding entity.md,
// source.md, edges.md, and meta.json. The id is the git blob SHA of the
// canonical entity bytes, so the directory name, the proposal id, and the atom's
// eventual file on canonical all share one content address. Writing lands only
// in the proposer's worktree, which is bound to its own outbox branch, so a
// proposal never touches canonical or a peer's branch.

import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { canonicalizeEntity, computeEntityId, computeSourceHash } from "./payload.mjs";
import { commitAll } from "./git.mjs";

// Render an edges block exactly as the rows land in edges.md. A proposal's edges
// carry a per-row `review` override (typically `proposed`), per the
// serialization. Used both for edges.md and by the committer's placement check.
export function renderEdgesBlock(rows = []) {
  const header =
    "| id | kind | from | to | weight | review |\n" +
    "|----|------|------|----|--------|--------|\n";
  if (rows.length === 0) return header;
  const body = rows
    .map((r) => `| ${r.id} | ${r.kind} | ${r.from} | ${r.to} | ${r.weight ?? ""} | ${r.review ?? "proposed"} |`)
    .join("\n");
  return header + body + "\n";
}

// Render the provenance block the proposer sets on its own atom. In the git
// binding the source address is one hash: sourceRef == contentHash == the git
// blob SHA of source.md (SERIALIZATION.md; lib/conformance.mjs enforces it).
function renderProvenance({ sourceHash, conversationId, timestamp, confidence }) {
  const lines = ["provenance:", `  sourceRef: ${sourceHash}`, `  contentHash: ${sourceHash}`];
  if (conversationId) lines.push(`  conversationId: ${conversationId}`);
  lines.push(`  timestamp: ${timestamp}`);
  lines.push(`  confidence: ${confidence}`);
  return lines.join("\n");
}

// Assemble a stored-form proposal from the proposer's authored fence and prose,
// its source excerpt, its wiring edges, and the fleet envelope. The proposer
// owns `review` and `provenance`; this renders them into the entity fence, so
// entity.md is the complete stored atom. Returns
// { proposalId, entityType, entityMd, sourceMd, edgesMd, meta }.
//
//   entityType   konspekt entity type (concept|noteworthy|artifact|node|
//                waypoint); placement and the id-prefix check read it, and it
//                rides in meta. It is NOT written as a fence field.
//   fence        the proposer-authored fence lines for the type (id, the
//                type-specific fields, createdAt, updatedAt), without review or
//                provenance.
//   prose        the markdown body after the fence.
//   edges        the edge rows wiring the atom.
export function assembleProposal({
  entityType,
  fence,
  prose = "",
  review = "proposed",
  confidence,
  conversationId,
  timestamp,
  origin,
  binding,
  dependsOn = [],
  edges = [],
  source,
}) {
  if (!entityType) throw new Error("proposal needs entityType");
  if (!fence) throw new Error("proposal needs an authored entity fence");
  if (!origin || !origin.agent) throw new Error("proposal needs origin.agent");
  if (confidence === undefined || confidence === null) throw new Error("proposal needs provenance.confidence");
  if (!binding) throw new Error("proposal needs a resolved binding (or none:<reason>)");

  const sourceMd = String(source);
  const sourceHash = computeSourceHash(Buffer.from(sourceMd, "utf8"));
  const ts = timestamp ?? new Date().toISOString();

  const fenceText = [
    String(fence).trim(),
    `review: ${review}`,
    renderProvenance({ sourceHash, conversationId, timestamp: ts, confidence }),
  ].join("\n");
  const entityMd = canonicalizeEntity("```yaml\n" + fenceText + "\n```\n" + String(prose).trim() + "\n").toString("utf8");

  const proposalId = computeEntityId(entityMd);
  const edgesMd = renderEdgesBlock(edges);
  const meta = {
    entity_type: entityType,
    origin: { agent: origin.agent, model: origin.model ?? "unknown", session: origin.session ?? "" },
    binding,
    depends_on: dependsOn,
  };
  return { proposalId, entityType, entityMd, sourceMd, edgesMd, meta };
}

// Write an assembled proposal into `worktreePath` under proposals/<id>/, without
// committing. Returns { proposalId, dir }.
export function writeProposal(worktreePath, assembled) {
  const { proposalId, entityMd, sourceMd, edgesMd, meta } = assembled;
  const dir = join(worktreePath, "proposals", proposalId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "entity.md"), entityMd, "utf8");
  writeFileSync(join(dir, "source.md"), sourceMd, "utf8");
  writeFileSync(join(dir, "edges.md"), edgesMd, "utf8");
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
  return { proposalId, dir };
}

// Write and commit a proposal onto the proposer's outbox branch. Git authorship
// stays the human committer with the DCO trailer; which agent proposed lives in
// the fleet envelope (meta.origin.agent), verified against the branch owner, and
// is recorded in the transition `by` column at fold time, not in git authorship.
export function proposeToOutbox(worktreePath, assembled, { identity = {} } = {}) {
  const { proposalId, dir } = writeProposal(worktreePath, assembled);
  const commit = commitAll(worktreePath, `outbox: ${proposalId}`, {
    name: identity.name,
    email: identity.email,
    signoff: true,
  });
  return { proposalId, dir, commit };
}
