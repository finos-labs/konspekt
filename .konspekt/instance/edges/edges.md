```yaml
provenance:
  conversationId: goals-and-motivation
  timestamp: 2026-06-21T13:00:00Z
review: accepted
```
# Edges

Single typed edge table (konspekt serialization v1). `from` / `to` are
`type:id`. `provenance` and `review` are the file-level defaults above.
`weight` is meaningful only for `relates` (concept↔concept) and `links`
(node↔node, generic "linked to"). `review` is a per-row **override**:
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
| e-not-adoption-webmobile-bindopen | notes | node:task-adoption-path | noteworthy:nw-webmobile-seed-binds-at-open |  | proposed |
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
| e-not-adoption-componentsnotstandard | notes | node:task-adoption-path | noteworthy:nw-components-are-not-the-standard |  | accepted |
| e-not-notifications-componentsnotstandard | notes | node:task-portable-notifications | noteworthy:nw-components-are-not-the-standard |  | accepted |
| e-not-trigger-statustransitions | notes | node:task-trigger-transport | noteworthy:nw-node-status-does-transition |  | proposed |
| e-not-notifications-statustransitions | notes | node:task-portable-notifications | noteworthy:nw-node-status-does-transition |  | proposed |
| e-not-reconcile-statustransitions | notes | node:task-reconcile-schema | noteworthy:nw-node-status-does-transition |  | proposed |
| e-not-trigger-payloadenums | notes | node:task-trigger-transport | noteworthy:nw-payload-reference-only-admits-enums |  | accepted |
| e-not-notifications-payloadenums | notes | node:task-portable-notifications | noteworthy:nw-payload-reference-only-admits-enums |  | accepted |
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
| e-mark-links-serial | marks | waypoint:wp-links-edge-kind | node:task-serialization-format |  | accepted |
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
| e-sup-payloadenums-payloadref | supersedes | noteworthy:nw-payload-reference-only-admits-enums | noteworthy:nw-notification-payload-is-reference-only |  | accepted |
| e-drv-asrlayering-adrengineer | drives | concept:concept-asr-persona-layering | waypoint:wp-adr-engineer-layer |  |  |

<!-- === roadmap changeset (held commit; nodes verified, ready to push) === -->
| e-dec-collab-multiauthor | decomposes | node:goal-collaboration | node:task-multi-author-review |  | proposed |
| e-dec-collab-fleet | decomposes | node:goal-collaboration | node:task-agent-fleet |  | proposed |
| e-dec-obs-analytics | decomposes | node:goal-observability | node:task-graph-analytics |  | proposed |
| e-dec-obs-monitoring | decomposes | node:goal-observability | node:task-realtime-monitoring |  | proposed |
| e-dec-port-enterprise | decomposes | node:goal-portability | node:task-enterprise-persistence |  | proposed |
| e-men-multiauthor-sep | mentions | node:task-multi-author-review | concept:concept-propose-accept-separation |  | proposed |
| e-men-fleet-sep | mentions | node:task-agent-fleet | concept:concept-propose-accept-separation |  | accepted |
| e-men-enterprise-caprov | mentions | node:task-enterprise-persistence | concept:concept-content-addressed-provenance |  | proposed |
| e-men-enterprise-contract | mentions | node:task-enterprise-persistence | concept:concept-transport-contract |  | proposed |
| e-not-enterprise-reupload | notes | node:task-enterprise-persistence | noteworthy:nw-manual-reupload-probe |  | proposed |
| e-not-enterprise-neutral | notes | node:task-enterprise-persistence | noteworthy:nw-mcp-binding-needs-neutral-read |  | proposed |
| e-link-multiauthor-fleet | links | node:task-multi-author-review | node:task-agent-fleet | 0.5 | proposed |
| e-link-multiauthor-review | links | node:task-multi-author-review | node:task-review-ergonomics | 0.5 | proposed |
| e-link-fleet-review | links | node:task-agent-fleet | node:task-review-ergonomics | 0.5 | accepted |
| e-link-enterprise-provenance | links | node:task-enterprise-persistence | node:task-provenance-model | 0.5 | proposed |
| e-link-enterprise-central | links | node:task-enterprise-persistence | node:task-central-service-binding | 0.5 | proposed |
| e-link-analytics-validation | links | node:task-graph-analytics | node:investigation-validation | 0.5 | proposed |
| e-link-monitoring-notifications | links | node:task-realtime-monitoring | node:task-portable-notifications | 0.5 | proposed |
| e-link-monitoring-enterprise | links | node:task-realtime-monitoring | node:task-enterprise-persistence | 0.5 | proposed |

