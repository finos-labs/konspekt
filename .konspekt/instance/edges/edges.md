```yaml
provenance:
  conversationId: goals-and-motivation
  timestamp: 2026-06-21T13:00:00Z
review: accepted
```
# Edges

Single typed edge table (konspekt serialization v1). `from` / `to` are
`type:id`. `provenance` and `review` are the file-level defaults above.
`weight` is meaningful only for `relates`. `review` is a per-row **override**:
leave it empty to inherit the file-level default above; set it (e.g. `proposed`)
on an edge that is not yet accepted — typically one whose endpoint is itself a
proposal.

| id | kind | from | to | weight | review |
|----|------|------|----|--------|--------|
| e-dec-port-repo | decomposes | node:goal-portability | node:investigation-repo-structure |  |  |
| e-dec-port-comp | decomposes | node:goal-portability | node:investigation-competition |  |  |
| e-dec-port-naming | decomposes | node:goal-portability | node:investigation-naming |  |  |
| e-dec-port-second | decomposes | node:goal-portability | node:task-second-implementer |  |  |
| e-dec-port-license | decomposes | node:goal-portability | node:task-license |  |  |
| e-dec-port-adoption | decomposes | node:goal-portability | node:task-adoption-path |  |  |
| e-dec-port-notifications | decomposes | node:goal-portability | node:task-portable-notifications |  |  |
| e-dec-follow-valid | decomposes | node:goal-follow-thread | node:investigation-validation |  |  |
| e-dec-curated-valid | decomposes | node:goal-curated-context | node:investigation-validation |  |  |
| e-dec-repo-reconcile | decomposes | node:investigation-repo-structure | node:task-reconcile-schema |  |  |
| e-dec-repo-serial | decomposes | node:investigation-repo-structure | node:task-serialization-format |  |  |
| e-dec-repo-realign | decomposes | node:investigation-repo-structure | node:task-realign-instance |  |  |
| e-dec-repo-outcomes | decomposes | node:investigation-repo-structure | node:task-outcomes-node-type |  |  |
| e-dec-repo-layout | decomposes | node:investigation-repo-structure | node:task-instance-layout-regularity |  |  |
| e-dec-curated-oploop | decomposes | node:goal-curated-context | node:investigation-operating-loop |  |  |
| e-dec-follow-oploop | decomposes | node:goal-follow-thread | node:investigation-operating-loop |  |  |
| e-dec-oploop-ingestion | decomposes | node:investigation-operating-loop | node:task-ingestion-mode |  |  |
| e-dec-oploop-reconcile | decomposes | node:investigation-operating-loop | node:task-reconciliation |  |  |
| e-dec-oploop-trigger | decomposes | node:investigation-operating-loop | node:task-trigger-transport |  |  |
| e-dec-oploop-review | decomposes | node:investigation-operating-loop | node:task-review-ergonomics |  |  |
| e-dec-oploop-provenance | decomposes | node:investigation-operating-loop | node:task-provenance-model |  |  |
| e-dec-oploop-central | decomposes | node:investigation-operating-loop | node:task-central-service-binding |  |  |
| e-dec-oploop-notifications | decomposes | node:investigation-operating-loop | node:task-portable-notifications |  |  |
| e-dec-adoption-notifications | decomposes | node:task-adoption-path | node:task-portable-notifications |  |  |
| e-men-follow-extstate | mentions | node:goal-follow-thread | concept:concept-externalized-state |  |  |
| e-men-follow-conv | mentions | node:goal-follow-thread | concept:concept-goals-convergence |  |  |
| e-men-port-conn | mentions | node:goal-portability | concept:concept-connective-tissue |  |  |
| e-men-port-conv | mentions | node:goal-portability | concept:concept-goals-convergence |  |  |
| e-men-port-legible | mentions | node:goal-portability | concept:concept-legible-over-defensible |  |  |
| e-men-port-contract | mentions | node:goal-portability | concept:concept-transport-contract |  |  |
| e-men-curated-conv | mentions | node:goal-curated-context | concept:concept-goals-convergence |  |  |
| e-men-valid-need | mentions | node:investigation-validation | concept:concept-need-not-mechanic |  |  |
| e-men-valid-gap | mentions | node:investigation-validation | concept:concept-second-implementer-gap |  |  |
| e-men-comp-legible | mentions | node:investigation-competition | concept:concept-legible-over-defensible |  |  |
| e-men-second-gap | mentions | node:task-second-implementer | concept:concept-second-implementer-gap |  |  |
| e-men-trigger-contract | mentions | node:task-trigger-transport | concept:concept-transport-contract |  |  |
| e-men-central-contract | mentions | node:task-central-service-binding | concept:concept-transport-contract |  |  |
| e-men-review-sep | mentions | node:task-review-ergonomics | concept:concept-propose-accept-separation |  |  |
| e-men-ingestion-sep | mentions | node:task-ingestion-mode | concept:concept-propose-accept-separation |  |  |
| e-men-reconcile-sep | mentions | node:task-reconciliation | concept:concept-propose-accept-separation |  |  |
| e-men-provenance-caprov | mentions | node:task-provenance-model | concept:concept-content-addressed-provenance |  |  |
| e-men-comp-memorylayer | mentions | node:investigation-competition | concept:concept-konspekt-vs-memory-layer |  |  |
| e-men-repo-twopillars | mentions | node:investigation-repo-structure | concept:concept-two-pillars |  |  |
| e-men-adoption-upgrade | mentions | node:task-adoption-path | concept:concept-instance-upgradeability |  |  |
| e-men-notifications-upgrade | mentions | node:task-portable-notifications | concept:concept-instance-upgradeability |  |  |
| e-not-valid-hyp | notes | node:investigation-validation | noteworthy:nw-hypotheses-not-proof |  |  |
| e-not-valid-vocab | notes | node:investigation-validation | noteworthy:nw-validation-is-vocabulary |  |  |
| e-not-valid-curated | notes | node:investigation-validation | noteworthy:nw-curated-context-accuracy |  |  |
| e-not-curated-assump | notes | node:goal-curated-context | noteworthy:nw-curated-context-accuracy |  |  |
| e-not-outcomes-assump | notes | node:task-outcomes-node-type | noteworthy:nw-curated-context-accuracy |  |  |
| e-not-comp-copy | notes | node:investigation-competition | noteworthy:nw-copying-is-the-win |  |  |
| e-not-comp-absorb | notes | node:investigation-competition | noteworthy:nw-platforms-absorb-capabilities |  |  |
| e-not-repo-seam | notes | node:investigation-repo-structure | noteworthy:nw-spec-seam |  |  |
| e-not-oploop-seam | notes | node:investigation-operating-loop | noteworthy:nw-spec-seam |  |  |
| e-not-trigger-probe | notes | node:task-trigger-transport | noteworthy:nw-manual-reupload-probe |  |  |
| e-not-review-noblock | notes | node:task-review-ergonomics | noteworthy:nw-review-doesnt-block-persist |  |  |
| e-not-review-triage | notes | node:task-review-ergonomics | noteworthy:nw-confidence-triages-not-accepts |  |  |
| e-not-ingestion-convid | notes | node:task-ingestion-mode | noteworthy:nw-conversationid-host-injected |  |  |
| e-not-provenance-decision | notes | node:task-provenance-model | noteworthy:nw-provenance-content-addressed |  |  |
| e-not-provenance-pushbased | notes | node:task-provenance-model | noteworthy:nw-push-based-idempotence |  |  |
| e-not-provenance-timestamp | notes | node:task-provenance-model | noteworthy:nw-timestamp-source-time |  |  |
| e-not-oploop-triggers | notes | node:investigation-operating-loop | noteworthy:nw-triggers-event-not-cadence |  |  |
| e-not-trigger-triggers | notes | node:task-trigger-transport | noteworthy:nw-triggers-event-not-cadence |  |  |
| e-not-central-neutral | notes | node:task-central-service-binding | noteworthy:nw-mcp-binding-needs-neutral-read |  |  |
| e-not-review-forced | notes | node:task-review-ergonomics | noteworthy:nw-venturing-must-be-forced |  |  |
| e-not-repo-derive | notes | node:investigation-repo-structure | noteworthy:nw-derive-not-copy |  |  |
| e-not-trigger-skillpickup | notes | node:task-trigger-transport | noteworthy:nw-skill-pickup-transport-bound |  |  |
| e-not-review-skillpickup | notes | node:task-review-ergonomics | noteworthy:nw-skill-pickup-transport-bound |  |  |
| e-not-adoption-webmobile-seed | notes | node:task-adoption-path | noteworthy:nw-webmobile-seed-is-pointer-not-payload |  |  |
| e-not-adoption-whitepaper | notes | node:task-adoption-path | noteworthy:nw-whitepaper-non-normative |  |  |
| e-not-trigger-notifyconfig | notes | node:task-trigger-transport | noteworthy:nw-subscriptions-are-config-not-graph |  |  |
| e-not-trigger-notifyevents | notes | node:task-trigger-transport | noteworthy:nw-notify-events-are-creation-and-supersedes |  |  |
| e-not-trigger-notifypayload | notes | node:task-trigger-transport | noteworthy:nw-notification-payload-is-reference-only |  |  |
| e-not-reconcile-schemapractice | notes | node:task-reconcile-schema | noteworthy:nw-schema-behind-practice |  |  |
| e-not-second-schemapractice | notes | node:task-second-implementer | noteworthy:nw-schema-behind-practice |  |  |
| e-not-trigger-birthstate | notes | node:task-trigger-transport | noteworthy:nw-state-written-at-birth-not-transitioned |  |  |
| e-not-provenance-birthstate | notes | node:task-provenance-model | noteworthy:nw-state-written-at-birth-not-transitioned |  |  |
| e-not-reconcile-census | notes | node:task-reconcile-schema | noteworthy:nw-konspekt-conforms-code-tracer-drifts |  |  |
| e-not-second-census | notes | node:task-second-implementer | noteworthy:nw-konspekt-conforms-code-tracer-drifts |  |  |
| e-not-serial-filenameid | notes | node:task-serialization-format | noteworthy:nw-filename-id-rule-conflict |  |  |
| e-not-realign-filenameid | notes | node:task-realign-instance | noteworthy:nw-filename-id-rule-conflict |  |  |
| e-not-serial-renamed | notes | node:task-serialization-format | noteworthy:nw-filename-id-resolved-by-rename |  |  |
| e-not-realign-renamed | notes | node:task-realign-instance | noteworthy:nw-filename-id-resolved-by-rename |  |  |
| e-not-trigger-renamecreation | notes | node:task-trigger-transport | noteworthy:nw-rename-fires-as-creation |  |  |
| e-not-trigger-notifyorder | notes | node:task-trigger-transport | noteworthy:nw-notify-config-precedes-consumer |  |  |
| e-not-trigger-reviewtransitions | notes | node:task-trigger-transport | noteworthy:nw-review-is-the-only-field-that-transitions |  |  |
| e-not-trigger-nocredential | notes | node:task-trigger-transport | noteworthy:nw-delivery-channel-should-need-no-credential |  |  |
| e-not-notifications-nocredential | notes | node:task-portable-notifications | noteworthy:nw-delivery-channel-should-need-no-credential |  |  |
| e-not-adoption-componentsnotstandard | notes | node:task-adoption-path | noteworthy:nw-components-are-not-the-standard |  | proposed |
| e-not-notifications-componentsnotstandard | notes | node:task-portable-notifications | noteworthy:nw-components-are-not-the-standard |  | proposed |
| e-not-trigger-statustransitions | notes | node:task-trigger-transport | noteworthy:nw-node-status-does-transition |  | proposed |
| e-not-notifications-statustransitions | notes | node:task-portable-notifications | noteworthy:nw-node-status-does-transition |  | proposed |
| e-not-reconcile-statustransitions | notes | node:task-reconcile-schema | noteworthy:nw-node-status-does-transition |  | proposed |
| e-not-trigger-payloadenums | notes | node:task-trigger-transport | noteworthy:nw-payload-reference-only-admits-enums |  | proposed |
| e-not-notifications-payloadenums | notes | node:task-portable-notifications | noteworthy:nw-payload-reference-only-admits-enums |  | proposed |
| e-prod-repo-repo | produces | node:investigation-repo-structure | artifact:artifact-repo |  |  |
| e-prod-reconcile-spec | produces | node:task-reconcile-schema | artifact:artifact-spec |  |  |
| e-prod-reconcile-schema | produces | node:task-reconcile-schema | artifact:artifact-schema |  |  |
| e-prod-serial-serialization | produces | node:task-serialization-format | artifact:artifact-serialization |  |  |
| e-prod-ingestion-spec | produces | node:task-ingestion-mode | artifact:artifact-spec |  |  |
| e-prod-reconciliation-doc | produces | node:task-reconciliation | artifact:artifact-reconciliation |  |  |
| e-prod-trigger-transport | produces | node:task-trigger-transport | artifact:artifact-transport |  |  |
| e-prod-review-ergonomics | produces | node:task-review-ergonomics | artifact:artifact-review |  |  |
| e-prod-provenance-schema | produces | node:task-provenance-model | artifact:artifact-schema |  |  |
| e-prod-provenance-spec | produces | node:task-provenance-model | artifact:artifact-spec |  |  |
| e-prod-provenance-reconciliation | produces | node:task-provenance-model | artifact:artifact-reconciliation |  |  |
| e-prod-adoption-setup | produces | node:task-adoption-path | artifact:artifact-setup |  |  |
| e-prod-adoption-distribution | produces | node:task-adoption-path | artifact:artifact-distribution |  |  |
| e-prod-adoption-webmobile-seed | produces | node:task-adoption-path | artifact:artifact-webmobile-seed |  |  |
| e-prod-review-skill | produces | node:task-review-ergonomics | artifact:artifact-atom-readiness-skill |  |  |
| e-prod-adoption-whitepaper | produces | node:task-adoption-path | artifact:artifact-whitepaper |  |  |
| e-prod-layout-schemarecon | produces | node:task-instance-layout-regularity | artifact:artifact-schema-reconciliation |  | proposed |
| e-prod-layout-conformance | produces | node:task-instance-layout-regularity | artifact:artifact-conformance-checker |  | proposed |
| e-prod-adoption-conformance | produces | node:task-adoption-path | artifact:artifact-conformance-checker |  | proposed |
| e-prod-adoption-components | produces | node:task-adoption-path | artifact:artifact-components |  | proposed |
| e-prod-notifications-components | produces | node:task-portable-notifications | artifact:artifact-components |  | proposed |
| e-mark-frame-follow | marks | waypoint:wp-frame-goals | node:goal-follow-thread |  |  |
| e-mark-frame-port | marks | waypoint:wp-frame-goals | node:goal-portability |  |  |
| e-mark-curated | marks | waypoint:wp-curated-goal | node:goal-curated-context |  |  |
| e-mark-valid | marks | waypoint:wp-validation | node:investigation-validation |  |  |
| e-mark-open | marks | waypoint:wp-openness | node:investigation-competition |  |  |
| e-mark-naming | marks | waypoint:wp-naming | node:investigation-naming |  |  |
| e-mark-repo | marks | waypoint:wp-repo-structure | node:investigation-repo-structure |  |  |
| e-mark-spec-split | marks | waypoint:wp-spec-split | node:investigation-repo-structure |  |  |
| e-mark-provenance | marks | waypoint:wp-provenance-model | node:investigation-operating-loop |  |  |
| e-mark-triggers | marks | waypoint:wp-triggers | node:investigation-operating-loop |  |  |
| e-mark-delref-repo | marks | waypoint:wp-delete-reference | node:investigation-repo-structure |  |  |
| e-mark-delref-oploop | marks | waypoint:wp-delete-reference | node:investigation-operating-loop |  |  |
| e-mark-setupkit | marks | waypoint:wp-setup-kit | node:task-adoption-path |  |  |
| e-mark-conformance-layout | marks | waypoint:wp-conformance-checker | node:task-instance-layout-regularity |  | proposed |
| e-mark-conformance-adoption | marks | waypoint:wp-conformance-checker | node:task-adoption-path |  | proposed |
| e-rel-conv-extstate | relates | concept:concept-goals-convergence | concept:concept-externalized-state | 0.6 |  |
| e-rel-conv-conn | relates | concept:concept-goals-convergence | concept:concept-connective-tissue | 0.6 |  |
| e-rel-legible-gap | relates | concept:concept-legible-over-defensible | concept:concept-second-implementer-gap | 0.5 |  |
| e-rel-contract-legible | relates | concept:concept-transport-contract | concept:concept-legible-over-defensible | 0.5 |  |
| e-rel-caprov-contract | relates | concept:concept-content-addressed-provenance | concept:concept-transport-contract | 0.5 |  |
| e-rel-memorylayer-sep | relates | concept:concept-konspekt-vs-memory-layer | concept:concept-propose-accept-separation | 0.6 |  |
| e-rel-memorylayer-legible | relates | concept:concept-konspekt-vs-memory-layer | concept:concept-legible-over-defensible | 0.5 |  |
| e-rel-twopillars-legible | relates | concept:concept-two-pillars | concept:concept-legible-over-defensible | 0.5 |  |
| e-rel-twopillars-sep | relates | concept:concept-two-pillars | concept:concept-propose-accept-separation | 0.6 |  |
| e-sup-birthstate-notifyevents | supersedes | noteworthy:nw-state-written-at-birth-not-transitioned | noteworthy:nw-notify-events-are-creation-and-supersedes |  |  |
| e-sup-census-schemapractice | supersedes | noteworthy:nw-konspekt-conforms-code-tracer-drifts | noteworthy:nw-schema-behind-practice |  |  |
| e-sup-renamed-filenameid | supersedes | noteworthy:nw-filename-id-resolved-by-rename | noteworthy:nw-filename-id-rule-conflict |  |  |
| e-sup-statustransitions-birthstate | supersedes | noteworthy:nw-node-status-does-transition | noteworthy:nw-state-written-at-birth-not-transitioned |  | proposed |
| e-sup-payloadenums-payloadref | supersedes | noteworthy:nw-payload-reference-only-admits-enums | noteworthy:nw-notification-payload-is-reference-only |  | proposed |
| e-drv-asrlayering-adrengineer | drives | concept:concept-asr-persona-layering | waypoint:wp-adr-engineer-layer |  |  |

