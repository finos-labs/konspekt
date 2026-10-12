import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalizeEntity,
  computeEntityId,
  computeSourceHash,
  verifyEntityId,
  verifySourceHash,
} from "../payload.mjs";
import { gitBlobSha } from "../../../../lib/conformance.mjs";

const SOURCE = `konspekt source excerpt — conversation: demo
(a verbatim excerpt)
2026-10-10

Denis: a proposed concept, please.
`;

// A stored-form concept atom with review: proposed and provenance set, as a
// proposer authors it. `extra` lets a test perturb the bytes.
function entity({ sourceHash, prose = "A demonstration concept." } = {}) {
  return `\`\`\`yaml
id: concept-demo
label: demo
createdAt: 2026-10-10T16:00:00Z
updatedAt: 2026-10-10T16:00:00Z
review: proposed
provenance:
  sourceRef: ${sourceHash}
  contentHash: ${sourceHash}
  timestamp: 2026-10-10T16:00:00Z
  confidence: 0.8
\`\`\`
# Concept: demo

${prose}
`;
}

const sourceHash = computeSourceHash(Buffer.from(SOURCE, "utf8"));

test("canonicalizeEntity normalizes line endings and trailing newlines", () => {
  const e = entity({ sourceHash });
  const crlf = e.replace(/\n/g, "\r\n");
  assert.equal(
    canonicalizeEntity(crlf).toString("utf8"),
    canonicalizeEntity(e).toString("utf8"),
  );
  const padded = canonicalizeEntity(e + "\n\n\n").toString("utf8");
  assert.ok(padded.endsWith("\n"));
  assert.ok(!padded.endsWith("\n\n"));
});

test("the proposal id is the git blob SHA of the canonical entity bytes", () => {
  const e = entity({ sourceHash });
  assert.equal(computeEntityId(e), gitBlobSha(canonicalizeEntity(e)));
});

test("the proposal id is independent of line endings", () => {
  const e = entity({ sourceHash });
  assert.equal(computeEntityId(e.replace(/\n/g, "\r\n")), computeEntityId(e));
});

test("verifyEntityId accepts the matching id and rejects a tampered atom", () => {
  const e = entity({ sourceHash });
  const id = computeEntityId(e);
  assert.equal(verifyEntityId(e, id).ok, true);

  const tampered = entity({ sourceHash, prose: "A TAMPERED concept." });
  const v = verifyEntityId(tampered, id);
  assert.equal(v.ok, false);
  assert.notEqual(v.claimed, v.expected);
});

test("source hash matches git blob SHA and verifies against the atom's contentHash", () => {
  const e = entity({ sourceHash });
  assert.equal(sourceHash, gitBlobSha(Buffer.from(SOURCE, "utf8")));
  const v = verifySourceHash(e, Buffer.from(SOURCE, "utf8"));
  assert.equal(v.ok, true);
  assert.equal(v.claimed, sourceHash);
});

test("a swapped source fails source verification", () => {
  const e = entity({ sourceHash });
  const v = verifySourceHash(e, Buffer.from(SOURCE + "tampered\n", "utf8"));
  assert.equal(v.ok, false);
});