<!-- === accountability draft (first draft, unreviewed; one open item) === -->
| e-dec-account-report | decomposes | node:goal-accountability | node:task-accountability-report |  | proposed |
| e-dec-account-signed | decomposes | node:goal-accountability | node:task-signed-accepts |  | proposed |
| e-dec-account-gate | decomposes | node:goal-accountability | node:task-persona-change-gate |  | accepted |
| e-men-report-caprov | mentions | node:task-accountability-report | concept:concept-content-addressed-provenance |  | proposed |
| e-men-signed-sep | mentions | node:task-signed-accepts | concept:concept-propose-accept-separation |  | proposed |
| e-link-report-fleet | links | node:task-accountability-report | node:task-agent-fleet | 0.5 | proposed |
| e-link-report-observ | links | node:task-accountability-report | node:goal-observability | 0.5 | proposed |
| e-link-signed-multiauthor | links | node:task-signed-accepts | node:task-multi-author-review | 0.5 | proposed |
| e-not-provenance-checkerbytes | notes | node:task-provenance-model | noteworthy:nw-checker-hashes-raw-disk-bytes |  |  |
| e-dec-obs-roadmap-gen | decomposes | node:goal-observability | node:task-roadmap-generator |  | proposed |
| e-dec-obs-roadmap-wf | decomposes | node:goal-observability | node:task-roadmap-generation-workflow |  | proposed |
| e-not-roadmap-gate-authority | notes | node:task-roadmap-generator | noteworthy:nw-roadmap-generation-coupled-to-authority |  |  |
| e-not-roadmap-wf-authority | notes | node:task-roadmap-generation-workflow | noteworthy:nw-roadmap-generation-coupled-to-authority |  |  |
| e-dec-obs-roadmap-poster | decomposes | node:goal-observability | node:task-roadmap-poster-generated |  | proposed |
| e-not-poster-derive | notes | node:task-roadmap-poster-generated | noteworthy:nw-derive-not-copy |  |  |
| e-not-collab-issueintake | notes | node:goal-collaboration | noteworthy:nw-inbound-issue-needs-consensus-intake |  | proposed |
| e-dec-account-authority | decomposes | node:goal-accountability | node:task-authority-mechanism |  | accepted |
| e-link-authority-gate | links | node:task-authority-mechanism | node:task-persona-change-gate | 0.7 | proposed |
| e-link-authority-signed | links | node:task-authority-mechanism | node:task-signed-accepts | 0.6 | proposed |
| e-not-authority-single | notes | node:task-authority-mechanism | noteworthy:nw-instance-single-individual-authority |  | proposed |
| e-not-authority-roadmapauth | notes | node:task-authority-mechanism | noteworthy:nw-roadmap-generation-coupled-to-authority |  | proposed |
| e-prod-poster-roadmapgen | produces | node:task-roadmap-poster-generated | artifact:artifact-roadmap-poster-generator |  | proposed |
| e-prod-poster-stategen | produces | node:task-roadmap-poster-generated | artifact:artifact-state-poster-generator |  | proposed |
| e-not-ingestion-carrier | notes | node:task-ingestion-mode | noteworthy:nw-convention-carrier |  | proposed |
| e-not-central-carrier | notes | node:task-central-service-binding | noteworthy:nw-convention-carrier |  | proposed |
| e-not-adoption-carrier | notes | node:task-adoption-path | noteworthy:nw-convention-carrier |  | proposed |
| e-not-portability-carrier | notes | node:goal-portability | noteworthy:nw-convention-carrier |  | proposed |
| e-dec-usability-filters | decomposes | node:goal-usability | node:task-visual-status-filters |  |  |
| e-dec-usability-nav | decomposes | node:goal-usability | node:task-goal-task-navigation |  |  |
| e-dec-usability-workthrough | decomposes | node:goal-usability | node:task-task-workthrough-ui |  |  |
| e-prod-filters-explorer | produces | node:task-visual-status-filters | artifact:artifact-visual-explorer |  |  |
| e-prod-nav-explorer | produces | node:task-goal-task-navigation | artifact:artifact-visual-explorer |  |  |