<!-- === roadmap changeset (held commit; nodes verified, ready to push) === -->
| e-dec-collab-multiauthor | decomposes | node:goal-collaboration | node:task-multi-author-review |  | proposed |
| e-dec-collab-fleet | decomposes | node:goal-collaboration | node:task-agent-fleet |  | proposed |
| e-dec-obs-analytics | decomposes | node:goal-observability | node:task-graph-analytics |  | proposed |
| e-dec-obs-monitoring | decomposes | node:goal-observability | node:task-realtime-monitoring |  | proposed |
| e-dec-port-enterprise | decomposes | node:goal-portability | node:task-enterprise-persistence |  | proposed |
| e-men-multiauthor-sep | mentions | node:task-multi-author-review | concept:concept-propose-accept-separation |  | proposed |
| e-men-fleet-sep | mentions | node:task-agent-fleet | concept:concept-propose-accept-separation |  | proposed |
| e-men-enterprise-caprov | mentions | node:task-enterprise-persistence | concept:concept-content-addressed-provenance |  | proposed |
| e-men-enterprise-contract | mentions | node:task-enterprise-persistence | concept:concept-transport-contract |  | proposed |
| e-not-enterprise-reupload | notes | node:task-enterprise-persistence | noteworthy:nw-manual-reupload-probe |  | proposed |
| e-not-enterprise-neutral | notes | node:task-enterprise-persistence | noteworthy:nw-mcp-binding-needs-neutral-read |  | proposed |
| e-rel-multiauthor-fleet | relates | node:task-multi-author-review | node:task-agent-fleet | 0.5 | proposed |
| e-rel-multiauthor-review | relates | node:task-multi-author-review | node:task-review-ergonomics | 0.5 | proposed |
| e-rel-fleet-review | relates | node:task-agent-fleet | node:task-review-ergonomics | 0.5 | proposed |
| e-rel-enterprise-provenance | relates | node:task-enterprise-persistence | node:task-provenance-model | 0.5 | proposed |
| e-rel-enterprise-central | relates | node:task-enterprise-persistence | node:task-central-service-binding | 0.5 | proposed |
| e-rel-analytics-validation | relates | node:task-graph-analytics | node:investigation-validation | 0.5 | proposed |
| e-rel-monitoring-notifications | relates | node:task-realtime-monitoring | node:task-portable-notifications | 0.5 | proposed |
| e-rel-monitoring-enterprise | relates | node:task-realtime-monitoring | node:task-enterprise-persistence | 0.5 | proposed |

<!-- === accountability draft (first draft, unreviewed; one open item) === -->
| e-dec-account-report | decomposes | node:goal-accountability | node:task-accountability-report |  | proposed |
| e-dec-account-signed | decomposes | node:goal-accountability | node:task-signed-accepts |  | proposed |
| e-dec-account-gate | decomposes | node:goal-accountability | node:task-persona-change-gate |  | proposed |
| e-men-report-caprov | mentions | node:task-accountability-report | concept:concept-content-addressed-provenance |  | proposed |
| e-men-signed-sep | mentions | node:task-signed-accepts | concept:concept-propose-accept-separation |  | proposed |
| e-rel-report-fleet | relates | node:task-accountability-report | node:task-agent-fleet | 0.5 | proposed |
| e-rel-report-observ | relates | node:task-accountability-report | node:goal-observability | 0.5 | proposed |
| e-rel-signed-multiauthor | relates | node:task-signed-accepts | node:task-multi-author-review | 0.5 | proposed |
| e-not-provenance-checkerbytes | notes | node:task-provenance-model | noteworthy:nw-checker-hashes-raw-disk-bytes |  |  |
