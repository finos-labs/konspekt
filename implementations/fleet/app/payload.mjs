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
// <proposal-id> is the hex SHA-256 of the canonicalized entity.md, the same
// digest and encoding the store uses to name content-addressed files
// (`sha-256/<hex>.md`). Because the committer writes entity.md unchanged, the
// atom's file on canonical hashes back to the proposal id. This module only hashes and compares; it parses the entity with
// lib/conformance.mjs (splitEntityFile), the one stored-form reader.

import { sha256Hex, niRef, splitEntityFile } from "../../../lib/conformance.mjs";

// Canonical entity bytes: CRLF/CR normalized to LF, exactly one trailing LF, so
// a proposer on any platform and the committer agree on the id and on the bytes
// written to canonical. The committer writes these same bytes, so the atom's
// file on canonical hashes back to the proposal id.
export function canonicalizeEntity(entityMdText) {
  let s = String(entityMdText).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/\n+$/, "") + "\n";
  return Buffer.from(s, "utf8");
}

// The proposal id: the hex SHA-256 of the canonical entity bytes.
export function computeEntityId(entityMdText) {
  return sha256Hex(canonicalizeEntity(entityMdText));
}

// `provenance.sourceRef` is the RFC 6920 `ni:///sha-256;<base64url>` reference
// over the raw bytes of source.md. contentHash is derived from it, not stored.
export function computeSourceHash(sourceMdBytes) {
  return niRef(sourceMdBytes);
}

// Recompute the proposal id over the canonical entity bytes and compare it to
// the id the outbox directory claims. An atom altered after it was addressed
// fails here and never appends.
export function verifyEntityId(entityMdText, claimedId) {
  const expected = computeEntityId(entityMdText);
  return { ok: claimedId === expected, claimed: claimedId ?? null, expected };
}

// Recompute the source reference over source.md and compare it to the entity's
// own provenance.sourceRef. The proposer sets sourceRef; the committer confirms
// the excerpt the atom cites is the excerpt that arrived.
export function verifySourceHash(entityMdText, sourceMdBytes) {
  const { front } = splitEntityFile(entityMdText);
  const claimed = front.provenance && front.provenance.sourceRef;
  const expected = computeSourceHash(sourceMdBytes);
  return { ok: claimed === expected, claimed: claimed ?? null, expected };
}

// ----- carried files (task-fleet-proposal-carries-files) -----
//
// A proposal may carry repository files to land on canonical beside the atom
// (documents, code, config). Each is content-addressed by the `ni:` SHA-256
// reference over its bytes, the same address the store uses for sources, so the
// committer can confirm the bytes it folds are the bytes the proposer declared.
export function computeFileHash(bytes) {
  return niRef(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes));
}

// Normalize and vet a carried file's target path (where it lands on canonical).
// A target must be a repo-relative POSIX path: no absolute path or drive letter,
// no `.`/`..`/empty segment (so it cannot escape the repo), and — when
// `instanceSubdir` is given — not inside the portable konspekt instance, whose
// content arrives as atoms, not as a file payload. Returns { ok, path, reason };
// on ok, `path` is the forward-slash normalized target. Shared by the proposer
// (at author time), verify (set-aside), and fold (defensive guard).
export function normalizeFileTarget(target, { instanceSubdir = "" } = {}) {
  if (typeof target !== "string" || target.trim() === "") {
    return { ok: false, path: null, reason: "file target is empty" };
  }
  const raw = target.trim();
  if (raw.startsWith("/") || raw.startsWith("\\") || /^[a-zA-Z]:[\\/]/.test(raw)) {
    return { ok: false, path: null, reason: `file target "${raw}" is absolute; targets are repo-relative` };
  }
  const segments = raw.split(/[\\/]+/);
  for (const seg of segments) {
    if (seg === "" || seg === "." || seg === "..") {
      return { ok: false, path: null, reason: `file target "${raw}" has an illegal path segment "${seg}"` };
    }
  }
  const path = segments.join("/");
  if (instanceSubdir) {
    const inst = String(instanceSubdir).split(/[\\/]+/).filter(Boolean).join("/");
    if (inst && (path === inst || path.startsWith(inst + "/"))) {
      return { ok: false, path: null, reason: `file target "${path}" is inside the instance (${inst}); instance content arrives as atoms, not files` };
    }
  }
  return { ok: true, path, reason: null };
}