<!-- === app design 101 changeset (proposed; konspekt UI application) === -->
| e-dec-usability-uiapp | decomposes | node:goal-usability | node:task-konspekt-ui-app |  | accepted |
| e-dec-usability-mcpapp | decomposes | node:goal-usability | node:task-mcp-app-surface |  | proposed |
| e-dec-collab-cas | decomposes | node:goal-collaboration | node:task-atom-versioning-cas |  | proposed |
| e-link-uiapp-workthrough | links | node:task-konspekt-ui-app | node:task-task-workthrough-ui | 0.8 | accepted |
| e-link-uiapp-nav | links | node:task-konspekt-ui-app | node:task-goal-task-navigation | 0.7 | accepted |
| e-link-uiapp-filters | links | node:task-konspekt-ui-app | node:task-visual-status-filters | 0.7 | accepted |
| e-link-uiapp-mcpapp | links | node:task-konspekt-ui-app | node:task-mcp-app-surface | 0.7 | proposed |
| e-link-mcpapp-central | links | node:task-mcp-app-surface | node:task-central-service-binding | 0.6 | proposed |
| e-link-cas-enterprise | links | node:task-atom-versioning-cas | node:task-enterprise-persistence | 0.7 | proposed |
| e-link-cas-multiauthor | links | node:task-atom-versioning-cas | node:task-multi-author-review | 0.6 | proposed |
| e-link-cas-reconciliation | links | node:task-atom-versioning-cas | node:task-reconciliation | 0.6 | proposed |
| e-men-uiapp-companion | mentions | node:task-konspekt-ui-app | concept:concept-companion-surface |  | proposed |
| e-men-mcpapp-companion | mentions | node:task-mcp-app-surface | concept:concept-companion-surface |  | proposed |
| e-men-uiapp-sep | mentions | node:task-konspekt-ui-app | concept:concept-propose-accept-separation |  | accepted |
| e-men-cas-sep | mentions | node:task-atom-versioning-cas | concept:concept-propose-accept-separation |  | proposed |
| e-drv-vwseam-casadr | drives | concept:concept-versioned-write-seam | waypoint:wp-adr-cas-write-contract |  | proposed |
| e-mark-casadr-castask | marks | waypoint:wp-adr-cas-write-contract | node:task-atom-versioning-cas |  | proposed |
| e-men-cas-vwseam | mentions | node:task-atom-versioning-cas | concept:concept-versioned-write-seam |  | proposed |
| e-men-mcpapp-contract | mentions | node:task-mcp-app-surface | concept:concept-transport-contract |  | proposed |
| e-rel-companion-memorylayer | relates | concept:concept-companion-surface | concept:concept-konspekt-vs-memory-layer | 0.6 | proposed |
| e-not-mcpapp-nowake | notes | node:task-mcp-app-surface | noteworthy:nw-server-cannot-wake-a-session |  | proposed |
| e-not-trigger-nowake | notes | node:task-trigger-transport | noteworthy:nw-server-cannot-wake-a-session |  | proposed |
| e-not-mcpapp-backendclient | notes | node:task-mcp-app-surface | noteworthy:nw-backend-is-mcp-client-on-web |  | proposed |
| e-not-uiapp-mobile | notes | node:task-konspekt-ui-app | noteworthy:nw-claude-mobile-not-a-target |  | proposed |
| e-not-uiapp-oneview | notes | node:task-konspekt-ui-app | noteworthy:nw-one-view-two-transports |  | accepted |
| e-not-mcpapp-oneview | notes | node:task-mcp-app-surface | noteworthy:nw-one-view-two-transports |  | proposed |
| e-not-cas-versioning | notes | node:task-atom-versioning-cas | noteworthy:nw-versioning-not-write-scope |  | proposed |
| e-not-cas-cursor | notes | node:task-atom-versioning-cas | noteworthy:nw-cursor-is-opaque-store-token |  | proposed |
| e-not-cas-multifilepush | notes | node:task-atom-versioning-cas | noteworthy:nw-multifile-push-clobbers-silently |  | proposed |
| e-not-cas-edgecontention | notes | node:task-atom-versioning-cas | noteworthy:nw-edge-table-contends-under-cas |  | proposed |
| e-not-enterprise-backends | notes | node:task-enterprise-persistence | noteworthy:nw-mongo-enterprise-postgres-oss |  | proposed |
| e-not-enterprise-appendonly | notes | node:task-enterprise-persistence | noteworthy:nw-db-backend-needs-append-only-record |  | proposed |
| e-not-provenance-appendonly | notes | node:task-provenance-model | noteworthy:nw-db-backend-needs-append-only-record |  | proposed |
| e-not-mcpapp-cardv1 | notes | node:task-mcp-app-surface | noteworthy:nw-card-v1-is-last-ten-changed |  | proposed |
| e-dec-usability-atomvocab | decomposes | node:goal-usability | node:task-atom-vocabulary |  | accepted |
| e-link-atomvocab-serial | links | node:task-atom-vocabulary | node:task-serialization-format | 0.6 | accepted |
| e-link-atomvocab-reconcile | links | node:task-atom-vocabulary | node:task-reconcile-schema | 0.6 | accepted |
| e-not-trigger-pollfloor | notes | node:task-trigger-transport | noteworthy:nw-poll-is-the-floor-push-is-optional |  | accepted |
| e-not-cas-pollfloor | notes | node:task-atom-versioning-cas | noteworthy:nw-poll-is-the-floor-push-is-optional |  | proposed |
| e-not-uiapp-pollfloor | notes | node:task-konspekt-ui-app | noteworthy:nw-poll-is-the-floor-push-is-optional |  | accepted |
| e-not-enterprise-pollfloor | notes | node:task-enterprise-persistence | noteworthy:nw-poll-is-the-floor-push-is-optional |  | proposed |
| e-prod-uiapp-uidesign | produces | node:task-konspekt-ui-app | artifact:artifact-ui-design |  | proposed |
| e-prod-mcpapp-uidesign | produces | node:task-mcp-app-surface | artifact:artifact-ui-design |  | proposed |
| e-prod-cas-uidesign | produces | node:task-atom-versioning-cas | artifact:artifact-ui-design |  | proposed |
| e-prod-enterprise-uidesign | produces | node:task-enterprise-persistence | artifact:artifact-ui-design |  | proposed |

