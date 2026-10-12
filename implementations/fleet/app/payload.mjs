// Proposal addressing: content-address the stored-form atom and its source.
//
// A proposal is one directory on a proposer's outbox namespace
// (nw-fleet-remove-fold-translation):
//
//   proposals/<proposal-id>/
//     entity.md   # the stored-form konspekt atom, authored by the proposer:
//                 #   a ```yaml fence carrying review: proposed and provenance,
//                 #   then prose. The committer appends it to canonical byte for
//                 #   byte; there is no payload-to-stored-form translation.
//     source.md   # verbatim excerpt, content-addressed
//     edges.md    # the edge rows that wire the atom (edges.md table body)
//     meta.json   # fleet envelope: origin, binding, depends_on, entity_type
//
// <proposal-id> is the git blob SHA of the canonicalized entity.md — the same
// content address the store uses for every other object, and, because the
// committer writes entity.md unchanged, the git blob SHA the atom's file carries
// on canonical. This module only hashes and compares; it parses the entity with
// lib/conformance.mjs (splitEntityFile), the one stored-form reader.

import { gitBlobSha, splitEntityFile } from "../../../lib/conformance.mjs";

// Canonical entity bytes: CRLF/CR normalized to LF, exactly one trailing LF, so
// a proposer on any platform and the committer agree on the id and on the bytes
// written to canonical. The committer writes these same bytes, so the atom's
// file on canonical hashes back to the proposal id.
export function canonicalizeEntity(entityMdText) {
  let s = String(entityMdText).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/\n+$/, "") + "\n";
  return Buffer.from(s, "utf8");
}

// The proposal id: the git blob SHA of the canonical entity bytes.
export function computeEntityId(entityMdText) {
  return gitBlobSha(canonicalizeEntity(entityMdText));
}

// `provenance.contentHash` (== sourceRef in the git binding) is the git blob SHA
// over the raw bytes of source.md.
export function computeSourceHash(sourceMdBytes) {
  return gitBlobSha(sourceMdBytes);
}

// Recompute the proposal id over the canonical entity bytes and compare it to
// the id the outbox directory claims. An atom altered after it was addressed
// fails here and never appends.
export function verifyEntityId(entityMdText, claimedId) {
  const expected = computeEntityId(entityMdText);
  return { ok: claimedId === expected, claimed: claimedId ?? null, expected };
}

// Recompute the source hash over source.md and compare it to the entity's own
// provenance.contentHash. The proposer sets contentHash; the committer confirms
// the excerpt the atom cites is the excerpt that arrived.
export function verifySourceHash(entityMdText, sourceMdBytes) {
  const { front } = splitEntityFile(entityMdText);
  const claimed = front.provenance && front.provenance.contentHash;
  const expected = computeSourceHash(sourceMdBytes);
  return { ok: claimed === expected, claimed: claimed ?? null, expected };
}
