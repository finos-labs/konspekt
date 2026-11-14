```yaml
id: artifact-conformance-checker
name: Conformance checker
kind: code
location: lib/conformance.mjs
review: proposed
provenance:
  sourceRef: ni:///sha-256;GL64s0C3knxFD_YrBEJa7nnb0vqfOhjp7ZJ7FKX54yY
  timestamp: 2026-07-20T18:00:00Z
  confidence: 0.9
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: 5ed08b5539e0bb86e59aa8a79ec1c903f0c569b2
    contentHash: 5ed08b5539e0bb86e59aa8a79ec1c903f0c569b2
createdAt: 2026-07-20T18:00:00Z
updatedAt: 2026-07-20T18:00:00Z
```
# Artifact: Conformance checker

R8. Reads an instance directory and checks it against `spec/data-model/schema.ts`
and `spec/architecture/SERIALIZATION.md`. Zero dependencies, never throws on a
broken instance, pure — no clock, no network, no git subprocess.

Neutral by placement: `lib/` belongs to neither `setup/` nor `visual/`; both
import it and neither imports the other. It was previously embedded in the
visualizer's snapshot build, where an adopter never saw it.

`lib/validate.mjs` is the CLI over it. `visual/build/snapshot.mjs` is the other
consumer. The `conformance` component installs both files into an adopter's repo
as projections.

Checks beyond the visualizer's original subset: edge kind and domain/range,
entity enums and the noteworthy status vocabularies, required fields, fields the
schema does not define, duplicate edge ids, weight outside `relates`, and the
provenance verify probe — `sources/<sourceRef>.md` must exist and its git blob
SHA must equal `contentHash`. The blob SHA is recomputed arithmetically rather
than shelled out, so verification works on a directory that is not a repository,
which is the condition the manual re-upload probe exercises.