<!-- === implementations changeset (proposed; local-first layering) === -->
| e-dec-uiapp-implzero | decomposes | node:task-konspekt-ui-app | node:task-implementation-zero |  | accepted |
| e-dec-uiapp-intellij | decomposes | node:task-konspekt-ui-app | node:task-intellij-plugin |  | accepted |
| e-not-uiapp-layering | notes | node:task-konspekt-ui-app | noteworthy:nw-implementation-layering |  | accepted |
| e-not-implzero-layering | notes | node:task-implementation-zero | noteworthy:nw-implementation-layering |  |  |
| e-not-intellij-layering | notes | node:task-intellij-plugin | noteworthy:nw-implementation-layering |  |  |
| e-not-implzero-pollfloor | notes | node:task-implementation-zero | noteworthy:nw-poll-is-the-floor-push-is-optional |  | accepted |
| e-not-implzero-oneview | notes | node:task-implementation-zero | noteworthy:nw-one-view-two-transports |  | accepted |
| e-not-intellij-oneview | notes | node:task-intellij-plugin | noteworthy:nw-one-view-two-transports |  | accepted |
| e-link-intellij-mcpapp | links | node:task-intellij-plugin | node:task-mcp-app-surface | 0.7 | proposed |
| e-link-implzero-intellij | links | node:task-implementation-zero | node:task-intellij-plugin | 0.6 |  |
| e-prod-implzero-design | produces | node:task-implementation-zero | artifact:artifact-implementation-zero-design |  |  |
| e-not-implzero-electron | notes | node:task-implementation-zero | noteworthy:nw-electron-shell |  |  |
| e-not-repostructure-impldir | notes | node:investigation-repo-structure | noteworthy:nw-implementations-directory |  |  |
| e-not-implzero-impldir | notes | node:task-implementation-zero | noteworthy:nw-implementations-directory |  |  |

<!-- === intellij-plugin changeset (ASR/ADR + RCA finding) === -->
| e-drv-viewnofork-plugininprocess | drives | concept:concept-view-no-fork | waypoint:wp-adr-plugin-inprocess |  |  |
| e-mark-adrplugininprocess-intellij | marks | waypoint:wp-adr-plugin-inprocess | node:task-intellij-plugin |  |  |
| e-not-oploop-personabrief | notes | node:investigation-operating-loop | noteworthy:nw-persona-brief-not-surfaced |  | proposed |
| e-link-intellij-second | links | node:task-intellij-plugin | node:task-second-implementer | 0.8 | proposed |

<!-- === executed-provenance changeset (ASR/ADR for the command log) === -->
| e-drv-recordexec-adrlog | drives | concept:concept-record-all-executed | waypoint:wp-adr-executed-log |  |  |
| e-mark-adrlog-exectask | marks | waypoint:wp-adr-executed-log | node:task-executed-provenance-serialization |  |  |
| e-drv-recordexec-adrchanged | drives | concept:concept-record-all-executed | waypoint:wp-adr-changed-log |  | accepted |
| e-mark-adrchanged-changetask | marks | waypoint:wp-adr-changed-log | node:task-record-code-changes |  | accepted |
| e-notes-changetask-opaquerev | notes | node:task-record-code-changes | noteworthy:nw-commit-is-opaque-revision |  | accepted |
| e-dec-account-exectask | decomposes | node:goal-accountability | node:task-executed-provenance-serialization |  | accepted |

<!-- === UI tasks changeset (ASR/ADR view, related-commands, plugin pop-mode) === -->
| e-dec-usability-asradrui | decomposes | node:goal-usability | node:task-asr-adr-ui |  | accepted |
| e-dec-usability-relcommands | decomposes | node:goal-usability | node:task-related-commands-view |  | accepted |
| e-dec-intellij-popmode | decomposes | node:task-intellij-plugin | node:task-plugin-pop-mode |  | accepted |
| e-men-asradrui-surfacedata | mentions | node:task-asr-adr-ui | concept:concept-surface-follows-data |  | accepted |
| e-men-asradrui-nofork | mentions | node:task-asr-adr-ui | concept:concept-view-no-fork |  | accepted |
| e-men-relcommands-nofork | mentions | node:task-related-commands-view | concept:concept-view-no-fork |  | accepted |
| e-men-relcommands-surfacedata | mentions | node:task-related-commands-view | concept:concept-surface-follows-data |  | accepted |
| e-link-relcommands-execlog | links | node:task-related-commands-view | node:task-executed-provenance-serialization | 0.7 | accepted |
| e-men-popmode-nofork | mentions | node:task-plugin-pop-mode | concept:concept-view-no-fork |  | accepted |
| e-dec-account-codechanges | decomposes | node:goal-accountability | node:task-record-code-changes |  | accepted |
| e-link-codechanges-execlog | links | node:task-record-code-changes | node:task-executed-provenance-serialization | 0.7 | accepted |
| e-link-codechanges-popmode | links | node:task-record-code-changes | node:task-plugin-pop-mode | 0.5 | accepted |
| e-men-codechanges-caprov | mentions | node:task-record-code-changes | concept:concept-content-addressed-provenance |  | accepted |
| e-drv-humandisp-uiaccept | drives | concept:concept-ui-human-disposition | waypoint:wp-adr-ui-accept-action |  | accepted |
| e-mark-uiaccept-uitask | marks | waypoint:wp-adr-ui-accept-action | node:task-ui-simple-actions |  | accepted |
| e-dec-usability-uiactions | decomposes | node:goal-usability | node:task-ui-simple-actions |  | accepted |
| e-men-uiactions-sep | mentions | node:task-ui-simple-actions | concept:concept-propose-accept-separation |  | accepted |
| e-men-uiactions-nofork | mentions | node:task-ui-simple-actions | concept:concept-view-no-fork |  | accepted |
| e-rel-humandisp-sep | relates | concept:concept-ui-human-disposition | concept:concept-propose-accept-separation | 0.6 | accepted |
| e-notes-uiactions-jcef | notes | node:task-ui-simple-actions | noteworthy:nw-jcef-no-js-dialogs |  | accepted |
| e-prod-implzero-app | produces | node:task-implementation-zero | artifact:artifact-implementation-zero-app |  |  |
| e-prod-nav-app | produces | node:task-goal-task-navigation | artifact:artifact-implementation-zero-app |  |  |
| e-prod-analytics-app | produces | node:task-graph-analytics | artifact:artifact-implementation-zero-app |  | proposed |

