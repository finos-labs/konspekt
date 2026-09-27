```yaml
id: nw-native-restore-stale-on-live-state
kind: statement
review: accepted
provenance:
  sourceRef: d40ce7c8d0c9cd565cd2fac43a74401b29345684
  contentHash: d40ce7c8d0c9cd565cd2fac43a74401b29345684
  timestamp: 2026-09-27T02:30:00Z
  conversationId: native-vs-konspekt-validation-run
createdAt: 2026-09-27T02:30:00Z
updatedAt: 2026-09-27T02:30:00Z
```
# Noteworthy: Native memory restore goes confidently wrong on live state, while graph traversal stays correct

Measured on this project across a 240-trial re-establishment run on 2026-09-26/27
(12 probe questions across four tiers, two arms — native memory plus conversation
search versus konspekt-only traversal — ten fresh tool-gated trials each, pinned
to a frozen main commit; correctness graded independently). Both arms answer
simple facts correctly, and the konspekt arm's relevant subgraph is three-to-ten
times cheaper on multi-hop questions. The separation between the two systems is
correctness on evolving state.

The native arm was systematically wrong wherever the answer turned on current
per-atom state. It reproduced a stale accepted-state snapshot (question 8, ten of
ten wrong; question 11, ten of ten reporting a superseded roadmap and
self-reporting that it could not confirm current status), and on one topic
carrying two overlapping workstreams it answered about the wrong one (question
12), inverting the key fact. The konspekt arm read current typed state and was
correct on all live-state questions (120 of 120 correct overall; every native
miss was a freshness or live-state failure, never a simple-fact error).

Two mechanisms drive the gap, and both grow with the project. Native memory is a
time-frozen, lossy index: the older an accepted decision, the more reliably the
native arm returns the earlier draft. And as multiple workstreams accumulate on
one topic, fuzzy transcript recall conflates them, while typed addressable nodes
keep them distinct. This is the correctness-and-integrity dimension of the
compounding-advantage claim, complementary to the size argument in
nw-native-restore-needs-verbatim. It also bears on one falsification condition of
concept-compounding-advantage — integrity inverting under churn: the
confidently-wrong rate rose under churn on the native side, not the graph side.
