```yaml
id: nw-accept-scope-open-predicate
kind: decision
review: accepted
provenance:
  sourceRef: 7a4c18fa5e2285df902a347033daed7611423d67
  contentHash: 7a4c18fa5e2285df902a347033daed7611423d67
  conversationId: fleet-authority
  timestamp: 2026-09-21T00:53:00Z
  confidence: 0.95
createdAt: 2026-09-21T00:53:00Z
updatedAt: 2026-09-21T00:53:00Z
```
# Noteworthy: machine accept authority is scoped by an open predicate

Machine accept authority is scoped by an **open predicate** — "persona P may
accept atoms matching predicate X" — and **no classification taxonomy is frozen
into the standard**. The taxonomy is enterprise policy; freezing one into the
spec would not fit every adopter.

The predicate set carries a hard constraint from [[nw-unique-acceptor-per-atom]]:
it must produce a **partition**, so predicate design has to guarantee
non-overlap, not merely define categories. Agent classification, in this shape,
is a sub-feature of delegated accept (the third authority level) and is inert
below it — its only job is to define the predicate that scopes a machine
persona's accept authority.

Refines the classification dimension of [[task-authority-mechanism]].