<!-- === fleet acceptance-authority changeset (six decisions; conversation fleet-authority) === -->
| e-not-account-acceptorunit | notes | node:goal-accountability | noteworthy:nw-acceptor-is-persona-capability |  |  |
| e-not-authority-acceptorunit | notes | node:task-authority-mechanism | noteworthy:nw-acceptor-is-persona-capability |  |  |
| e-not-authority-humandefault | notes | node:task-authority-mechanism | noteworthy:nw-human-only-accept-default |  |  |
| e-not-authority-uniqueacceptor | notes | node:task-authority-mechanism | noteworthy:nw-unique-acceptor-per-atom |  |  |
| e-not-authority-openpredicate | notes | node:task-authority-mechanism | noteworthy:nw-accept-scope-open-predicate |  |  |
| e-not-authority-enforcenotgated | notes | node:task-authority-mechanism | noteworthy:nw-accept-authority-enforced-not-gated |  |  |
| e-not-fleet-firstlevel | notes | node:task-agent-fleet | noteworthy:nw-first-fleet-level-triage-and-scoped-propose |  | accepted |
| e-not-fleet-uniqueacceptor | notes | node:task-agent-fleet | noteworthy:nw-unique-acceptor-per-atom |  | accepted |
| e-not-signed-acceptorunit | notes | node:task-signed-accepts | noteworthy:nw-acceptor-is-persona-capability |  | proposed |
| e-not-signed-enforce | notes | node:task-signed-accepts | noteworthy:nw-accept-authority-enforced-not-gated |  | proposed |

<!-- === plugin distribution changeset (proposed; usability) === -->
| e-dec-usability-plugindist | decomposes | node:goal-usability | node:task-intellij-plugin-distribution |  | accepted |
| e-link-plugindist-intellij | links | node:task-intellij-plugin-distribution | node:task-intellij-plugin | 0.8 | accepted |

<!-- === plugin-zip release decision (proposed; usability) === -->
| e-not-plugindist-ziprelease | notes | node:task-intellij-plugin-distribution | noteworthy:nw-plugin-zip-prebuilt-release |  | accepted |
| e-not-intellij-ziprelease | notes | node:task-intellij-plugin | noteworthy:nw-plugin-zip-prebuilt-release |  | accepted |
| e-not-plugindist-releaseonly | notes | node:task-intellij-plugin-distribution | noteworthy:nw-plugin-binary-release-only |  | accepted |
| e-not-adoption-releaseonly | notes | node:task-adoption-path | noteworthy:nw-plugin-binary-release-only |  | accepted |

<!-- === UI resolve action (proposed; usability) === -->
| e-dec-usability-uiresolve | decomposes | node:goal-usability | node:task-ui-resolve-action |  | accepted |
| e-drv-humandisp-uiresolve | drives | concept:concept-ui-human-disposition | waypoint:wp-adr-ui-resolve-action |  | accepted |
| e-mark-uiresolve-uitask | marks | waypoint:wp-adr-ui-resolve-action | node:task-ui-resolve-action |  | accepted |
| e-lnk-uiresolve-workthrough | links | node:task-ui-resolve-action | node:task-task-workthrough-ui | 0.8 | accepted |
| e-men-uiresolve-sep | mentions | node:task-ui-resolve-action | concept:concept-propose-accept-separation |  | accepted |
| e-men-uiresolve-nofork | mentions | node:task-ui-resolve-action | concept:concept-view-no-fork |  | accepted |
| e-not-uiresolve-verified | notes | node:task-ui-resolve-action | noteworthy:nw-ui-resolve-verified |  | accepted |

