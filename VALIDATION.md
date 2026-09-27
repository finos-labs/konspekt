# Validating konspekt — native memory vs. the graph

konspekt's central claim (deck slide 14; `concept-compounding-advantage` in the
instance graph): for work that spans multiple sessions on a structured project, a
curated typed graph restores project context more reliably than native LLM
memory, and the advantage grows as the project grows. This document reports the
first controlled test of that claim.

## The comparison

Each system is measured by its cost to restore project context.

- konspekt restores by traversing typed nodes and edges. Sources, artifacts,
  command logs, and file-change logs are governance and are not needed to restore
  the graph, so they are excluded.
- Native LLM memory has no graph to traverse. Its only restore path is
  re-deriving context from verbatim history, so its baseline is project memory
  plus the full conversation transcripts.

Size, one snapshot (2026-09-26, prose only): native is about 831 KB (13.2 KB of
memory plus ~818 KB of transcript prose across 26 conversations); the konspekt
knowledge layer is about 256 KB (172 nodes, 300 edges). konspekt is about 3.2×
smaller and structured.

## The run

A re-establishment A/B: 240 fresh, tool-gated trials — 12 probe questions × 2
arms × 10 — pinned to one frozen commit.

- **Arm A (native):** project memory plus conversation search over transcripts;
  no repository access.
- **Arm B (konspekt):** read and traverse the instance graph at the pin; no
  memory, no conversation search.
- Correctness is scored first. Token cost is reported as relevant subgraph
  (primary) and whole-file total (secondary).
- Four question tiers: single-fact, multi-hop, rationale-chain, and live-state.

## Probe questions

The twelve questions, by tier. Both arms answered the same wording; neither arm
was shown entity ids or file locations.

**Tier 1 — single-fact**

1. Which storage backends does konspekt support, and which is the reference implementation?
2. What are the six human authority verbs?
3. Which agent files does setup write by default, and which is canonical?

**Tier 2 — multi-hop**

4. How does per-entity compare-and-swap relate to the write-scope split — what is versioned, and what is not?
5. How does the notifier deliver, and what is in its payload?
6. What fires the operating loop, and why is it event-based rather than per-turn or per-session?
7. What is the conversation-binding invariant, and what are the rules for an open conversation (bind-at-open, the active entity, retroactive binding)?

**Tier 3 — rationale-chain**

8. Trace how `goal-accountability` leads to the persona-change gate: what is accepted, and what is the current open item?
9. Reconstruct how `ROADMAP.md` is generated and why regeneration is coupled to accept authority; what is automated today, and what is deferred?
10. Trace the provenance model: how is content addressed, why is the source excerpt kept verbatim on both sides, and how does the enterprise storage interface change the content-address scheme?

**Tier 4 — live-state**

11. What is the current now/next/later roadmap — which tasks are open or proposed, and which are blocked, and why?
12. Is the binding-enforcement gap open or resolved? What enforces `binding: required` today (a persist-gate or detection-only, and where does it run), and what was the most recent decision about it?

## Results

Correctness — konspekt 120/120; native ~90/120. Every native miss is a freshness
or live-state failure; native never missed a simple fact.

| Tier | Questions | Native | konspekt |
|------|-----------|--------|----------|
| 1 — single-fact | Q1–3 | 60/60 | 60/60 |
| 2 — multi-hop | Q4–7 | 40/40 | 40/40 |
| 3 — rationale-chain | Q8–10 | Q8 0/10, Q9 partial, Q10 correct | 30/30 |
| 4 — live-state | Q11–12 | 0/20 | 20/20 |

Token cost — konspekt's relevant subgraph is 3–10× cheaper than native on
multi-hop, rationale, and live-state questions. Two caveats kept honest:

1. konspekt's whole-file total carries transport overhead — the single edge
   table, large specification files, and directory-listing navigation — so the
   total can equal or exceed native. The subgraph figure is the primary metric.
2. Native is cheaper for a single fact that sits in one large file with no
   sub-file addressing.

## The finding

The advantage is correctness on evolving state, and it grows two ways:

1. **Over time** — native memory is a time-frozen, lossy index. The older an
   accepted decision, the more reliably native returns the earlier draft (Q8:
   0/10; Q11: 0/10, with every trial reporting it could not confirm current
   status).
2. **As work accumulates** — when multiple workstreams share a topic, native's
   similarity-based recall conflates them (Q12: native answered about an adjacent
   workstream and inverted the key fact). Typed, addressable nodes stay distinct.

This is recorded in the instance graph as the accepted noteworthy
`nw-native-restore-stale-on-live-state`, alongside
`nw-native-restore-needs-verbatim` (the size argument).

## Scope and next step

This run is a mechanism test: it isolates retrieval by tool-gating fresh agents,
and the graph was built by the same model family that reads it (recorded as a
caveat, untested). The ecological test — a within-subject crossover with
independent users — is described in the `investigation-validation` node and
remains future work.

---

Measured on this project, 2026-09-26/27. Arm B and the graders were pinned to a
frozen `main` commit; Arm A used a matching transcript cutoff. The per-atom
record lives in `.konspekt/instance/`.
