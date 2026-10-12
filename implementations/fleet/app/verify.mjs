// Per-proposal verification (fleet-spec.md § Committer protocol, step 2;
// nw-fleet-remove-fold-translation).
//
// The committer runs record-level checks on the stored-form bytes it receives
// and confirms the atom agrees with where it came from. A proposal that fails
// any check is set aside with a reason and kept for the record, so a malformed
// or spoofed atom never appends onto canonical.
//
// Scope here is the proposer grant, which is distinct from konspekt accept
// authority (lib/authority.mjs, who may *accept* an atom). This grant is which
// entity types an agent may *propose*, and the invariant that an agent only ever
// authors `review: proposed` — agents propose, humans accept. The check is
// triage for accountability, not a security boundary: keeping a spoofed or
// off-scope commit off canonical is the sandbox and hooks' job, so no reader
// treats this verdict as enforcement.

import { splitEntityFile } from "../../../lib/conformance.mjs";
import { verifySourceHash } from "./payload.mjs";

// Entity types an agent may propose when no narrower grant is given. Project is
// excluded; an agent does not propose the project root.
export const DEFAULT_PROPOSE_ENTITY_TYPES = ["concept", "noteworthy", "artifact", "node", "waypoint"];

// Verify one proposal.
//   entityMd     the stored-form atom (entity.md) text
//   sourceMd     the source.md text (or null when the file is absent)
//   meta         the fleet envelope { entity_type, origin, binding, depends_on }
//   branchOwner  the handle the committer's branch->owner map returns for the
//                outbox branch this proposal arrived on (null for an
//                unregistered branch, which fails the origin check)
//   grant        { entityTypes?: string[] } the proposing agent's propose grant
//   known        optional Set of ids a `depends_on` may resolve against (appended
//                or accepted atoms plus sibling proposals in this batch); when
//                omitted, depends_on is not resolved here
//
// Returns { ok, checks, reasons, entityId, entityType, agent }. `ok` is every
// check true.
export function verifyProposal({ entityMd, sourceMd, meta = {}, branchOwner, grant = {}, known = null }) {
  const { front, noFrontmatter } = splitEntityFile(String(entityMd ?? ""));
  if (noFrontmatter || !front.id) {
    return {
      ok: false,
      checks: { parse: false },
      reasons: ["entity.md has no ```yaml fence with an id"],
      entityId: null,
      entityType: null,
      agent: null,
    };
  }

  const checks = {};
  const reasons = [];
  const agent = meta.origin && meta.origin.agent;
  const entityType = String(meta.entity_type || "").toLowerCase();

  // source: recompute the git blob SHA over source.md and compare it to the
  // atom's own provenance.contentHash.
  if (sourceMd != null) {
    const sv = verifySourceHash(String(entityMd), Buffer.from(sourceMd, "utf8"));
    checks.source = sv.ok;
    if (!sv.ok) reasons.push(`source hash mismatch (atom claims ${sv.claimed ?? "(none)"}, excerpt hashes to ${sv.expected})`);
  } else {
    checks.source = false;
    reasons.push("source.md is missing");
  }

  // origin: the envelope's agent must equal the outbox branch owner.
  checks.origin = Boolean(branchOwner) && agent === branchOwner;
  if (!checks.origin) {
    reasons.push(`origin.agent ${agent ?? "(none)"} does not match branch owner ${branchOwner ?? "(unregistered branch)"}`);
  }

  // scope: entity_type within the grant, and the atom's review is proposed.
  const allowed = (grant.entityTypes ?? DEFAULT_PROPOSE_ENTITY_TYPES).map((s) => s.toLowerCase());
  const typeOk = Boolean(entityType) && allowed.includes(entityType);
  const reviewOk = front.review === "proposed";
  checks.scope = typeOk && reviewOk;
  if (!typeOk) reasons.push(`entity_type ${entityType || "(none)"} is outside the agent's grant`);
  if (!reviewOk) reasons.push(`review ${front.review ?? "(none)"} is not "proposed" (agents propose, humans accept)`);

  // provenance.confidence: present and in [0,1]; it is the REVIEW.md sort key.
  const conf = front.provenance && front.provenance.confidence;
  checks.confidence = typeof conf === "number" && conf >= 0 && conf <= 1;
  if (!checks.confidence) reasons.push(`provenance.confidence ${conf ?? "(none)"} missing or outside [0,1]`);

  // binding: a resolved entity id, or a recorded decision not to bind (none:<reason>).
  const binding = meta.binding;
  checks.binding = typeof binding === "string" && binding.length > 0 &&
    (binding.startsWith("none:") || !/\s/.test(binding));
  if (!checks.binding) reasons.push(`binding ${binding ?? "(none)"} is unresolved`);

  // depends_on: when a resolution set is given, every premise must be in it.
  const deps = Array.isArray(meta.depends_on) ? meta.depends_on : [];
  if (known) {
    const unresolved = deps.filter((d) => !known.has(d));
    checks.depends_on = unresolved.length === 0;
    if (unresolved.length) reasons.push(`depends_on unresolved: ${unresolved.join(", ")}`);
  } else {
    checks.depends_on = true;
  }

  const ok = Object.values(checks).every(Boolean);
  return { ok, checks, reasons, entityId: front.id, entityType, agent: agent ?? null };
}