<!-- === conversation-binding changeset (proposed; invariant V) === -->
| e-dec-oploop-binding | decomposes | node:investigation-operating-loop | node:task-conversation-binding |  | proposed |
| e-dec-account-binding | decomposes | node:goal-accountability | node:task-conversation-binding |  | proposed |
| e-dec-binding-spec | decomposes | node:task-conversation-binding | node:task-binding-invariant-spec |  | proposed |
| e-dec-binding-behavior | decomposes | node:task-conversation-binding | node:task-binding-operating-behavior |  | proposed |
| e-not-binding-coldstart | notes | node:task-conversation-binding | noteworthy:nw-binding-cold-start |  | proposed |
| e-not-binding-switch | notes | node:task-conversation-binding | noteworthy:nw-binding-active-switch |  | proposed |
| e-not-binding-configurable | notes | node:task-conversation-binding | noteworthy:nw-binding-configurable |  | proposed |
| e-not-binding-extraction | notes | node:task-conversation-binding | noteworthy:nw-binding-extraction-enforced |  | proposed |
| e-not-binding-retroactive | notes | node:task-conversation-binding | noteworthy:nw-binding-retroactive |  | proposed |
| e-not-binding-noartifacts | notes | node:task-conversation-binding | noteworthy:nw-no-artifacts-captured |  | proposed |
| e-men-binding-completeness | mentions | node:task-conversation-binding | concept:concept-provenance-completeness |  | proposed |
| e-men-binding-caprov | mentions | node:task-conversation-binding | concept:concept-content-addressed-provenance |  | proposed |
| e-men-bindingspec-completeness | mentions | node:task-binding-invariant-spec | concept:concept-provenance-completeness |  | proposed |
| e-prod-bindingspec-spec | produces | node:task-binding-invariant-spec | artifact:artifact-spec |  | proposed |
| e-prod-bindingspec-review | produces | node:task-binding-invariant-spec | artifact:artifact-review |  | proposed |
| e-mark-binding-task | marks | waypoint:wp-conversation-binding | node:task-conversation-binding |  | proposed |
| e-link-binding-review | links | node:task-conversation-binding | node:task-review-ergonomics | 0.6 | proposed |

<!-- === validation-experiment changeset (proposed; design direction under investigation-validation) === -->
| e-not-valid-crossover | notes | node:investigation-validation | noteworthy:nw-crossover-over-parallel |  | proposed |
| e-not-valid-pilot | notes | node:investigation-validation | noteworthy:nw-pilot-before-matrix |  | proposed |
| e-not-valid-openitems | notes | node:investigation-validation | noteworthy:nw-experiment-open-items |  | proposed |
| e-men-valid-compounding | mentions | node:investigation-validation | concept:concept-compounding-advantage |  |  |
| e-mark-validexp-valid | marks | waypoint:wp-validation-experiment | node:investigation-validation |  | proposed |

<!-- === bind loose 2026-09 session work + forcing-function gap (proposed) === -->
| e-mark-plugindist-release011 | marks | waypoint:wp-plugin-release-0-0-11 | node:task-intellij-plugin-distribution |  | proposed |
| e-dec-usability-presrefresh | decomposes | node:goal-usability | node:task-presentation-refresh |  | accepted |
| e-dec-usability-linkedin0926 | decomposes | node:goal-usability | node:task-linkedin-announce-2026-09 |  | accepted |
| e-dec-account-bindingaudit | decomposes | node:goal-accountability | node:task-binding-gap-audit |  | accepted |
| e-not-bindingaudit-gap | notes | node:task-binding-gap-audit | noteworthy:nw-binding-enforcement-gap |  | proposed |
| e-men-bindingaudit-completeness | mentions | node:task-binding-gap-audit | concept:concept-provenance-completeness |  | proposed |

<!-- === restore-finding + edge-traversal task (accepted 2026-09-26) === -->
| e-not-valid-verbatimrestore | notes | node:investigation-validation | noteworthy:nw-native-restore-needs-verbatim |  |  |
| e-men-valid-memorylayer | mentions | node:investigation-validation | concept:concept-konspekt-vs-memory-layer |  |  |
| e-link-edgelayout-cas | links | node:task-edge-traversal-layout | node:task-atom-versioning-cas | 0.7 |  |
| e-link-edgelayout-enterprise | links | node:task-edge-traversal-layout | node:task-enterprise-persistence | 0.6 |  |
| e-link-edgelayout-serial | links | node:task-edge-traversal-layout | node:task-serialization-format | 0.6 |  |
| e-not-edgelayout-contention | notes | node:task-edge-traversal-layout | noteworthy:nw-edge-table-contends-under-cas |  |  |

<!-- === native-staleness finding (accepted 2026-09-27) === -->
| e-not-valid-restorestale | notes | node:investigation-validation | noteworthy:nw-native-restore-stale-on-live-state |  |  |

<!-- === validation writeup artifact (proposed 2026-09-27) === -->
| e-prod-valid-validation | produces | node:investigation-validation | artifact:artifact-validation |  | proposed |

<!-- === bounded-cost goal + edge-layout reparent + scale-hold finding (accepted 2026-09-27) === -->
| e-dec-boundedcost-edgelayout | decomposes | node:goal-bounded-cost | node:task-edge-traversal-layout |  |  |
| e-dec-boundedcost-subgraphfirst | decomposes | node:goal-bounded-cost | node:task-subgraph-first-retrieval |  |  |
| e-men-boundedcost-compounding | mentions | node:goal-bounded-cost | concept:concept-compounding-advantage |  |  |
| e-not-valid-scalehold | notes | node:investigation-validation | noteworthy:nw-scale-sufficient-hold-optimization |  |  |
| e-not-edgelayout-scalehold | notes | node:task-edge-traversal-layout | noteworthy:nw-scale-sufficient-hold-optimization |  |  |

