// Proposal payload: parse, canonicalize, and content-address.
//
// A proposal is one directory on a proposer's outbox branch (fleet-spec.md
// § Proposal payload schema):
//
//   proposals/<proposal-id>/
//     proposal.md   # `---` frontmatter + proposed entity body + proposed edge rows
//     source.md     # verbatim excerpt, content-addressed
//
// Note the payload frontmatter is delimited by `---`, which is the fleet
// payload format, NOT the stored konspekt entity format (a ```yaml fence). The
// committer rewrites a folded atom into the entity format at fold time; here we
// only parse and verify the payload as it arrives, so this module ships its own
// `---` splitter and reuses lib/conformance.mjs only for the YAML-subset parse
// and the git blob SHA.

import { gitBlobSha, parseYamlSubset } from "../../../../lib/conformance.mjs";

// ---------- canonicalization (pinned, see docs/DESIGN.md) ----------
//
// `proposal_id` is the git blob SHA of the canonicalized proposal. The v1 fleet
// binding adds no second content-address, so the id uses the same scheme as
// every other address in the store. Canonical bytes are proposal.md with the
// single `proposal_id:` line removed (a field cannot address itself), CRLF/CR
// normalized to LF, and exactly one trailing LF.

export function canonicalizeProposal(proposalMdText) {
  let s = String(proposalMdText).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Remove the single proposal_id: line (with its line break, wherever it sits).
  s = s.replace(/^[ \t]*proposal_id:[^\n]*\n?/m, "");
  // Exactly one trailing newline.
  s = s.replace(/\n+$/, "") + "\n";
  return Buffer.from(s, "utf8");
}

export function computeProposalId(proposalMdText) {
  return gitBlobSha(canonicalizeProposal(proposalMdText));
}

// `source.hash` is the git blob SHA over the raw bytes of source.md, computed
// separately and embedded in proposal.md. Because the id is taken over
// proposal.md (which carries source.hash), proposal_id transitively covers the
// source excerpt without hashing it twice.
export function computeSourceHash(sourceMdBytes) {
  return gitBlobSha(sourceMdBytes);
}

// ---------- parse ----------

// Split a `---`-delimited payload into { front, body }. `front` is the parsed
// YAML-subset frontmatter; `body` is the proposed entity body plus edge rows,
// verbatim and trimmed. Throws on a payload with no frontmatter, because an
// unframed payload has no verifiable id, origin, or scope.
export function parseProposal(proposalMdText) {
  const t = String(proposalMdText).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const m = t.match(/^---\n([\s\S]*?)\n---[ \t]*\n?/);
  if (!m) {
    throw new Error("proposal.md has no `---` frontmatter");
  }
  return { front: parseYamlSubset(m[1]), body: t.slice(m[0].length).trim() };
}

// ---------- verify ----------

// Recompute proposal_id over the canonical bytes and compare to the id the
// payload claims in its frontmatter. A proposal altered after its id was
// assigned fails here and never folds.
export function verifyProposalId(proposalMdText) {
  const { front } = parseProposal(proposalMdText);
  const claimed = front.proposal_id;
  const expected = computeProposalId(proposalMdText);
  return { ok: claimed === expected, claimed: claimed ?? null, expected };
}

// Recompute the source hash over the raw source.md bytes and compare to the
// hash the payload claims under `source.hash`.
export function verifySourceHash(proposalMdText, sourceMdBytes) {
  const { front } = parseProposal(proposalMdText);
  const claimed = front.source && front.source.hash;
  const expected = computeSourceHash(sourceMdBytes);
  return { ok: claimed === expected, claimed: claimed ?? null, expected };
}
