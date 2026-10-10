// Proposer side: assemble a proposal payload and write it onto the agent's own
// outbox branch (fleet-spec.md § Proposal payload schema).
//
// A proposal is one directory `proposals/<proposal-id>/` holding `proposal.md`
// (a `---`-framed payload) and `source.md` (the verbatim excerpt). The proposer
// assembles and signs the payload here; the id is computed over the canonical
// bytes and then embedded, so `proposal_id` names the directory and the payload
// agrees with its own name. Writing lands only in the proposer's worktree, which
// is bound to its own outbox branch, so a proposal never touches canonical or a
// peer's branch.

import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { computeProposalId, computeSourceHash } from "./payload.mjs";
import { commitAll } from "./git.mjs";

// Render an edges block exactly as the rows land in edges.md, for the caller to
// append to an entity body. A proposal's edges carry a per-row `review`
// override (typically `proposed`), per the serialization.
export function renderEdgesBlock(rows = []) {
  if (rows.length === 0) return "";
  const header =
    "edges:\n" +
    "| id | kind | from | to | weight | review |\n" +
    "|----|------|------|----|--------|--------|\n";
  const body = rows
    .map((r) => `| ${r.id} | ${r.kind} | ${r.from} | ${r.to} | ${r.weight ?? ""} | ${r.review ?? ""} |`)
    .join("\n");
  return header + body + "\n";
}

// Render the `---` frontmatter in a fixed field order. The order only has to be
// internally consistent: the id is computed over these bytes (minus the id line)
// and the committer recomputes over the same bytes, so a stable order keeps
// proposer and committer in agreement. `proposalId`, when given, leads the
// block; omit it to produce the unsigned bytes the id is computed over.
function renderFrontmatter(f, proposalId) {
  const lines = [];
  if (proposalId) lines.push(`proposal_id: ${proposalId}`);
  lines.push(`kind: ${f.kind}`);
  lines.push("origin:");
  lines.push(`  agent: ${f.origin.agent}`);
  lines.push(`  model: ${f.origin.model}`);
  lines.push(`  session: ${f.origin.session}`);
  lines.push("scope:");
  lines.push(`  entity_type: ${f.scope.entity_type}`);
  lines.push(`  atom_state: ${f.scope.atom_state ?? "proposed"}`);
  lines.push("target:");
  lines.push(`  node: ${f.target.node}`);
  lines.push(`depends_on: [${(f.depends_on ?? []).join(", ")}]`);
  lines.push("provenance:");
  lines.push(`  confidence: ${f.provenance.confidence}`);
  lines.push(`binding: ${f.binding}`);
  lines.push("source:");
  lines.push(`  hash: ${f.source.hash}`);
  lines.push(`  path: sources/${f.source.hash}.md`);
  if (f.claim) {
    lines.push("claim:");
    lines.push(`  region: ${f.claim.region}`);
  }
  lines.push(`created: ${f.created}`);
  return lines.join("\n");
}

// Assemble a signed proposal from its fields, a body, and the source excerpt.
// Returns { proposalId, proposalMd, sourceMd }. `source` is the verbatim excerpt
// text; its git blob SHA is computed here and embedded as `source.hash`.
export function assembleProposal({
  kind = "entity",
  origin,
  scope,
  target = { node: "new" },
  dependsOn = [],
  confidence,
  binding,
  claim = null,
  created,
  body,
  source,
}) {
  if (!origin || !origin.agent) throw new Error("proposal needs origin.agent");
  if (!scope || !scope.entity_type) throw new Error("proposal needs scope.entity_type");
  if (confidence === undefined || confidence === null) throw new Error("proposal needs provenance.confidence");
  if (!binding) throw new Error("proposal needs a resolved binding (or none:<reason>)");

  const sourceMd = String(source);
  const sourceHash = computeSourceHash(Buffer.from(sourceMd, "utf8"));
  const fields = {
    kind,
    origin,
    scope,
    target,
    depends_on: dependsOn,
    provenance: { confidence },
    binding,
    source: { hash: sourceHash },
    claim,
    created,
  };

  const unsigned = `---\n${renderFrontmatter(fields)}\n---\n${String(body).trim()}\n`;
  const proposalId = computeProposalId(unsigned);
  const proposalMd = `---\n${renderFrontmatter(fields, proposalId)}\n---\n${String(body).trim()}\n`;
  return { proposalId, proposalMd, sourceMd };
}

// Write an assembled proposal into `worktreePath` under proposals/<id>/, without
// committing. Returns { proposalId, dir }.
export function writeProposal(worktreePath, assembled) {
  const { proposalId, proposalMd, sourceMd } = assembled;
  const dir = join(worktreePath, "proposals", proposalId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "proposal.md"), proposalMd, "utf8");
  writeFileSync(join(dir, "source.md"), sourceMd, "utf8");
  return { proposalId, dir };
}

// Write and commit a proposal onto the proposer's outbox branch. Git authorship
// stays the human committer with the DCO trailer; which agent proposed lives in
// the payload's origin tag, not in git authorship (fleet-spec.md § Model).
export function proposeToOutbox(worktreePath, assembled, { identity = {} } = {}) {
  const { proposalId, dir } = writeProposal(worktreePath, assembled);
  const commit = commitAll(worktreePath, `outbox: ${proposalId}`, {
    name: identity.name,
    email: identity.email,
    signoff: true,
  });
  return { proposalId, dir, commit };
}
