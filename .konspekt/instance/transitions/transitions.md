# Transitions

Append-only log of every `review` and `status` assignment in this instance, for
entities and edges, one row per assignment in the order written
(`spec/architecture/SERIALIZATION.md` § Transitions). `ref` is `type:id` or
`edge:<id>`. An empty `from` marks a birth row. `source`, when present, is the
`sources/` excerpt holding the human acceptance or authority verb. `by`, when
present, is the principal in `authority/principals.md` that wrote the value.

Backfill note: rows timestamped before 2026-10-04 reconstruct this instance's
history from the store's commit log. Each has the author time of the commit
that wrote the value, so all backfilled rows use one timestamp source. None has
a `source`, because the accepting exchanges were not captured. Fourteen edge ids
that appear in history and no longer exist are omitted. Rows from 2026-10-04 on
are recorded live.

Backfill note for `by`: the column was added on 2026-10-07. On every row before
that date that sets `review` to `accepted`, `by` names the one human who held
accept authority in this instance (`nw-instance-single-individual-authority`).
Rows before that date that write any other value have no `by`, because the
proposing agent was not recorded.

| ref | field | from | to | timestamp | source | by |
|-----|-------|------|----|-----------|--------|----|
| artifact:artifact-repo | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| artifact:artifact-schema | review |  | proposed | 2026-06-21T12:50:45Z |  |  |
| artifact:artifact-spec | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| concept:concept-connective-tissue | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| concept:concept-externalized-state | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| concept:concept-goals-convergence | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| concept:concept-legible-over-defensible | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| concept:concept-need-not-mechanic | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| concept:concept-second-implementer-gap | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| node:goal-follow-thread | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| node:goal-portability | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| node:investigation-competition | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| node:investigation-naming | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| node:investigation-repo-structure | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| node:investigation-validation | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| node:task-license | review |  | proposed | 2026-06-21T12:50:45Z |  |  |
| node:task-second-implementer | review |  | proposed | 2026-06-21T12:50:45Z |  |  |
| node:task-serialization-format | review |  | proposed | 2026-06-21T12:50:45Z |  |  |
| noteworthy:nw-copying-is-the-win | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| noteworthy:nw-hypotheses-not-proof | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| noteworthy:nw-platforms-absorb-capabilities | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| noteworthy:nw-validation-is-vocabulary | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| waypoint:wp-curated-goal | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| waypoint:wp-frame-goals | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| waypoint:wp-naming | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| waypoint:wp-openness | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| waypoint:wp-repo-structure | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| waypoint:wp-validation | review |  | accepted | 2026-06-21T12:50:45Z |  | denisurusov |
| node:task-realign-instance | review |  | proposed | 2026-06-21T13:29:06Z |  |  |
| node:task-realign-instance | status |  | open | 2026-06-21T13:29:06Z |  |  |
| node:task-reconcile-schema | review |  | accepted | 2026-06-21T13:29:06Z |  | denisurusov |
| node:task-reconcile-schema | status |  | resolved | 2026-06-21T13:29:06Z |  |  |
| artifact:artifact-serialization | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-follow-valid | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-port-comp | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-port-license | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-port-naming | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-port-repo | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-port-second | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-repo-realign | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-repo-reconcile | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-repo-serial | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-mark-frame-follow | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-mark-frame-port | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-mark-naming | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-mark-open | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-mark-repo | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-mark-valid | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-men-comp-legible | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-men-follow-conv | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-men-follow-extstate | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-men-port-conn | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-men-port-conv | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-men-port-legible | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-men-second-gap | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-men-valid-gap | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-men-valid-need | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-not-comp-absorb | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-not-comp-copy | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-not-valid-hyp | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-not-valid-vocab | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-prod-reconcile-schema | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-prod-reconcile-spec | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-prod-repo-repo | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-prod-serial-serialization | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-rel-conv-conn | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-rel-conv-extstate | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-rel-legible-gap | review |  | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| node:goal-follow-thread | status |  | active | 2026-06-21T13:43:36Z |  |  |
| node:goal-portability | status |  | active | 2026-06-21T13:43:36Z |  |  |
| node:investigation-competition | status |  | resolved | 2026-06-21T13:43:36Z |  |  |
| node:investigation-naming | status |  | resolved | 2026-06-21T13:43:36Z |  |  |
| node:investigation-repo-structure | status |  | active | 2026-06-21T13:43:36Z |  |  |
| node:investigation-validation | status |  | active | 2026-06-21T13:43:36Z |  |  |
| node:task-license | status |  | open | 2026-06-21T13:43:36Z |  |  |
| node:task-second-implementer | status |  | open | 2026-06-21T13:43:36Z |  |  |
| node:task-serialization-format | status |  | resolved | 2026-06-21T13:43:36Z |  |  |
| artifact:artifact-schema | review | proposed | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| node:task-license | review | proposed | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| node:task-realign-instance | review | proposed | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| node:task-realign-instance | status | open | resolved | 2026-06-21T13:43:36Z |  |  |
| node:task-second-implementer | review | proposed | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| node:task-serialization-format | review | proposed | accepted | 2026-06-21T13:43:36Z |  | denisurusov |
| edge:e-dec-curated-valid | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| edge:e-dec-repo-outcomes | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| edge:e-mark-curated | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| edge:e-men-curated-conv | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| edge:e-not-curated-assump | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| edge:e-not-outcomes-assump | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| edge:e-not-valid-curated | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| node:goal-curated-context | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| node:goal-curated-context | status |  | active | 2026-06-21T14:05:42Z |  |  |
| node:task-outcomes-node-type | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| node:task-outcomes-node-type | status |  | open | 2026-06-21T14:05:42Z |  |  |
| noteworthy:nw-curated-context-accuracy | review |  | accepted | 2026-06-21T14:05:42Z |  | denisurusov |
| noteworthy:nw-curated-context-accuracy | status |  | unvalidated | 2026-06-21T14:05:42Z |  |  |
| edge:e-dec-curated-oploop | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| edge:e-dec-follow-oploop | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| edge:e-dec-oploop-ingestion | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| edge:e-dec-oploop-reconcile | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| edge:e-dec-oploop-review | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| edge:e-dec-oploop-trigger | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| edge:e-prod-ingestion-spec | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| node:investigation-operating-loop | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| node:investigation-operating-loop | status |  | active | 2026-06-21T14:44:47Z |  |  |
| node:task-ingestion-mode | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| node:task-ingestion-mode | status |  | active | 2026-06-21T14:44:47Z |  |  |
| node:task-reconciliation | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| node:task-reconciliation | status |  | active | 2026-06-21T14:44:47Z |  |  |
| node:task-review-ergonomics | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| node:task-review-ergonomics | status |  | open | 2026-06-21T14:44:47Z |  |  |
| node:task-trigger-transport | review |  | accepted | 2026-06-21T14:44:47Z |  | denisurusov |
| node:task-trigger-transport | status |  | open | 2026-06-21T14:44:47Z |  |  |
| artifact:artifact-reconciliation | review |  | accepted | 2026-06-22T02:57:46Z |  | denisurusov |
| edge:e-prod-reconciliation-doc | review |  | accepted | 2026-06-22T02:57:46Z |  | denisurusov |
| node:task-reconciliation | status | active | resolved | 2026-06-22T02:57:46Z |  |  |
| artifact:artifact-transport | review |  | accepted | 2026-06-22T13:36:50Z |  | denisurusov |
| edge:e-prod-trigger-transport | review |  | accepted | 2026-06-22T13:36:50Z |  | denisurusov |
| node:task-trigger-transport | status | open | resolved | 2026-06-22T13:36:50Z |  |  |
| edge:e-mark-spec-split | review |  | accepted | 2026-06-22T13:42:21Z |  | denisurusov |
| edge:e-not-oploop-seam | review |  | accepted | 2026-06-22T13:42:21Z |  | denisurusov |
| edge:e-not-repo-seam | review |  | accepted | 2026-06-22T13:42:21Z |  | denisurusov |
| noteworthy:nw-spec-seam | review |  | accepted | 2026-06-22T13:42:21Z |  | denisurusov |
| waypoint:wp-spec-split | review |  | accepted | 2026-06-22T13:42:21Z |  | denisurusov |
| artifact:artifact-review | review |  | accepted | 2026-06-22T15:03:18Z |  | denisurusov |
| edge:e-prod-review-ergonomics | review |  | accepted | 2026-06-22T15:03:18Z |  | denisurusov |
| node:task-review-ergonomics | status | open | resolved | 2026-06-22T15:03:18Z |  |  |
| concept:concept-propose-accept-separation | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| concept:concept-transport-contract | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-men-ingestion-sep | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-men-port-contract | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-men-reconcile-sep | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-men-review-sep | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-men-trigger-contract | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-not-review-noblock | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-not-review-triage | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-not-trigger-probe | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-rel-contract-legible | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| noteworthy:nw-confidence-triages-not-accepts | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| noteworthy:nw-manual-reupload-probe | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| noteworthy:nw-review-doesnt-block-persist | review |  | accepted | 2026-06-22T15:32:52Z |  | denisurusov |
| edge:e-not-ingestion-convid | review |  | accepted | 2026-06-22T17:03:50Z |  | denisurusov |
| noteworthy:nw-conversationid-host-injected | review |  | accepted | 2026-06-22T17:03:50Z |  | denisurusov |
| concept:concept-content-addressed-provenance | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-dec-oploop-provenance | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-mark-provenance | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-men-provenance-caprov | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-not-provenance-decision | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-not-provenance-pushbased | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-not-provenance-timestamp | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-prod-provenance-reconciliation | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-prod-provenance-schema | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-prod-provenance-spec | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-rel-caprov-contract | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| node:task-provenance-model | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| node:task-provenance-model | status |  | resolved | 2026-06-22T21:10:56Z |  |  |
| noteworthy:nw-provenance-content-addressed | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| noteworthy:nw-push-based-idempotence | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| noteworthy:nw-timestamp-source-time | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| noteworthy:nw-timestamp-source-time | status |  | active | 2026-06-22T21:10:56Z |  |  |
| waypoint:wp-provenance-model | review |  | accepted | 2026-06-22T21:10:56Z |  | denisurusov |
| edge:e-mark-triggers | review |  | accepted | 2026-06-23T02:27:36Z |  | denisurusov |
| edge:e-not-oploop-triggers | review |  | accepted | 2026-06-23T02:27:36Z |  | denisurusov |
| edge:e-not-trigger-triggers | review |  | accepted | 2026-06-23T02:27:36Z |  | denisurusov |
| noteworthy:nw-triggers-event-not-cadence | review |  | accepted | 2026-06-23T02:27:36Z |  | denisurusov |
| waypoint:wp-triggers | review |  | accepted | 2026-06-23T02:27:36Z |  | denisurusov |
| edge:e-mark-delref-oploop | review |  | accepted | 2026-06-23T02:48:46Z |  | denisurusov |
| edge:e-mark-delref-repo | review |  | accepted | 2026-06-23T02:48:46Z |  | denisurusov |
| waypoint:wp-delete-reference | review |  | accepted | 2026-06-23T02:48:46Z |  | denisurusov |
| artifact:artifact-atom-readiness-skill | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| artifact:artifact-setup | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| edge:e-dec-port-adoption | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| edge:e-mark-setupkit | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| edge:e-not-review-forced | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| edge:e-prod-adoption-setup | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| edge:e-prod-review-skill | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| node:task-adoption-path | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| node:task-adoption-path | status |  | active | 2026-06-23T21:57:24Z |  |  |
| noteworthy:nw-venturing-must-be-forced | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| waypoint:wp-setup-kit | review |  | accepted | 2026-06-23T21:57:24Z |  | denisurusov |
| artifact:artifact-distribution | review |  | accepted | 2026-06-23T22:35:01Z |  | denisurusov |
| edge:e-not-repo-derive | review |  | accepted | 2026-06-23T22:35:01Z |  | denisurusov |
| edge:e-prod-adoption-distribution | review |  | accepted | 2026-06-23T22:35:01Z |  | denisurusov |
| noteworthy:nw-derive-not-copy | review |  | accepted | 2026-06-23T22:35:01Z |  | denisurusov |
| node:task-central-service-binding | review |  | proposed | 2026-06-24T01:44:16Z |  |  |
| node:task-central-service-binding | status |  | open | 2026-06-24T01:44:16Z |  |  |
| noteworthy:nw-mcp-binding-needs-neutral-read | review |  | proposed | 2026-06-24T01:44:16Z |  |  |
| edge:e-dec-oploop-central | review |  | accepted | 2026-06-24T01:46:49Z |  | denisurusov |
| edge:e-men-central-contract | review |  | accepted | 2026-06-24T01:46:49Z |  | denisurusov |
| edge:e-not-central-neutral | review |  | accepted | 2026-06-24T01:46:49Z |  | denisurusov |
| node:task-central-service-binding | review | proposed | accepted | 2026-06-24T01:46:49Z |  | denisurusov |
| noteworthy:nw-mcp-binding-needs-neutral-read | review | proposed | accepted | 2026-06-24T01:46:49Z |  | denisurusov |
| edge:e-not-review-skillpickup | review |  | accepted | 2026-06-24T02:42:26Z |  | denisurusov |
| edge:e-not-trigger-skillpickup | review |  | accepted | 2026-06-24T02:42:26Z |  | denisurusov |
| noteworthy:nw-skill-pickup-transport-bound | review |  | accepted | 2026-06-24T02:42:26Z |  | denisurusov |
| noteworthy:nw-skill-pickup-transport-bound | status |  | active | 2026-06-24T02:42:26Z |  |  |
| artifact:artifact-webmobile-seed | review |  | accepted | 2026-06-24T11:29:40Z |  | denisurusov |
| noteworthy:nw-webmobile-seed-is-pointer-not-payload | review |  | accepted | 2026-06-24T11:29:40Z |  | denisurusov |
| edge:e-not-adoption-webmobile-seed | review |  | accepted | 2026-06-24T11:30:36Z |  | denisurusov |
| edge:e-prod-adoption-webmobile-seed | review |  | accepted | 2026-06-24T11:30:36Z |  | denisurusov |
| artifact:artifact-whitepaper | review |  | accepted | 2026-06-24T16:40:00Z |  | denisurusov |
| edge:e-not-adoption-whitepaper | review |  | accepted | 2026-06-24T16:40:00Z |  | denisurusov |
| edge:e-prod-adoption-whitepaper | review |  | accepted | 2026-06-24T16:40:00Z |  | denisurusov |
| noteworthy:nw-whitepaper-non-normative | review |  | accepted | 2026-06-24T16:40:00Z |  | denisurusov |
| concept:concept-konspekt-vs-memory-layer | review |  | accepted | 2026-06-27T13:19:02Z |  | denisurusov |
| edge:e-men-comp-memorylayer | review |  | accepted | 2026-06-27T13:19:02Z |  | denisurusov |
| edge:e-rel-memorylayer-legible | review |  | accepted | 2026-06-27T13:19:02Z |  | denisurusov |
| edge:e-rel-memorylayer-sep | review |  | accepted | 2026-06-27T13:19:02Z |  | denisurusov |
| concept:concept-two-pillars | review |  | accepted | 2026-06-27T13:44:23Z |  | denisurusov |
| edge:e-men-repo-twopillars | review |  | accepted | 2026-06-27T13:44:23Z |  | denisurusov |
| edge:e-rel-twopillars-legible | review |  | accepted | 2026-06-27T13:44:23Z |  | denisurusov |
| edge:e-rel-twopillars-sep | review |  | accepted | 2026-06-27T13:44:23Z |  | denisurusov |
| edge:e-not-reconcile-schemapractice | review |  | accepted | 2026-07-19T17:42:15Z |  | denisurusov |
| edge:e-not-second-schemapractice | review |  | accepted | 2026-07-19T17:42:15Z |  | denisurusov |
| edge:e-not-trigger-notifyconfig | review |  | accepted | 2026-07-19T17:42:15Z |  | denisurusov |
| edge:e-not-trigger-notifyevents | review |  | accepted | 2026-07-19T17:42:15Z |  | denisurusov |
| edge:e-not-trigger-notifypayload | review |  | accepted | 2026-07-19T17:42:15Z |  | denisurusov |
| noteworthy:nw-notification-payload-is-reference-only | review |  | accepted | 2026-07-19T17:42:15Z |  | denisurusov |
| noteworthy:nw-notification-payload-is-reference-only | status |  | active | 2026-07-19T17:42:15Z |  |  |
| noteworthy:nw-notify-events-are-creation-and-supersedes | review |  | accepted | 2026-07-19T17:42:15Z |  | denisurusov |
| noteworthy:nw-schema-behind-practice | review |  | accepted | 2026-07-19T17:42:15Z |  | denisurusov |
| noteworthy:nw-subscriptions-are-config-not-graph | review |  | accepted | 2026-07-19T17:42:15Z |  | denisurusov |
| noteworthy:nw-subscriptions-are-config-not-graph | status |  | active | 2026-07-19T17:42:15Z |  |  |
| edge:e-dec-repo-layout | review |  | accepted | 2026-07-19T17:51:13Z |  | denisurusov |
| edge:e-not-provenance-birthstate | review |  | accepted | 2026-07-19T17:51:13Z |  | denisurusov |
| edge:e-not-trigger-birthstate | review |  | accepted | 2026-07-19T17:51:13Z |  | denisurusov |
| edge:e-sup-birthstate-notifyevents | review |  | accepted | 2026-07-19T17:51:13Z |  | denisurusov |
| node:task-instance-layout-regularity | review |  | accepted | 2026-07-19T17:51:13Z |  | denisurusov |
| node:task-instance-layout-regularity | status |  | open | 2026-07-19T17:51:13Z |  |  |
| noteworthy:nw-state-written-at-birth-not-transitioned | review |  | accepted | 2026-07-19T17:51:13Z |  | denisurusov |
| noteworthy:nw-filename-id-rule-conflict | review |  | accepted | 2026-07-19T18:03:48Z |  | denisurusov |
| noteworthy:nw-konspekt-conforms-code-tracer-drifts | review |  | accepted | 2026-07-19T18:03:48Z |  | denisurusov |
| edge:e-not-realign-filenameid | review |  | accepted | 2026-07-19T18:04:43Z |  | denisurusov |
| edge:e-not-reconcile-census | review |  | accepted | 2026-07-19T18:04:43Z |  | denisurusov |
| edge:e-not-second-census | review |  | accepted | 2026-07-19T18:04:43Z |  | denisurusov |
| edge:e-not-serial-filenameid | review |  | accepted | 2026-07-19T18:04:43Z |  | denisurusov |
| edge:e-sup-census-schemapractice | review |  | accepted | 2026-07-19T18:04:43Z |  | denisurusov |
| noteworthy:nw-filename-id-resolved-by-rename | review |  | accepted | 2026-07-19T19:39:39Z |  | denisurusov |
| noteworthy:nw-rename-fires-as-creation | review |  | accepted | 2026-07-19T19:39:39Z |  | denisurusov |
| edge:e-not-realign-renamed | review |  | accepted | 2026-07-19T19:40:30Z |  | denisurusov |
| edge:e-not-serial-renamed | review |  | accepted | 2026-07-19T19:40:30Z |  | denisurusov |
| edge:e-not-trigger-renamecreation | review |  | accepted | 2026-07-19T19:40:30Z |  | denisurusov |
| edge:e-sup-renamed-filenameid | review |  | accepted | 2026-07-19T19:40:30Z |  | denisurusov |
| noteworthy:nw-notify-config-precedes-consumer | review |  | proposed | 2026-07-19T20:38:44Z |  |  |
| edge:e-not-trigger-notifyorder | review |  | proposed | 2026-07-19T20:46:04Z |  |  |
| noteworthy:nw-review-is-the-only-field-that-transitions | review |  | proposed | 2026-07-19T21:28:58Z |  |  |
| edge:e-not-trigger-reviewtransitions | review |  | proposed | 2026-07-19T21:29:58Z |  |  |
| noteworthy:nw-notify-config-precedes-consumer | review | proposed | accepted | 2026-07-19T21:46:01Z |  | denisurusov |
| noteworthy:nw-review-is-the-only-field-that-transitions | review | proposed | accepted | 2026-07-19T21:46:01Z |  | denisurusov |
| edge:e-not-trigger-notifyorder | review | proposed | accepted | 2026-07-19T21:47:52Z |  | denisurusov |
| edge:e-not-trigger-reviewtransitions | review | proposed | accepted | 2026-07-19T21:47:52Z |  | denisurusov |
| noteworthy:nw-delivery-channel-should-need-no-credential | review |  | proposed | 2026-07-19T22:54:19Z |  |  |
| edge:e-not-trigger-nocredential | review |  | proposed | 2026-07-19T22:55:14Z |  |  |
| noteworthy:nw-delivery-channel-should-need-no-credential | review | proposed | accepted | 2026-07-19T22:56:14Z |  | denisurusov |
| concept:concept-instance-upgradeability | review |  | accepted | 2026-07-20T00:47:47Z |  | denisurusov |
| node:task-portable-notifications | review |  | accepted | 2026-07-20T00:48:23Z |  | denisurusov |
| node:task-portable-notifications | status |  | open | 2026-07-20T00:48:23Z |  |  |
| edge:e-dec-oploop-notifications | review |  | accepted | 2026-07-20T00:49:33Z |  | denisurusov |
| edge:e-dec-port-notifications | review |  | accepted | 2026-07-20T00:49:33Z |  | denisurusov |
| edge:e-men-adoption-upgrade | review |  | accepted | 2026-07-20T00:49:33Z |  | denisurusov |
| edge:e-men-notifications-upgrade | review |  | accepted | 2026-07-20T00:49:33Z |  | denisurusov |
| edge:e-not-notifications-nocredential | review |  | accepted | 2026-07-20T00:49:33Z |  | denisurusov |
| edge:e-not-trigger-nocredential | review | proposed | accepted | 2026-07-20T00:49:33Z |  | denisurusov |
| edge:e-dec-adoption-notifications | review |  | accepted | 2026-07-20T12:52:08Z |  | denisurusov |
| edge:e-not-adoption-componentsnotstandard | review |  | proposed | 2026-07-20T12:52:08Z |  |  |
| edge:e-not-notifications-componentsnotstandard | review |  | proposed | 2026-07-20T12:52:08Z |  |  |
| noteworthy:nw-components-are-not-the-standard | review |  | proposed | 2026-07-20T12:52:08Z |  |  |
| noteworthy:nw-components-are-not-the-standard | status |  | active | 2026-07-20T12:52:08Z |  |  |
| artifact:artifact-schema-reconciliation | review |  | proposed | 2026-07-20T13:32:51Z |  |  |
| edge:e-not-notifications-statustransitions | review |  | proposed | 2026-07-20T13:32:51Z |  |  |
| edge:e-not-reconcile-statustransitions | review |  | proposed | 2026-07-20T13:32:51Z |  |  |
| edge:e-not-trigger-statustransitions | review |  | proposed | 2026-07-20T13:32:51Z |  |  |
| edge:e-prod-layout-schemarecon | review |  | proposed | 2026-07-20T13:32:51Z |  |  |
| edge:e-sup-statustransitions-birthstate | review |  | proposed | 2026-07-20T13:32:51Z |  |  |
| noteworthy:nw-node-status-does-transition | review |  | proposed | 2026-07-20T13:32:51Z |  |  |
| noteworthy:nw-payload-reference-only-admits-enums | review |  | proposed | 2026-07-20T13:41:44Z |  |  |
| edge:e-not-notifications-payloadenums | review |  | proposed | 2026-07-20T13:42:53Z |  |  |
| edge:e-not-trigger-payloadenums | review |  | proposed | 2026-07-20T13:42:53Z |  |  |
| edge:e-sup-payloadenums-payloadref | review |  | proposed | 2026-07-20T13:42:53Z |  |  |
| artifact:artifact-components | review |  | proposed | 2026-07-20T17:27:48Z |  |  |
| artifact:artifact-conformance-checker | review |  | proposed | 2026-07-20T17:27:48Z |  |  |
| waypoint:wp-conformance-checker | review |  | proposed | 2026-07-20T17:27:48Z |  |  |
| edge:e-mark-conformance-adoption | review |  | proposed | 2026-07-20T17:28:57Z |  |  |
| edge:e-mark-conformance-layout | review |  | proposed | 2026-07-20T17:28:57Z |  |  |
| edge:e-prod-adoption-components | review |  | proposed | 2026-07-20T17:28:57Z |  |  |
| edge:e-prod-adoption-conformance | review |  | proposed | 2026-07-20T17:28:57Z |  |  |
| edge:e-prod-layout-conformance | review |  | proposed | 2026-07-20T17:28:57Z |  |  |
| edge:e-prod-notifications-components | review |  | proposed | 2026-07-20T17:28:57Z |  |  |
| concept:concept-asr-persona-layering | review |  | accepted | 2026-08-01T22:06:00Z |  | denisurusov |
| edge:e-drv-asrlayering-adrengineer | review |  | accepted | 2026-08-01T22:06:00Z |  | denisurusov |
| waypoint:wp-adr-engineer-layer | review |  | accepted | 2026-08-01T22:06:00Z |  | denisurusov |
| edge:e-dec-collab-fleet | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-dec-collab-multiauthor | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-dec-obs-analytics | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-dec-obs-monitoring | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-dec-port-enterprise | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-men-enterprise-caprov | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-men-enterprise-contract | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-men-fleet-sep | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-men-multiauthor-sep | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-not-enterprise-neutral | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| edge:e-not-enterprise-reupload | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| node:goal-collaboration | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| node:goal-collaboration | status |  | active | 2026-09-10T21:37:07Z |  |  |
| node:goal-observability | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| node:goal-observability | status |  | active | 2026-09-10T21:37:07Z |  |  |
| node:task-agent-fleet | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| node:task-agent-fleet | status |  | open | 2026-09-10T21:37:07Z |  |  |
| node:task-enterprise-persistence | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| node:task-enterprise-persistence | status |  | open | 2026-09-10T21:37:07Z |  |  |
| node:task-graph-analytics | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| node:task-graph-analytics | status |  | open | 2026-09-10T21:37:07Z |  |  |
| node:task-multi-author-review | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| node:task-multi-author-review | status |  | open | 2026-09-10T21:37:07Z |  |  |
| node:task-realtime-monitoring | review |  | proposed | 2026-09-10T21:37:07Z |  |  |
| node:task-realtime-monitoring | status |  | open | 2026-09-10T21:37:07Z |  |  |
| edge:e-dec-account-gate | review |  | proposed | 2026-09-10T21:37:25Z |  |  |
| edge:e-dec-account-report | review |  | proposed | 2026-09-10T21:37:25Z |  |  |
| edge:e-dec-account-signed | review |  | proposed | 2026-09-10T21:37:25Z |  |  |
| edge:e-men-report-caprov | review |  | proposed | 2026-09-10T21:37:25Z |  |  |
| edge:e-men-signed-sep | review |  | proposed | 2026-09-10T21:37:25Z |  |  |
| node:goal-accountability | review |  | proposed | 2026-09-10T21:37:25Z |  |  |
| node:goal-accountability | status |  | active | 2026-09-10T21:37:25Z |  |  |
| node:task-accountability-report | review |  | proposed | 2026-09-10T21:37:25Z |  |  |
| node:task-accountability-report | status |  | open | 2026-09-10T21:37:25Z |  |  |
| node:task-persona-change-gate | review |  | proposed | 2026-09-10T21:37:25Z |  |  |
| node:task-persona-change-gate | status |  | open | 2026-09-10T21:37:25Z |  |  |
| node:task-signed-accepts | review |  | proposed | 2026-09-10T21:37:25Z |  |  |
| node:task-signed-accepts | status |  | open | 2026-09-10T21:37:25Z |  |  |
| edge:e-not-provenance-checkerbytes | review |  | accepted | 2026-09-10T21:37:42Z |  | denisurusov |
| noteworthy:nw-checker-hashes-raw-disk-bytes | review |  | accepted | 2026-09-10T21:37:42Z |  | denisurusov |
| node:task-persona-change-gate | review | proposed | accepted | 2026-09-10T21:44:34Z |  | denisurusov |
| edge:e-dec-obs-roadmap-gen | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| edge:e-dec-obs-roadmap-poster | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| edge:e-dec-obs-roadmap-wf | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| edge:e-not-collab-issueintake | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| edge:e-not-poster-derive | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| edge:e-not-roadmap-gate-authority | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| edge:e-not-roadmap-wf-authority | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| node:task-roadmap-generation-workflow | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| node:task-roadmap-generation-workflow | status |  | open | 2026-09-10T23:07:16Z |  |  |
| node:task-roadmap-generator | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| node:task-roadmap-generator | status |  | open | 2026-09-10T23:07:16Z |  |  |
| node:task-roadmap-poster-generated | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| node:task-roadmap-poster-generated | status |  | open | 2026-09-10T23:07:16Z |  |  |
| noteworthy:nw-inbound-issue-needs-consensus-intake | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| noteworthy:nw-roadmap-generation-coupled-to-authority | review |  | proposed | 2026-09-10T23:07:16Z |  |  |
| edge:e-not-poster-derive | review | proposed | accepted | 2026-09-10T23:10:34Z |  | denisurusov |
| edge:e-not-roadmap-gate-authority | review | proposed | accepted | 2026-09-10T23:10:34Z |  | denisurusov |
| edge:e-not-roadmap-wf-authority | review | proposed | accepted | 2026-09-10T23:10:34Z |  | denisurusov |
| node:task-roadmap-generation-workflow | review | proposed | accepted | 2026-09-10T23:10:34Z |  | denisurusov |
| node:task-roadmap-generator | review | proposed | accepted | 2026-09-10T23:10:34Z |  | denisurusov |
| node:task-roadmap-poster-generated | review | proposed | accepted | 2026-09-10T23:10:34Z |  | denisurusov |
| noteworthy:nw-inbound-issue-needs-consensus-intake | review | proposed | accepted | 2026-09-10T23:10:34Z |  | denisurusov |
| noteworthy:nw-roadmap-generation-coupled-to-authority | review | proposed | accepted | 2026-09-10T23:10:34Z |  | denisurusov |
| node:task-roadmap-generator | status | open | resolved | 2026-09-10T23:16:04Z |  |  |
| node:goal-portability | review | accepted | proposed | 2026-09-11T02:07:43Z |  |  |
| edge:e-dec-account-authority | review |  | proposed | 2026-09-11T15:43:25Z |  |  |
| edge:e-not-authority-roadmapauth | review |  | proposed | 2026-09-11T15:43:25Z |  |  |
| edge:e-not-authority-single | review |  | proposed | 2026-09-11T15:43:25Z |  |  |
| node:task-authority-mechanism | review |  | accepted | 2026-09-11T15:43:25Z |  | denisurusov |
| node:task-authority-mechanism | status |  | open | 2026-09-11T15:43:25Z |  |  |
| noteworthy:nw-instance-single-individual-authority | review |  | accepted | 2026-09-11T15:43:25Z |  | denisurusov |
| artifact:artifact-roadmap-poster-generator | review |  | proposed | 2026-09-11T17:28:05Z |  |  |
| artifact:artifact-state-poster-generator | review |  | proposed | 2026-09-11T17:28:05Z |  |  |
| edge:e-prod-poster-roadmapgen | review |  | proposed | 2026-09-11T17:28:05Z |  |  |
| edge:e-prod-poster-stategen | review |  | proposed | 2026-09-11T17:28:05Z |  |  |
| node:goal-observability | review | proposed | accepted | 2026-09-11T17:28:05Z |  | denisurusov |
| node:goal-portability | review | proposed | accepted | 2026-09-11T17:28:05Z |  | denisurusov |
| node:task-roadmap-poster-generated | status | open | resolved | 2026-09-11T17:28:05Z |  |  |
| edge:e-not-adoption-carrier | review |  | proposed | 2026-09-11T19:13:03Z |  |  |
| edge:e-not-central-carrier | review |  | proposed | 2026-09-11T19:13:03Z |  |  |
| edge:e-not-ingestion-carrier | review |  | proposed | 2026-09-11T19:13:03Z |  |  |
| edge:e-not-portability-carrier | review |  | proposed | 2026-09-11T19:13:03Z |  |  |
| noteworthy:nw-convention-carrier | review |  | proposed | 2026-09-11T19:13:03Z |  |  |
| artifact:artifact-visual-explorer | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| edge:e-dec-usability-filters | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| edge:e-dec-usability-nav | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| edge:e-dec-usability-workthrough | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| edge:e-prod-filters-explorer | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| edge:e-prod-nav-explorer | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| node:goal-usability | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| node:goal-usability | status |  | active | 2026-09-12T02:44:39Z |  |  |
| node:task-goal-task-navigation | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| node:task-goal-task-navigation | status |  | open | 2026-09-12T02:44:39Z |  |  |
| node:task-task-workthrough-ui | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| node:task-task-workthrough-ui | status |  | open | 2026-09-12T02:44:39Z |  |  |
| node:task-visual-status-filters | review |  | accepted | 2026-09-12T02:44:39Z |  | denisurusov |
| node:task-visual-status-filters | status |  | open | 2026-09-12T02:44:39Z |  |  |
| edge:e-link-analytics-validation | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-authority-gate | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-authority-signed | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-enterprise-central | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-enterprise-provenance | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-fleet-review | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-monitoring-enterprise | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-monitoring-notifications | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-multiauthor-fleet | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-multiauthor-review | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-report-fleet | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-report-observ | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-link-signed-multiauthor | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| edge:e-mark-links-serial | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| waypoint:wp-links-edge-kind | review |  | proposed | 2026-09-12T13:43:30Z |  |  |
| node:task-license | status | open | resolved | 2026-09-13T03:51:14Z |  |  |
| concept:concept-companion-surface | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| node:task-atom-versioning-cas | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| node:task-atom-versioning-cas | status |  | open | 2026-09-14T14:45:04Z |  |  |
| node:task-konspekt-ui-app | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| node:task-konspekt-ui-app | status |  | open | 2026-09-14T14:45:04Z |  |  |
| node:task-mcp-app-surface | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| node:task-mcp-app-surface | status |  | open | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-backend-is-mcp-client-on-web | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-claude-mobile-not-a-target | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-cursor-is-opaque-store-token | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-db-backend-needs-append-only-record | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-edge-table-contends-under-cas | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-mongo-enterprise-postgres-oss | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-multifile-push-clobbers-silently | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-one-view-two-transports | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-server-cannot-wake-a-session | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| noteworthy:nw-versioning-not-write-scope | review |  | proposed | 2026-09-14T14:45:04Z |  |  |
| edge:e-dec-collab-cas | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-dec-usability-mcpapp | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-dec-usability-uiapp | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-link-cas-enterprise | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-link-cas-multiauthor | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-link-cas-reconciliation | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-link-mcpapp-central | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-link-uiapp-filters | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-link-uiapp-mcpapp | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-link-uiapp-nav | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-link-uiapp-workthrough | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-men-cas-sep | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-men-mcpapp-companion | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-men-mcpapp-contract | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-men-uiapp-companion | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-men-uiapp-sep | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-cas-cursor | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-cas-edgecontention | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-cas-multifilepush | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-cas-versioning | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-enterprise-appendonly | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-enterprise-backends | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-mcpapp-backendclient | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-mcpapp-nowake | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-mcpapp-oneview | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-provenance-appendonly | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-trigger-nowake | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-uiapp-mobile | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-uiapp-oneview | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-rel-companion-memorylayer | review |  | proposed | 2026-09-14T14:48:07Z |  |  |
| edge:e-not-mcpapp-cardv1 | review |  | proposed | 2026-09-14T21:28:31Z |  |  |
| noteworthy:nw-card-v1-is-last-ten-changed | review |  | proposed | 2026-09-14T21:28:31Z |  |  |
| edge:e-dec-usability-atomvocab | review |  | proposed | 2026-09-14T22:39:58Z |  |  |
| edge:e-link-atomvocab-reconcile | review |  | proposed | 2026-09-14T22:39:58Z |  |  |
| edge:e-link-atomvocab-serial | review |  | proposed | 2026-09-14T22:39:58Z |  |  |
| node:task-atom-vocabulary | review |  | proposed | 2026-09-14T22:39:58Z |  |  |
| node:task-atom-vocabulary | status |  | open | 2026-09-14T22:39:58Z |  |  |
| noteworthy:nw-poll-is-the-floor-push-is-optional | review |  | proposed | 2026-09-15T01:05:31Z |  |  |
| edge:e-not-cas-pollfloor | review |  | proposed | 2026-09-15T01:07:16Z |  |  |
| edge:e-not-enterprise-pollfloor | review |  | proposed | 2026-09-15T01:07:16Z |  |  |
| edge:e-not-trigger-pollfloor | review |  | proposed | 2026-09-15T01:07:16Z |  |  |
| edge:e-not-uiapp-pollfloor | review |  | proposed | 2026-09-15T01:07:16Z |  |  |
| artifact:artifact-ui-design | review |  | proposed | 2026-09-15T01:13:58Z |  |  |
| edge:e-prod-cas-uidesign | review |  | proposed | 2026-09-15T01:15:43Z |  |  |
| edge:e-prod-enterprise-uidesign | review |  | proposed | 2026-09-15T01:15:43Z |  |  |
| edge:e-prod-mcpapp-uidesign | review |  | proposed | 2026-09-15T01:15:43Z |  |  |
| edge:e-prod-uiapp-uidesign | review |  | proposed | 2026-09-15T01:15:43Z |  |  |
| artifact:artifact-implementation-zero-design | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| edge:e-dec-uiapp-implzero | review |  | proposed | 2026-09-19T13:36:12Z |  |  |
| edge:e-dec-uiapp-intellij | review |  | proposed | 2026-09-19T13:36:12Z |  |  |
| edge:e-link-implzero-intellij | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| edge:e-link-intellij-mcpapp | review |  | proposed | 2026-09-19T13:36:12Z |  |  |
| edge:e-not-implzero-electron | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| edge:e-not-implzero-impldir | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| edge:e-not-implzero-layering | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| edge:e-not-implzero-oneview | review |  | proposed | 2026-09-19T13:36:12Z |  |  |
| edge:e-not-implzero-pollfloor | review |  | proposed | 2026-09-19T13:36:12Z |  |  |
| edge:e-not-intellij-layering | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| edge:e-not-intellij-oneview | review |  | proposed | 2026-09-19T13:36:12Z |  |  |
| edge:e-not-repostructure-impldir | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| edge:e-not-uiapp-layering | review |  | proposed | 2026-09-19T13:36:12Z |  |  |
| edge:e-prod-implzero-design | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| node:task-implementation-zero | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| node:task-implementation-zero | status |  | open | 2026-09-19T13:36:12Z |  |  |
| node:task-intellij-plugin | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| node:task-intellij-plugin | status |  | open | 2026-09-19T13:36:12Z |  |  |
| noteworthy:nw-electron-shell | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| noteworthy:nw-implementation-layering | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| noteworthy:nw-implementations-directory | review |  | accepted | 2026-09-19T13:36:12Z |  | denisurusov |
| artifact:artifact-implementation-zero-app | review |  | accepted | 2026-09-19T14:48:00Z |  | denisurusov |
| edge:e-prod-analytics-app | review |  | proposed | 2026-09-19T14:48:00Z |  |  |
| edge:e-prod-implzero-app | review |  | accepted | 2026-09-19T14:48:00Z |  | denisurusov |
| edge:e-prod-nav-app | review |  | accepted | 2026-09-19T14:48:00Z |  | denisurusov |
| node:task-implementation-zero | status | open | active | 2026-09-19T14:48:00Z |  |  |
| concept:concept-view-no-fork | review |  | accepted | 2026-09-20T14:19:26Z |  | denisurusov |
| edge:e-drv-viewnofork-plugininprocess | review |  | accepted | 2026-09-20T14:19:26Z |  | denisurusov |
| edge:e-link-intellij-second | review |  | proposed | 2026-09-20T14:19:26Z |  |  |
| edge:e-mark-adrplugininprocess-intellij | review |  | accepted | 2026-09-20T14:19:26Z |  | denisurusov |
| edge:e-not-oploop-personabrief | review |  | proposed | 2026-09-20T14:19:26Z |  |  |
| noteworthy:nw-persona-brief-not-surfaced | review |  | proposed | 2026-09-20T14:19:26Z |  |  |
| waypoint:wp-adr-plugin-inprocess | review |  | accepted | 2026-09-20T14:19:26Z |  | denisurusov |
| concept:concept-record-all-executed | review |  | accepted | 2026-09-20T15:13:54Z |  | denisurusov |
| edge:e-dec-account-exectask | review |  | proposed | 2026-09-20T15:13:54Z |  |  |
| edge:e-drv-recordexec-adrlog | review |  | accepted | 2026-09-20T15:13:54Z |  | denisurusov |
| edge:e-mark-adrlog-exectask | review |  | accepted | 2026-09-20T15:13:54Z |  | denisurusov |
| node:task-executed-provenance-serialization | review |  | accepted | 2026-09-20T15:13:54Z |  | denisurusov |
| node:task-executed-provenance-serialization | status |  | resolved | 2026-09-20T15:13:54Z |  |  |
| waypoint:wp-adr-executed-log | review |  | accepted | 2026-09-20T15:13:54Z |  | denisurusov |
| concept:concept-surface-follows-data | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| edge:e-dec-intellij-popmode | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| edge:e-dec-usability-asradrui | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| edge:e-dec-usability-relcommands | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| edge:e-link-relcommands-execlog | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| edge:e-men-asradrui-nofork | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| edge:e-men-asradrui-surfacedata | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| edge:e-men-popmode-nofork | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| edge:e-men-relcommands-nofork | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| edge:e-men-relcommands-surfacedata | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| node:task-asr-adr-ui | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| node:task-asr-adr-ui | status |  | open | 2026-09-20T16:28:18Z |  |  |
| node:task-plugin-pop-mode | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| node:task-plugin-pop-mode | status |  | open | 2026-09-20T16:28:18Z |  |  |
| node:task-related-commands-view | review |  | proposed | 2026-09-20T16:28:18Z |  |  |
| node:task-related-commands-view | status |  | open | 2026-09-20T16:28:18Z |  |  |
| edge:e-dec-account-codechanges | review |  | proposed | 2026-09-20T17:31:21Z |  |  |
| edge:e-link-codechanges-execlog | review |  | proposed | 2026-09-20T17:31:21Z |  |  |
| edge:e-link-codechanges-popmode | review |  | proposed | 2026-09-20T17:31:21Z |  |  |
| edge:e-men-codechanges-caprov | review |  | proposed | 2026-09-20T17:31:21Z |  |  |
| node:task-record-code-changes | review |  | proposed | 2026-09-20T17:31:21Z |  |  |
| node:task-record-code-changes | status |  | open | 2026-09-20T17:31:21Z |  |  |
| concept:concept-surface-follows-data | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| edge:e-dec-intellij-popmode | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| edge:e-dec-usability-asradrui | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| edge:e-dec-usability-relcommands | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| edge:e-link-relcommands-execlog | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| edge:e-men-asradrui-nofork | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| edge:e-men-asradrui-surfacedata | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| edge:e-men-popmode-nofork | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| edge:e-men-relcommands-nofork | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| edge:e-men-relcommands-surfacedata | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| node:task-asr-adr-ui | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| node:task-asr-adr-ui | status | open | resolved | 2026-09-20T18:25:49Z |  |  |
| node:task-plugin-pop-mode | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| node:task-plugin-pop-mode | status | open | resolved | 2026-09-20T18:25:49Z |  |  |
| node:task-related-commands-view | review | proposed | accepted | 2026-09-20T18:25:49Z |  | denisurusov |
| node:task-related-commands-view | status | open | resolved | 2026-09-20T18:25:49Z |  |  |
| edge:e-drv-recordexec-adrchanged | review |  | proposed | 2026-09-20T18:53:57Z |  |  |
| edge:e-mark-adrchanged-changetask | review |  | proposed | 2026-09-20T18:53:57Z |  |  |
| edge:e-notes-changetask-opaquerev | review |  | proposed | 2026-09-20T18:53:57Z |  |  |
| noteworthy:nw-commit-is-opaque-revision | review |  | proposed | 2026-09-20T18:53:57Z |  |  |
| waypoint:wp-adr-changed-log | review |  | proposed | 2026-09-20T18:53:57Z |  |  |
| node:task-record-code-changes | status | open | active | 2026-09-20T18:53:57Z |  |  |
| edge:e-drv-recordexec-adrchanged | review | proposed | accepted | 2026-09-20T18:59:52Z |  | denisurusov |
| edge:e-link-codechanges-execlog | review | proposed | accepted | 2026-09-20T18:59:52Z |  | denisurusov |
| edge:e-link-codechanges-popmode | review | proposed | accepted | 2026-09-20T18:59:52Z |  | denisurusov |
| edge:e-mark-adrchanged-changetask | review | proposed | accepted | 2026-09-20T18:59:52Z |  | denisurusov |
| edge:e-men-codechanges-caprov | review | proposed | accepted | 2026-09-20T18:59:52Z |  | denisurusov |
| edge:e-notes-changetask-opaquerev | review | proposed | accepted | 2026-09-20T18:59:52Z |  | denisurusov |
| node:task-record-code-changes | review | proposed | accepted | 2026-09-20T18:59:52Z |  | denisurusov |
| node:task-record-code-changes | status | active | resolved | 2026-09-20T18:59:52Z |  |  |
| noteworthy:nw-commit-is-opaque-revision | review | proposed | accepted | 2026-09-20T18:59:52Z |  | denisurusov |
| waypoint:wp-adr-changed-log | review | proposed | accepted | 2026-09-20T18:59:52Z |  | denisurusov |
| concept:concept-ui-human-disposition | review |  | proposed | 2026-09-20T20:24:59Z |  |  |
| edge:e-dec-usability-uiactions | review |  | proposed | 2026-09-20T20:24:59Z |  |  |
| edge:e-drv-humandisp-uiaccept | review |  | proposed | 2026-09-20T20:24:59Z |  |  |
| edge:e-mark-uiaccept-uitask | review |  | proposed | 2026-09-20T20:24:59Z |  |  |
| edge:e-men-uiactions-nofork | review |  | proposed | 2026-09-20T20:24:59Z |  |  |
| edge:e-men-uiactions-sep | review |  | proposed | 2026-09-20T20:24:59Z |  |  |
| edge:e-rel-humandisp-sep | review |  | proposed | 2026-09-20T20:24:59Z |  |  |
| node:task-ui-simple-actions | review |  | proposed | 2026-09-20T20:24:59Z |  |  |
| node:task-ui-simple-actions | status |  | active | 2026-09-20T20:24:59Z |  |  |
| waypoint:wp-adr-ui-accept-action | review |  | proposed | 2026-09-20T20:24:59Z |  |  |
| edge:e-notes-uiactions-jcef | review |  | proposed | 2026-09-20T20:34:47Z |  |  |
| noteworthy:nw-jcef-no-js-dialogs | review |  | proposed | 2026-09-20T20:34:47Z |  |  |
| concept:concept-ui-human-disposition | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| edge:e-dec-usability-uiactions | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| edge:e-drv-humandisp-uiaccept | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| edge:e-mark-uiaccept-uitask | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| edge:e-men-uiactions-nofork | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| edge:e-men-uiactions-sep | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| edge:e-notes-uiactions-jcef | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| edge:e-rel-humandisp-sep | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| node:task-ui-simple-actions | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| node:task-ui-simple-actions | status | active | resolved | 2026-09-20T20:52:36Z |  |  |
| noteworthy:nw-jcef-no-js-dialogs | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| waypoint:wp-adr-ui-accept-action | review | proposed | accepted | 2026-09-20T20:52:36Z |  | denisurusov |
| edge:e-dec-account-authority | review | proposed | accepted | 2026-09-20T22:50:43Z |  | denisurusov |
| edge:e-dec-account-codechanges | review | proposed | accepted | 2026-09-20T22:50:43Z |  | denisurusov |
| edge:e-dec-account-exectask | review | proposed | accepted | 2026-09-20T22:50:43Z |  | denisurusov |
| edge:e-dec-account-gate | review | proposed | accepted | 2026-09-20T22:50:43Z |  | denisurusov |
| node:goal-accountability | review | proposed | accepted | 2026-09-20T22:50:43Z |  | denisurusov |
| concept:concept-versioned-write-seam | review |  | proposed | 2026-09-20T23:02:02Z |  |  |
| edge:e-drv-vwseam-casadr | review |  | proposed | 2026-09-20T23:02:02Z |  |  |
| edge:e-mark-casadr-castask | review |  | proposed | 2026-09-20T23:02:02Z |  |  |
| edge:e-men-cas-vwseam | review |  | proposed | 2026-09-20T23:02:02Z |  |  |
| waypoint:wp-adr-cas-write-contract | review |  | proposed | 2026-09-20T23:02:02Z |  |  |
| edge:e-not-account-acceptorunit | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| edge:e-not-authority-acceptorunit | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| edge:e-not-authority-enforcenotgated | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| edge:e-not-authority-humandefault | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| edge:e-not-authority-openpredicate | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| edge:e-not-authority-uniqueacceptor | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| edge:e-not-fleet-firstlevel | review |  | proposed | 2026-09-21T01:12:23Z |  |  |
| edge:e-not-fleet-uniqueacceptor | review |  | proposed | 2026-09-21T01:12:23Z |  |  |
| edge:e-not-signed-acceptorunit | review |  | proposed | 2026-09-21T01:12:23Z |  |  |
| edge:e-not-signed-enforce | review |  | proposed | 2026-09-21T01:12:23Z |  |  |
| noteworthy:nw-accept-authority-enforced-not-gated | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| noteworthy:nw-accept-scope-open-predicate | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| noteworthy:nw-acceptor-is-persona-capability | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| noteworthy:nw-first-fleet-level-triage-and-scoped-propose | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| noteworthy:nw-human-only-accept-default | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| noteworthy:nw-unique-acceptor-per-atom | review |  | accepted | 2026-09-21T01:12:23Z |  | denisurusov |
| edge:e-dec-usability-plugindist | review |  | proposed | 2026-09-23T11:38:32Z |  |  |
| edge:e-link-plugindist-intellij | review |  | proposed | 2026-09-23T11:38:32Z |  |  |
| node:task-intellij-plugin-distribution | review |  | proposed | 2026-09-23T11:38:32Z |  |  |
| node:task-intellij-plugin-distribution | status |  | open | 2026-09-23T11:38:32Z |  |  |
| edge:e-not-intellij-ziprelease | review |  | proposed | 2026-09-23T23:13:59Z |  |  |
| edge:e-not-plugindist-ziprelease | review |  | proposed | 2026-09-23T23:13:59Z |  |  |
| noteworthy:nw-plugin-zip-prebuilt-release | review |  | proposed | 2026-09-23T23:13:59Z |  |  |
| edge:e-not-adoption-releaseonly | review |  | proposed | 2026-09-23T23:44:50Z |  |  |
| edge:e-not-plugindist-releaseonly | review |  | proposed | 2026-09-23T23:44:50Z |  |  |
| noteworthy:nw-plugin-binary-release-only | review |  | proposed | 2026-09-23T23:44:50Z |  |  |
| concept:concept-compounding-advantage | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| concept:concept-provenance-completeness | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| node:task-binding-invariant-spec | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| node:task-binding-invariant-spec | status |  | active | 2026-09-26T18:47:34Z |  |  |
| node:task-binding-operating-behavior | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| node:task-binding-operating-behavior | status |  | active | 2026-09-26T18:47:34Z |  |  |
| node:task-conversation-binding | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| node:task-conversation-binding | status |  | active | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-binding-active-switch | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-binding-cold-start | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-binding-configurable | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-binding-extraction-enforced | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-binding-retroactive | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-crossover-over-parallel | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-experiment-open-items | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-experiment-open-items | status |  | unvalidated | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-no-artifacts-captured | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| noteworthy:nw-pilot-before-matrix | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| waypoint:wp-conversation-binding | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| waypoint:wp-validation-experiment | review |  | proposed | 2026-09-26T18:47:34Z |  |  |
| edge:e-dec-account-binding | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-dec-binding-behavior | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-dec-binding-spec | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-dec-oploop-binding | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-link-binding-review | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-mark-binding-task | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-mark-validexp-valid | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-men-binding-caprov | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-men-binding-completeness | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-men-bindingspec-completeness | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-men-valid-compounding | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-not-binding-coldstart | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-not-binding-configurable | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-not-binding-extraction | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-not-binding-noartifacts | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-not-binding-retroactive | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-not-binding-switch | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-not-valid-crossover | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-not-valid-openitems | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-not-valid-pilot | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-prod-bindingspec-review | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-prod-bindingspec-spec | review |  | proposed | 2026-09-26T18:50:14Z |  |  |
| edge:e-dec-usability-uiresolve | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| edge:e-drv-humandisp-uiresolve | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| edge:e-lnk-uiresolve-workthrough | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| edge:e-mark-uiresolve-uitask | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| edge:e-men-uiresolve-nofork | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| edge:e-men-uiresolve-sep | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| edge:e-not-uiresolve-verified | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| node:task-ui-resolve-action | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| node:task-ui-resolve-action | status |  | resolved | 2026-09-26T19:11:47Z |  |  |
| noteworthy:nw-ui-resolve-verified | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| waypoint:wp-adr-ui-resolve-action | review |  | proposed | 2026-09-26T19:11:47Z |  |  |
| edge:e-dec-usability-plugindist | review | proposed | accepted | 2026-09-26T19:11:47Z |  | denisurusov |
| edge:e-link-plugindist-intellij | review | proposed | accepted | 2026-09-26T19:11:47Z |  | denisurusov |
| node:task-intellij-plugin | status | open | resolved | 2026-09-26T19:11:47Z |  |  |
| node:task-intellij-plugin-distribution | review | proposed | accepted | 2026-09-26T19:11:47Z |  | denisurusov |
| node:task-intellij-plugin-distribution | status | open | resolved | 2026-09-26T19:11:47Z |  |  |
| edge:e-dec-usability-uiresolve | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| edge:e-drv-humandisp-uiresolve | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| edge:e-lnk-uiresolve-workthrough | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| edge:e-mark-uiresolve-uitask | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| edge:e-men-uiresolve-nofork | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| edge:e-men-uiresolve-sep | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| edge:e-not-uiresolve-verified | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| node:task-ui-resolve-action | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| noteworthy:nw-ui-resolve-verified | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| waypoint:wp-adr-ui-resolve-action | review | proposed | accepted | 2026-09-26T19:15:18Z |  | denisurusov |
| edge:e-dec-account-bindingaudit | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| edge:e-dec-usability-linkedin0926 | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| edge:e-dec-usability-presrefresh | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| edge:e-mark-plugindist-release011 | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| edge:e-men-bindingaudit-completeness | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| edge:e-not-bindingaudit-gap | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| node:task-binding-gap-audit | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| node:task-binding-gap-audit | status |  | open | 2026-09-26T23:24:48Z |  |  |
| node:task-linkedin-announce-2026-09 | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| node:task-linkedin-announce-2026-09 | status |  | active | 2026-09-26T23:24:48Z |  |  |
| node:task-presentation-refresh | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| node:task-presentation-refresh | status |  | resolved | 2026-09-26T23:24:48Z |  |  |
| noteworthy:nw-binding-enforcement-gap | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| waypoint:wp-plugin-release-0-0-11 | review |  | proposed | 2026-09-26T23:24:48Z |  |  |
| edge:e-dec-uiapp-implzero | review | proposed | accepted | 2026-09-26T23:24:48Z |  | denisurusov |
| edge:e-dec-uiapp-intellij | review | proposed | accepted | 2026-09-26T23:24:48Z |  | denisurusov |
| edge:e-dec-usability-uiapp | review | proposed | accepted | 2026-09-26T23:24:48Z |  | denisurusov |
| edge:e-link-uiapp-filters | review | proposed | accepted | 2026-09-26T23:24:48Z |  | denisurusov |
| edge:e-link-uiapp-nav | review | proposed | accepted | 2026-09-26T23:24:48Z |  | denisurusov |
| edge:e-link-uiapp-workthrough | review | proposed | accepted | 2026-09-26T23:24:48Z |  | denisurusov |
| edge:e-men-uiapp-sep | review | proposed | accepted | 2026-09-26T23:24:48Z |  | denisurusov |
| edge:e-not-uiapp-layering | review | proposed | accepted | 2026-09-26T23:24:48Z |  | denisurusov |
| node:task-konspekt-ui-app | review | proposed | accepted | 2026-09-26T23:24:48Z |  | denisurusov |
| edge:e-link-edgelayout-cas | review |  | accepted | 2026-09-27T00:37:10Z |  | denisurusov |
| edge:e-link-edgelayout-enterprise | review |  | accepted | 2026-09-27T00:37:10Z |  | denisurusov |
| edge:e-link-edgelayout-serial | review |  | accepted | 2026-09-27T00:37:10Z |  | denisurusov |
| edge:e-men-valid-memorylayer | review |  | accepted | 2026-09-27T00:37:10Z |  | denisurusov |
| edge:e-not-edgelayout-contention | review |  | accepted | 2026-09-27T00:37:10Z |  | denisurusov |
| edge:e-not-valid-verbatimrestore | review |  | accepted | 2026-09-27T00:37:10Z |  | denisurusov |
| node:task-edge-traversal-layout | review |  | accepted | 2026-09-27T00:37:10Z |  | denisurusov |
| node:task-edge-traversal-layout | status |  | open | 2026-09-27T00:37:10Z |  |  |
| noteworthy:nw-native-restore-needs-verbatim | review |  | accepted | 2026-09-27T00:37:10Z |  | denisurusov |
| edge:e-dec-account-bindingaudit | review | proposed | accepted | 2026-09-27T01:12:34Z |  | denisurusov |
| node:task-binding-gap-audit | review | proposed | accepted | 2026-09-27T01:12:34Z |  | denisurusov |
| edge:e-not-valid-restorestale | review |  | accepted | 2026-09-27T02:58:46Z |  | denisurusov |
| noteworthy:nw-native-restore-stale-on-live-state | review |  | accepted | 2026-09-27T02:58:46Z |  | denisurusov |
| concept:concept-compounding-advantage | review | proposed | accepted | 2026-09-27T03:07:36Z |  | denisurusov |
| edge:e-men-valid-compounding | review | proposed | accepted | 2026-09-27T03:07:36Z |  | denisurusov |
| edge:e-dec-usability-atomvocab | review | proposed | accepted | 2026-09-27T13:18:56Z |  | denisurusov |
| edge:e-dec-usability-presrefresh | review | proposed | accepted | 2026-09-27T13:18:56Z |  | denisurusov |
| edge:e-link-atomvocab-reconcile | review | proposed | accepted | 2026-09-27T13:18:56Z |  | denisurusov |
| edge:e-link-atomvocab-serial | review | proposed | accepted | 2026-09-27T13:18:56Z |  | denisurusov |
| node:task-atom-vocabulary | review | proposed | accepted | 2026-09-27T13:18:56Z |  | denisurusov |
| node:task-atom-vocabulary | status | open | resolved | 2026-09-27T13:18:56Z |  |  |
| node:task-presentation-refresh | review | proposed | accepted | 2026-09-27T13:18:56Z |  | denisurusov |
| edge:e-not-adoption-webmobile-bindopen | review |  | proposed | 2026-09-27T14:30:11Z |  |  |
| noteworthy:nw-webmobile-seed-binds-at-open | review |  | proposed | 2026-09-27T14:30:11Z |  |  |
| artifact:artifact-validation | review |  | proposed | 2026-09-27T15:01:01Z |  |  |
| edge:e-prod-valid-validation | review |  | proposed | 2026-09-27T15:01:01Z |  |  |
| edge:e-dec-boundedcost-edgelayout | review |  | accepted | 2026-09-27T22:56:35Z |  | denisurusov |
| edge:e-dec-boundedcost-subgraphfirst | review |  | accepted | 2026-09-27T22:56:35Z |  | denisurusov |
| edge:e-men-boundedcost-compounding | review |  | accepted | 2026-09-27T22:56:35Z |  | denisurusov |
| edge:e-not-edgelayout-scalehold | review |  | accepted | 2026-09-27T22:56:35Z |  | denisurusov |
| edge:e-not-valid-scalehold | review |  | accepted | 2026-09-27T22:56:35Z |  | denisurusov |
| node:goal-bounded-cost | review |  | accepted | 2026-09-27T22:56:35Z |  | denisurusov |
| node:goal-bounded-cost | status |  | active | 2026-09-27T22:56:35Z |  |  |
| node:task-subgraph-first-retrieval | review |  | accepted | 2026-09-27T22:56:35Z |  | denisurusov |
| node:task-subgraph-first-retrieval | status |  | open | 2026-09-27T22:56:35Z |  |  |
| noteworthy:nw-scale-sufficient-hold-optimization | review |  | accepted | 2026-09-27T22:56:35Z |  | denisurusov |
| artifact:artifact-fleet-spec | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-dec-collab-sourcesmigration | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-link-sourcesmigration-enterprise | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-link-sourcesmigration-provenance | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-men-fleet-caprov | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-account-durableref | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-enterprise-sha256 | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-fleet-committer | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-fleet-durableref | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-fleet-perproposal | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-fleet-rolesplit | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-fleet-sandboxegress | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-fleet-sha256 | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-provenance-sha256 | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-not-review-perproposal | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| edge:e-prod-fleet-spec | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| node:task-sources-sha256-migration | review |  | proposed | 2026-09-28T23:14:23Z |  |  |
| node:task-sources-sha256-migration | status |  | open | 2026-09-28T23:14:23Z |  |  |
| noteworthy:nw-fleet-committer-role-split | review |  | accepted | 2026-09-28T23:14:23Z |  | denisurusov |
| noteworthy:nw-fleet-durable-proposed-ref | review |  | accepted | 2026-09-28T23:14:23Z |  | denisurusov |
| noteworthy:nw-fleet-per-proposal-admission | review |  | accepted | 2026-09-28T23:14:23Z |  | denisurusov |
| noteworthy:nw-fleet-sandbox-committer-egress | review |  | accepted | 2026-09-28T23:14:23Z |  | denisurusov |
| noteworthy:nw-fleet-serialized-committer | review |  | accepted | 2026-09-28T23:14:23Z |  | denisurusov |
| noteworthy:nw-fleet-sha256-source-addressing | review |  | accepted | 2026-09-28T23:14:23Z |  | denisurusov |
| edge:e-not-fleet-canonauth | review |  | proposed | 2026-09-29T02:54:42Z |  |  |
| edge:e-sup-canonauth-durableref | review |  | accepted | 2026-09-29T02:54:42Z |  | denisurusov |
| noteworthy:nw-fleet-canonical-authoritative | review |  | accepted | 2026-09-29T02:54:42Z |  | denisurusov |
| edge:e-not-bindinggap-firstturn | review |  | accepted | 2026-09-30T01:20:55Z |  | denisurusov |
| noteworthy:nw-binding-firstturn-gate | review |  | accepted | 2026-09-30T01:20:55Z |  | denisurusov |
| edge:e-not-fleet-committhencall | review |  | proposed | 2026-10-02T22:37:36Z |  |  |
| edge:e-not-fleet-ingest | review |  | proposed | 2026-10-02T22:37:36Z |  |  |
| edge:e-not-fleet-outboxscope | review |  | proposed | 2026-10-02T22:37:36Z |  |  |
| edge:e-not-fleet-retraction | review |  | proposed | 2026-10-02T22:37:36Z |  |  |
| edge:e-sup-ingest-serialized | review |  | proposed | 2026-10-02T22:37:36Z |  |  |
| noteworthy:nw-fleet-commit-then-call | review |  | proposed | 2026-10-02T22:37:36Z |  |  |
| noteworthy:nw-fleet-committer-ingest-contract | review |  | proposed | 2026-10-02T22:37:36Z |  |  |
| noteworthy:nw-fleet-proposer-outbox-write-scope | review |  | proposed | 2026-10-02T22:37:36Z |  |  |
| noteworthy:nw-fleet-retraction-is-rejection | review |  | proposed | 2026-10-02T22:37:36Z |  |  |
| edge:e-dec-fleet-cursor | review |  | proposed | 2026-10-03T14:01:51Z |  |  |
| edge:e-not-cursorimpl-beforepr | review |  | proposed | 2026-10-03T14:01:51Z |  |  |
| node:task-cursor-implementation | review |  | proposed | 2026-10-03T14:01:51Z |  |  |
| node:task-cursor-implementation | status |  | open | 2026-10-03T14:01:51Z |  |  |
| noteworthy:nw-cursor-proposals-before-pr | review |  | proposed | 2026-10-03T14:01:51Z |  |  |
| node:task-transition-log | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| node:task-transition-log | status |  | active | 2026-10-04T16:24:34Z |  |  |
| node:task-transition-log-writers | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| node:task-transition-log-writers | status |  | open | 2026-10-04T16:24:34Z |  |  |
| noteworthy:nw-updatedat-not-acceptance-time | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| noteworthy:nw-transition-log-append-only | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| noteworthy:nw-transition-log-birth-rows-required | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| noteworthy:nw-transition-log-backfill-from-history | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| noteworthy:nw-transitions-observed-in-history | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-dec-obs-transition-log | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-dec-obs-transition-log-writers | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-link-transitionlog-writers | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-link-transitionlog-analytics | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-link-transitionlog-signedaccepts | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-link-tlwriters-uiresolve | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-link-tlwriters-intellij | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-not-transitionlog-updatedat | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-not-transitionlog-appendonly | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-not-transitionlog-birthrows | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-not-transitionlog-backfill | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-not-transitionlog-observed | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-not-notifications-observed | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-prod-transitionlog-serialization | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-prod-transitionlog-schema | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-prod-transitionlog-conformance | review |  | proposed | 2026-10-04T16:24:34Z |  |  |
| edge:e-sup-observed-reviewonly | review |  | proposed | 2026-10-04T16:52:09Z |  |  |
| node:task-transition-log | review | proposed | accepted | 2026-10-04T20:14:52Z |  | denisurusov |
| edge:e-dec-obs-transition-log | review | proposed | accepted | 2026-10-04T20:14:52Z |  | denisurusov |
| edge:e-prod-transitionlog-serialization | review | proposed | accepted | 2026-10-04T20:14:52Z |  | denisurusov |
| edge:e-prod-transitionlog-schema | review | proposed | accepted | 2026-10-04T20:14:52Z |  | denisurusov |
| noteworthy:nw-transition-log-append-only | review | proposed | accepted | 2026-10-04T20:17:09Z |  | denisurusov |
| edge:e-not-transitionlog-appendonly | review | proposed | accepted | 2026-10-04T20:17:09Z |  | denisurusov |
| noteworthy:nw-transition-log-backfill-from-history | review | proposed | accepted | 2026-10-04T20:17:15Z |  | denisurusov |
| edge:e-not-transitionlog-backfill | review | proposed | accepted | 2026-10-04T20:17:15Z |  | denisurusov |
| noteworthy:nw-transition-log-birth-rows-required | review | proposed | accepted | 2026-10-04T20:17:22Z |  | denisurusov |
| edge:e-not-transitionlog-birthrows | review | proposed | accepted | 2026-10-04T20:17:22Z |  | denisurusov |
| noteworthy:nw-transitions-observed-in-history | review | proposed | accepted | 2026-10-04T20:17:31Z |  | denisurusov |
| edge:e-not-transitionlog-observed | review | proposed | accepted | 2026-10-04T20:17:31Z |  | denisurusov |
| edge:e-not-notifications-observed | review | proposed | accepted | 2026-10-04T20:17:31Z |  | denisurusov |
| edge:e-sup-observed-reviewonly | review | proposed | accepted | 2026-10-04T20:17:31Z |  | denisurusov |
| noteworthy:nw-updatedat-not-acceptance-time | review | proposed | accepted | 2026-10-04T20:17:38Z |  | denisurusov |
| edge:e-not-transitionlog-updatedat | review | proposed | accepted | 2026-10-04T20:17:38Z |  | denisurusov |
| noteworthy:nw-components-are-not-the-standard | review | proposed | accepted | 2026-10-04T20:18:24Z |  | denisurusov |
| edge:e-not-adoption-componentsnotstandard | review | proposed | accepted | 2026-10-04T20:18:24Z |  | denisurusov |
| edge:e-not-notifications-componentsnotstandard | review | proposed | accepted | 2026-10-04T20:18:24Z |  | denisurusov |
| node:task-transition-log-writers | review | proposed | accepted | 2026-10-04T20:19:58Z |  | denisurusov |
| edge:e-dec-obs-transition-log-writers | review | proposed | accepted | 2026-10-04T20:19:58Z |  | denisurusov |
| edge:e-link-transitionlog-writers | review | proposed | accepted | 2026-10-04T20:19:58Z |  | denisurusov |
| edge:e-link-tlwriters-uiresolve | review | proposed | accepted | 2026-10-04T20:19:58Z |  | denisurusov |
| edge:e-link-tlwriters-intellij | review | proposed | accepted | 2026-10-04T20:19:58Z |  | denisurusov |
| node:task-transition-log | status | active | resolved | 2026-10-04T20:26:45Z |  |  |
| node:task-transition-log-writers | status | open | resolved | 2026-10-04T20:26:50Z |  |  |
| node:task-acceptance-before-work | review |  | accepted | 2026-10-07T12:26:13Z | 1d195ff1d54002f160df6c3ccf8439f6d382c9f7 | denisurusov |
| node:task-acceptance-before-work | status |  | open | 2026-10-07T12:26:13Z |  | claude |
| edge:e-dec-account-acceptancebeforework | review |  | accepted | 2026-10-07T12:26:13Z | 1d195ff1d54002f160df6c3ccf8439f6d382c9f7 | denisurusov |
| concept:concept-principal | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| concept:concept-accept-grant | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| artifact:artifact-authority-spec | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| noteworthy:nw-acceptor-and-grantor-roles | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| noteworthy:nw-grant-scope-is-entity-subgraph | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| noteworthy:nw-group-acceptance-any-member | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| noteworthy:nw-acceptance-originates-from-acceptor | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| noteworthy:nw-by-records-writing-principal | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| noteworthy:nw-acceptance-precedes-binding | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| noteworthy:nw-basis-policy-field | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| noteworthy:nw-binding-rows-have-timestamp | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| node:task-authority-writers-intellij | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| node:task-authority-writers-intellij | status |  | open | 2026-10-07T12:33:57Z |  | claude |
| edge:e-not-authority-roles | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-not-authority-scope | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-not-authority-group | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-not-authority-acceptancerule | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-not-authority-by | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-men-authority-principal | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-men-authority-grant | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-rel-principal-grant | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-sup-group-uniqueacceptor | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-sup-scope-openpredicate | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-prod-authority-spec | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-prod-authority-review | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-prod-authority-conformance | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-not-abw-precedes | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-not-abw-basis | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-not-abw-timestamp | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-prod-abw-review | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-prod-abw-conformance | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-link-abw-bindingaudit | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-link-abw-authority | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-dec-account-authoritywriters | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-link-authwriters-plugin | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
| edge:e-link-authwriters-authority | review |  | proposed | 2026-10-07T12:33:57Z |  | claude |