<!-- === fleet git implementation changeset (six decisions + spec + migration; conversation fleet-implementation) === -->
| e-not-fleet-committer | notes | node:task-agent-fleet | noteworthy:nw-fleet-serialized-committer |  | accepted |
| e-not-fleet-rolesplit | notes | node:task-agent-fleet | noteworthy:nw-fleet-committer-role-split |  | accepted |
| e-not-fleet-durableref | notes | node:task-agent-fleet | noteworthy:nw-fleet-durable-proposed-ref |  | accepted |
| e-not-fleet-perproposal | notes | node:task-agent-fleet | noteworthy:nw-fleet-per-proposal-admission |  | accepted |
| e-not-fleet-sandboxegress | notes | node:task-agent-fleet | noteworthy:nw-fleet-sandbox-committer-egress |  | accepted |
| e-not-fleet-sha256 | notes | node:task-agent-fleet | noteworthy:nw-fleet-sha256-source-addressing |  | accepted |
| e-not-account-durableref | notes | node:goal-accountability | noteworthy:nw-fleet-durable-proposed-ref |  | proposed |
| e-not-review-perproposal | notes | node:task-review-ergonomics | noteworthy:nw-fleet-per-proposal-admission |  | proposed |
| e-not-provenance-sha256 | notes | node:task-provenance-model | noteworthy:nw-fleet-sha256-source-addressing |  | proposed |
| e-not-enterprise-sha256 | notes | node:task-enterprise-persistence | noteworthy:nw-fleet-sha256-source-addressing |  | proposed |
| e-men-fleet-caprov | mentions | node:task-agent-fleet | concept:concept-content-addressed-provenance |  | accepted |
| e-prod-fleet-spec | produces | node:task-agent-fleet | artifact:artifact-fleet-spec |  | accepted |
| e-dec-collab-sourcesmigration | decomposes | node:goal-collaboration | node:task-sources-sha256-migration |  | proposed |
| e-link-sourcesmigration-enterprise | links | node:task-sources-sha256-migration | node:task-enterprise-persistence | 0.6 | proposed |
| e-link-sourcesmigration-provenance | links | node:task-sources-sha256-migration | node:task-provenance-model | 0.6 | proposed |

<!-- === fleet-spec review: canonical-authoritative amendment (accepted 2026-09-28; conversation fleet-spec-review) === -->
| e-sup-canonauth-durableref | supersedes | noteworthy:nw-fleet-canonical-authoritative | noteworthy:nw-fleet-durable-proposed-ref |  |  |
| e-not-fleet-canonauth | notes | node:task-agent-fleet | noteworthy:nw-fleet-canonical-authoritative |  | accepted |

<!-- === first-turn binding gate + edit-boundary backstop (proposed 2026-09-29; conversation binding-firstturn-gate) === -->
| e-not-bindinggap-firstturn | notes | node:task-binding-gap-audit | noteworthy:nw-binding-firstturn-gate |  |  |

<!-- === fleet ingest generalization: MCP decoupling, commit-then-call, outbox write scope, retraction (proposed 2026-10-02; conversation fleet-design-ingest) === -->
| e-sup-ingest-serialized | supersedes | noteworthy:nw-fleet-committer-ingest-contract | noteworthy:nw-fleet-serialized-committer |  | proposed |
| e-not-fleet-ingest | notes | node:task-agent-fleet | noteworthy:nw-fleet-committer-ingest-contract |  | proposed |
| e-not-fleet-committhencall | notes | node:task-agent-fleet | noteworthy:nw-fleet-commit-then-call |  | proposed |
| e-not-fleet-outboxscope | notes | node:task-agent-fleet | noteworthy:nw-fleet-proposer-outbox-write-scope |  | proposed |
| e-not-fleet-retraction | notes | node:task-agent-fleet | noteworthy:nw-fleet-retraction-is-rejection |  | proposed |

<!-- === cursor-specific fleet implementation (proposed 2026-10-03; conversation fleet-cursor-impl) === -->
| e-dec-fleet-cursor | decomposes | node:task-agent-fleet | node:task-cursor-implementation |  | accepted |
| e-not-cursorimpl-beforepr | notes | node:task-cursor-implementation | noteworthy:nw-cursor-proposals-before-pr |  | proposed |

