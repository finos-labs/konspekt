// Per-proposal verification (fleet-spec.md § Committer protocol, step 2).
//
// The committer recomputes every self-describing field and confirms the payload
// agrees with where it came from. A proposal that fails any check is set aside
// with a reason and kept for the record, so a malformed or spoofed atom never
// folds onto canonical.
//
// Scope here is the proposer grant, which is distinct from konspekt accept
// authority (lib/authority.mjs, who may *accept* an atom). This grant is which
// entity types an agent may *propose*, and the invariant that an agent only ever
// proposes `atom_state: proposed` — agents propose, humans accept. The check is
// triage for accountability, not a security boundary: keeping a spoofed or
// off-scope commit off canonical is the sandbox and hooks' job, so no reader
// treats this verdict as enforcement.

import { parseProposal, verifyProposalId, verifySourceHash } from "./payload.mjs";

// Entity types an agent may propose when no narrower grant is given. Project is
// excluded; an agent does not propose the project root.
export const DEFAULT_PROPOSE_ENTITY_TYPES = ["concept", "noteworthy", "artifact", "node", "waypoint"];

// Verify one proposal.
//   proposalMd   the proposal.md text
//   sourceMd     the source.md text (or null when the file is absent)
//   branchOwner  the handle the committer's branch->owner map returns for the
//                outbox branch this payload arrived on (null for an unregistered
//                branch, which fails the origin check)
//   grant        { entityTypes?: string[] } the proposing agent's propose grant
//   known        optional Set of ids a `depends_on` may resolve against (folded
//                or accepted atoms plus sibling proposals in this batch); when
//                omitted, depends_on is not resolved here
//
// Returns { ok, checks, reasons, proposalId, agent }. `ok` is every check true.
export function verifyProposal({ proposalMd, sourceMd, branchOwner, grant = {}, known = null }) {
  let front;
  try {
    ({ front } = parseProposal(proposalMd));
  } catch (e) {
    return { ok: false, checks: { parse: false }, reasons: [`unparseable payload: ${e.message}`], proposalId: null, agent: null };
  }

  const checks = {};
  const reasons = [];

  // id: recompute over the canonical bytes and compare to the claimed id.
  const idv = verifyProposalId(proposalMd);
  checks.id = idv.ok;
  if (!idv.ok) reasons.push(`proposal_id mismatch (claimed ${idv.claimed ?? "(none)"}, expected ${idv.expected})`);

  // source: recompute the git blob SHA over source.md and compare.
  if (sourceMd != null) {
    const sv = verifySourceHash(proposalMd, Buffer.from(sourceMd, "utf8"));
    checks.source = sv.ok;
    if (!sv.ok) reasons.push(`source hash mismatch (claimed ${sv.claimed ?? "(none)"}, expected ${sv.expected})`);
  } else {
    checks.source = false;
    reasons.push("source.md is missing");
  }

  // origin: the declared agent must equal the outbox branch owner.
  const agent = front.origin && front.origin.agent;
  checks.origin = Boolean(branchOwner) && agent === branchOwner;
  if (!checks.origin) {
    reasons.push(`origin.agent ${agent ?? "(none)"} does not match branch owner ${branchOwner ?? "(unregistered branch)"}`);
  }

  // scope: entity_type within the grant, and atom_state is proposed.
  const entityType = ((front.scope && front.scope.entity_type) || "").toLowerCase();
  const allowed = (grant.entityTypes ?? DEFAULT_PROPOSE_ENTITY_TYPES).map((s) => s.toLowerCase());
  const atomState = front.scope && front.scope.atom_state;
  const typeOk = Boolean(entityType) && allowed.includes(entityType);
  const stateOk = atomState === "proposed";
  checks.scope = typeOk && stateOk;
  if (!typeOk) reasons.push(`scope.entity_type ${entityType || "(none)"} is outside the agent's grant`);
  if (!stateOk) reasons.push(`scope.atom_state ${atomState ?? "(none)"} is not "proposed" (agents propose, humans accept)`);

  // provenance.confidence: present and in [0,1]; it is the REVIEW.md sort key.
  const conf = front.provenance && front.provenance.confidence;
  checks.confidence = typeof conf === "number" && conf >= 0 && conf <= 1;
  if (!checks.confidence) reasons.push(`provenance.confidence ${conf ?? "(none)"} missing or outside [0,1]`);

  // binding: a resolved entity id, or a recorded decision not to bind (none:<reason>).
  const binding = front.binding;
  checks.binding = typeof binding === "string" && binding.length > 0 &&
    (binding.startsWith("none:") || !/\s/.test(binding));
  if (!checks.binding) reasons.push(`binding ${binding ?? "(none)"} is unresolved`);

  // depends_on: when a resolution set is given, every premise must be in it.
  const deps = Array.isArray(front.depends_on) ? front.depends_on : [];
  if (known) {
    const unresolved = deps.filter((d) => !known.has(d));
    checks.depends_on = unresolved.length === 0;
    if (unresolved.length) reasons.push(`depends_on unresolved: ${unresolved.join(", ")}`);
  } else {
    checks.depends_on = true;
  }

  const ok = Object.values(checks).every(Boolean);
  return { ok, checks, reasons, proposalId: front.proposal_id ?? null, agent: agent ?? null };
}
