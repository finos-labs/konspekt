// Fold order, kept separate from bless order (fleet-spec.md § Committer protocol,
// step 3).
//
// Fold order is arrival order across branches: the store is grow-only and
// persist never waits on review, so `depends_on` does not gate the fold. A
// proposal folds as soon as it verifies, regardless of whether its premises are
// accepted yet. Bless order (which DOES hold a proposal back while any id in its
// `depends_on` is still proposed or rejected) is a separate ordering and lands
// with bless in M7.
//
// Arrival is modelled here as the proposal's `created` timestamp, tiebroken by
// `proposal_id` so the order is total and deterministic across machines. A later
// milestone can replace this with the real per-branch commit sequence; the shape
// (a stable total order over the verified set) stays the same.

// Order a verified set for folding. Each item needs `created` and `proposalId`.
// Returns a new array; the input is not mutated.
export function foldOrder(items) {
  return items.slice().sort((a, b) => {
    const ca = a.created ?? "";
    const cb = b.created ?? "";
    if (ca !== cb) return ca < cb ? -1 : 1;
    const ia = a.proposalId ?? "";
    const ib = b.proposalId ?? "";
    return ia < ib ? -1 : ia > ib ? 1 : 0;
  });
}