<!-- === transition log (proposed 2026-10-04; conversation transition-log-design) === -->
| e-dec-obs-transition-log | decomposes | node:goal-observability | node:task-transition-log |  | accepted |
| e-dec-obs-transition-log-writers | decomposes | node:goal-observability | node:task-transition-log-writers |  | accepted |
| e-link-transitionlog-writers | links | node:task-transition-log | node:task-transition-log-writers | 0.5 | accepted |
| e-link-transitionlog-analytics | links | node:task-transition-log | node:task-graph-analytics | 0.5 | proposed |
| e-link-transitionlog-signedaccepts | links | node:task-transition-log | node:task-signed-accepts | 0.5 | proposed |
| e-link-tlwriters-uiresolve | links | node:task-transition-log-writers | node:task-ui-resolve-action | 0.5 | accepted |
| e-link-tlwriters-intellij | links | node:task-transition-log-writers | node:task-intellij-plugin | 0.5 | accepted |
| e-not-transitionlog-updatedat | notes | node:task-transition-log | noteworthy:nw-updatedat-not-acceptance-time |  | accepted |
| e-not-transitionlog-appendonly | notes | node:task-transition-log | noteworthy:nw-transition-log-append-only |  | accepted |
| e-not-transitionlog-birthrows | notes | node:task-transition-log | noteworthy:nw-transition-log-birth-rows-required |  | accepted |
| e-not-transitionlog-backfill | notes | node:task-transition-log | noteworthy:nw-transition-log-backfill-from-history |  | accepted |
| e-not-transitionlog-observed | notes | node:task-transition-log | noteworthy:nw-transitions-observed-in-history |  | accepted |
| e-not-notifications-observed | notes | node:task-portable-notifications | noteworthy:nw-transitions-observed-in-history |  | accepted |
| e-prod-transitionlog-serialization | produces | node:task-transition-log | artifact:artifact-serialization |  | accepted |
| e-prod-transitionlog-schema | produces | node:task-transition-log | artifact:artifact-schema |  | accepted |
| e-prod-transitionlog-conformance | produces | node:task-transition-log | artifact:artifact-conformance-checker |  | proposed |
| e-sup-observed-reviewonly | supersedes | noteworthy:nw-transitions-observed-in-history | noteworthy:nw-review-is-the-only-field-that-transitions |  | accepted |

<!-- === accept authority and acceptance before work (2026-10-07; conversation accept-authority-design) === -->
| e-dec-account-acceptancebeforework | decomposes | node:goal-accountability | node:task-acceptance-before-work |  | accepted |
| e-not-authority-roles | notes | node:task-authority-mechanism | noteworthy:nw-acceptor-and-grantor-roles |  | proposed |
| e-not-authority-scope | notes | node:task-authority-mechanism | noteworthy:nw-grant-scope-is-entity-subgraph |  | proposed |
| e-not-authority-group | notes | node:task-authority-mechanism | noteworthy:nw-group-acceptance-any-member |  | proposed |
| e-not-authority-acceptancerule | notes | node:task-authority-mechanism | noteworthy:nw-acceptance-originates-from-acceptor |  | proposed |
| e-not-authority-by | notes | node:task-authority-mechanism | noteworthy:nw-by-records-writing-principal |  | proposed |
| e-men-authority-principal | mentions | node:task-authority-mechanism | concept:concept-principal |  | proposed |
| e-men-authority-grant | mentions | node:task-authority-mechanism | concept:concept-accept-grant |  | proposed |
| e-rel-principal-grant | relates | concept:concept-principal | concept:concept-accept-grant | 0.8 | proposed |
| e-sup-group-uniqueacceptor | supersedes | noteworthy:nw-group-acceptance-any-member | noteworthy:nw-unique-acceptor-per-atom |  | proposed |
| e-sup-scope-openpredicate | supersedes | noteworthy:nw-grant-scope-is-entity-subgraph | noteworthy:nw-accept-scope-open-predicate |  | proposed |
| e-prod-authority-spec | produces | node:task-authority-mechanism | artifact:artifact-authority-spec |  | proposed |
| e-prod-authority-review | produces | node:task-authority-mechanism | artifact:artifact-review |  | proposed |
| e-prod-authority-conformance | produces | node:task-authority-mechanism | artifact:artifact-conformance-checker |  | proposed |
| e-not-abw-precedes | notes | node:task-acceptance-before-work | noteworthy:nw-acceptance-precedes-binding |  | accepted |
| e-not-abw-basis | notes | node:task-acceptance-before-work | noteworthy:nw-basis-policy-field |  | accepted |
| e-not-abw-timestamp | notes | node:task-acceptance-before-work | noteworthy:nw-binding-rows-have-timestamp |  | accepted |
| e-prod-abw-review | produces | node:task-acceptance-before-work | artifact:artifact-review |  | proposed |
| e-prod-abw-conformance | produces | node:task-acceptance-before-work | artifact:artifact-conformance-checker |  | proposed |
| e-link-abw-bindingaudit | links | node:task-acceptance-before-work | node:task-binding-gap-audit | 0.5 | proposed |
| e-link-abw-authority | links | node:task-acceptance-before-work | node:task-authority-mechanism | 0.5 | proposed |
| e-dec-account-authoritywriters | decomposes | node:goal-accountability | node:task-authority-writers-intellij |  | accepted |
| e-link-authwriters-plugin | links | node:task-authority-writers-intellij | node:task-intellij-plugin | 0.5 | accepted |
| e-link-authwriters-authority | links | node:task-authority-writers-intellij | node:task-authority-mechanism | 0.5 | accepted |
| e-dec-usability-linkedin1007 | decomposes | node:goal-usability | node:task-linkedin-announce-2026-10 |  | accepted |
| e-dec-usability-authverbs | decomposes | node:goal-usability | node:investigation-authority-verb-usage |  | accepted |
| e-note-authverbs-prose | notes | node:investigation-authority-verb-usage | noteworthy:nw-acceptance-is-prose |  | accepted |
| e-dec-authverbs-spectask | decomposes | node:investigation-authority-verb-usage | node:task-spec-acceptance-prose |  | accepted |
| e-dec-authverbs-decktask | decomposes | node:investigation-authority-verb-usage | node:task-deck-acceptance-prose |  | accepted |
