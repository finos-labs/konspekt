# Changed code (engineer layer)

Append-only log binding each committed code change to the entity it was about,
one row per (entity, commit, file) in commit order (top to bottom is the
timeline). `timestamp` is the time the row was written; rows written before
2026-10-07 have none. `commit` is the git commit SHA;
`file` is a repo-relative path that commit touched for that entity. The diff
itself is not stored here — it already lives in git, recoverable by the SHA
(nw-derive-not-copy) — only the legible projection (which files) and the pointer
(which commit).

`commit` is an opaque revision token: no reader resolves it against a VCS, so the
format stays VCS-neutral (nw-commit-is-opaque-revision). Rows are written
push-based at commit time, so a row points at the commit made just before it (the
log trails commits by one). Bookkeeping commits — those touching only
`.konspekt/instance/**` or this log — are excluded; commits with no `<entity-id>:`
subject prefix are dropped.

Backfill note: these rows reconstruct the branch's task-mapped code commits in
commit order; the channel was not live during that work.

| entity | commit | file | timestamp |
|--------|--------|------|-----------|
| task-related-commands-view | ba45f45766b15b7074cd3d79fa2739657fdf89c7 | implementations/implementation-zero/app/server.mjs |
| task-related-commands-view | ba45f45766b15b7074cd3d79fa2739657fdf89c7 | implementations/implementation-zero/app/view/app.css |
| task-related-commands-view | ba45f45766b15b7074cd3d79fa2739657fdf89c7 | implementations/implementation-zero/app/view/app.js |
| task-related-commands-view | ba45f45766b15b7074cd3d79fa2739657fdf89c7 | implementations/intellij-plugin/app/gradle.properties |
| task-related-commands-view | ba45f45766b15b7074cd3d79fa2739657fdf89c7 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt |
| task-related-commands-view | ba45f45766b15b7074cd3d79fa2739657fdf89c7 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/ViewServer.kt |
| task-asr-adr-ui | 04198b0d108b1a5ad5d0a912e4ed5f7a580863af | implementations/implementation-zero/app/server.mjs |
| task-asr-adr-ui | 04198b0d108b1a5ad5d0a912e4ed5f7a580863af | implementations/implementation-zero/app/view/app.css |
| task-asr-adr-ui | 04198b0d108b1a5ad5d0a912e4ed5f7a580863af | implementations/implementation-zero/app/view/app.js |
| task-asr-adr-ui | 04198b0d108b1a5ad5d0a912e4ed5f7a580863af | implementations/implementation-zero/app/view/index.html |
| task-asr-adr-ui | 04198b0d108b1a5ad5d0a912e4ed5f7a580863af | implementations/intellij-plugin/app/gradle.properties |
| task-asr-adr-ui | 04198b0d108b1a5ad5d0a912e4ed5f7a580863af | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt |
| task-asr-adr-ui | 04198b0d108b1a5ad5d0a912e4ed5f7a580863af | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/ViewServer.kt |
| task-plugin-pop-mode | 280639ef9ea418e25c54b379c2d0b183b6062969 | implementations/intellij-plugin/app/gradle.properties |
| task-plugin-pop-mode | 280639ef9ea418e25c54b379c2d0b183b6062969 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/KonspektToolWindowFactory.kt |
| task-plugin-pop-mode | 4d3239070a5c2d65abb34810b39568559eacc6b1 | implementations/intellij-plugin/app/gradle.properties |
| task-plugin-pop-mode | 4d3239070a5c2d65abb34810b39568559eacc6b1 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/KonspektToolWindowFactory.kt |
| task-plugin-pop-mode | e81c602b6f2d9f29476d90cad9cfc8afe4135544 | implementations/intellij-plugin/app/gradle.properties |
| task-plugin-pop-mode | e81c602b6f2d9f29476d90cad9cfc8afe4135544 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/KonspektToolWindowFactory.kt |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | spec/personas/engineer/registry.mjs |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | lib/conformance.mjs |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | spec/personas/engineer/SPEC.md |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | spec/architecture/SERIALIZATION.md |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | implementations/implementation-zero/app/server.mjs |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | implementations/implementation-zero/app/view/app.js |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | implementations/implementation-zero/app/view/app.css |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | implementations/intellij-plugin/app/gradle.properties |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt |
| task-record-code-changes | 7116cb67025c328c2ab19c279f4c51ec0061972a | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/ViewServer.kt |
| task-ui-simple-actions | 774adc93e5469544d4eb231af5d8e1e4c360dd67 | implementations/implementation-zero/app/server.mjs |
| task-ui-simple-actions | 774adc93e5469544d4eb231af5d8e1e4c360dd67 | implementations/implementation-zero/app/view/app.css |
| task-ui-simple-actions | 774adc93e5469544d4eb231af5d8e1e4c360dd67 | implementations/implementation-zero/app/view/app.js |
| task-ui-simple-actions | 774adc93e5469544d4eb231af5d8e1e4c360dd67 | implementations/intellij-plugin/app/gradle.properties |
| task-ui-simple-actions | 774adc93e5469544d4eb231af5d8e1e4c360dd67 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt |
| task-ui-simple-actions | 774adc93e5469544d4eb231af5d8e1e4c360dd67 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/ViewServer.kt |
| task-ui-simple-actions | 010e30d64bb6435bc07c8d6e662598612a7a9337 | implementations/implementation-zero/app/view/index.html |
| task-ui-simple-actions | c0e0b24206aaa512d7699bc335f9845b9a56dee6 | implementations/implementation-zero/app/view/app.js |
| task-ui-simple-actions | c0e0b24206aaa512d7699bc335f9845b9a56dee6 | implementations/implementation-zero/app/view/app.css |
| task-ui-simple-actions | c0e0b24206aaa512d7699bc335f9845b9a56dee6 | implementations/intellij-plugin/app/gradle.properties |
| task-ui-resolve-action | 48bcc4df76f2d09a5f594f509fde97adc482e4ba | implementations/implementation-zero/app/server.mjs |
| task-ui-resolve-action | 48bcc4df76f2d09a5f594f509fde97adc482e4ba | implementations/implementation-zero/app/view/app.js |
| task-ui-resolve-action | 48bcc4df76f2d09a5f594f509fde97adc482e4ba | implementations/implementation-zero/app/test/server.test.mjs |
| task-ui-resolve-action | 48bcc4df76f2d09a5f594f509fde97adc482e4ba | implementations/intellij-plugin/app/README.md |
| task-ui-resolve-action | 48bcc4df76f2d09a5f594f509fde97adc482e4ba | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt |
| task-ui-resolve-action | 48bcc4df76f2d09a5f594f509fde97adc482e4ba | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/ViewServer.kt |
| task-binding-gap-audit | bd2623854300df7f84c092f4e5bfb4c28518a050 | tools/binding-audit.mjs |
| task-binding-gap-audit | bd2623854300df7f84c092f4e5bfb4c28518a050 | .konspekt/binding-audit.json |
| task-binding-gap-audit | bd2623854300df7f84c092f4e5bfb4c28518a050 | .github/workflows/konspekt-binding-audit.yml |
| task-binding-gap-audit | bd2623854300df7f84c092f4e5bfb4c28518a050 | spec/personas/engineer/AGENTS.md |
| task-binding-gap-audit | bd2623854300df7f84c092f4e5bfb4c28518a050 | .claude/skills/konspekt-atom-readiness/SKILL.md |
| task-linkedin-announce-2026-09 | ff1b2b86c668726ba6d2f075b28334b967c0cd17 | docs/announcements/linkedin/README.md |
| task-linkedin-announce-2026-09 | ff1b2b86c668726ba6d2f075b28334b967c0cd17 | docs/announcements/linkedin/post_2026-09-26/images/CAPTURE.md |
| task-linkedin-announce-2026-09 | ff1b2b86c668726ba6d2f075b28334b967c0cd17 | docs/announcements/linkedin/post_2026-09-26/post.md |
| task-linkedin-announce-2026-09 | ff1b2b86c668726ba6d2f075b28334b967c0cd17 | docs/announcements/linkedin/post_2026-09-27/article.html |
| task-linkedin-announce-2026-09 | ff1b2b86c668726ba6d2f075b28334b967c0cd17 | docs/announcements/linkedin/post_2026-09-27/article.md |
| task-linkedin-announce-2026-09 | ff1b2b86c668726ba6d2f075b28334b967c0cd17 | docs/announcements/linkedin/post_2026-09-27/images/invariants.png |
| task-linkedin-announce-2026-09 | ff1b2b86c668726ba6d2f075b28334b967c0cd17 | docs/announcements/linkedin/post_2026-09-27/post.md |
| task-edge-traversal-layout | 869f0bf28bd818708674fa20ea84a63257935c04 | ROADMAP.md |
| task-presentation-refresh | 4fbd9c8016ced9dbbe886a6c8f2d411159bd6e89 | docs/index.html |
| task-linkedin-announce-2026-09 | 1ecad2645ee531eb7179bc58b0480f55f2e1af8e | docs/announcements/linkedin/post_2026-09-26/post.md |
| task-linkedin-announce-2026-09 | 1ecad2645ee531eb7179bc58b0480f55f2e1af8e | docs/announcements/linkedin/post_2026-09-26/images/CAPTURE.md |
| task-linkedin-announce-2026-09 | 1ecad2645ee531eb7179bc58b0480f55f2e1af8e | docs/announcements/linkedin/post_2026-09-26/carousel.pdf |
| task-linkedin-announce-2026-09 | 1ecad2645ee531eb7179bc58b0480f55f2e1af8e | docs/announcements/linkedin/post_2026-09-26/images/plugin_tool_button.png |
| task-linkedin-announce-2026-09 | 1ecad2645ee531eb7179bc58b0480f55f2e1af8e | docs/announcements/linkedin/post_2026-09-26/images/plugin_popup_mode.png |
| task-linkedin-announce-2026-09 | 1ecad2645ee531eb7179bc58b0480f55f2e1af8e | docs/announcements/linkedin/post_2026-09-26/images/task_write_commands.png |
| task-linkedin-announce-2026-09 | 1ecad2645ee531eb7179bc58b0480f55f2e1af8e | docs/announcements/linkedin/post_2026-09-26/images/files_changed.png |
| task-atom-vocabulary | b90b2d82dd45fa0be84bf61b31bb5224b03c5b43 | ROADMAP.md |
| task-presentation-refresh | b90b2d82dd45fa0be84bf61b31bb5224b03c5b43 | ROADMAP.md |
| task-binding-operating-behavior | d45926ef45acc417aacebfc18c6e2429fa94b48e | .claude/hooks/load-mandatory-skills.sh |
| task-adoption-path | b6698c594a79cfedc6c7e9c873df45fc5e094112 | setup/WEBMOBILE_SEED.md |
| task-presentation-refresh | 2660a08e72e71d32e4d6853c176bf28ebfb3e19f | docs/index.html |
| task-presentation-refresh | 7f0fa63b055b30c1895430dbb5ffd19950bbaf24 | docs/index.html |
| investigation-validation | 03c1a8c4a1f30ded46a836d9dcad41d38d4a4c58 | VALIDATION.md |
| task-presentation-refresh | 03c1a8c4a1f30ded46a836d9dcad41d38d4a4c58 | docs/index.html |
| investigation-validation | b6187edec5f1f9456a0cc6562f4580d00d0e9035 | VALIDATION.md |
| goal-bounded-cost | c559ee7181d2893a8fbe06b90763b047425e6993 | ROADMAP.md |
| task-agent-fleet | 03d27b157746fac106ae39e10e4f8798b4ebc938 | docs/design/fleet-spec.md |
| task-presentation-refresh | c7bf98761555f7dd958666c73c14518ef6853d61 | docs/index.html |
| task-presentation-refresh | 8ffc64fe9a3fbc55a9bac32ad2981e76a28b556f | docs/index.html |
| artifact-fleet-spec | 933985e010d25d20328285c861a987003440b4a4 | docs/design/fleet-spec.md |
| task-binding-gap-audit | 01eb116c2b9ef786a51b62dbb15c94bbd76028b6 | .konspekt/OPERATING.md |
| task-binding-gap-audit | 01eb116c2b9ef786a51b62dbb15c94bbd76028b6 | setup/WEBMOBILE_SEED.md |
| task-binding-gap-audit | 01eb116c2b9ef786a51b62dbb15c94bbd76028b6 | .claude/hooks/require-binding.sh |
| task-binding-gap-audit | 01eb116c2b9ef786a51b62dbb15c94bbd76028b6 | .claude/settings.json |
| task-binding-gap-audit | 01eb116c2b9ef786a51b62dbb15c94bbd76028b6 | .gitignore |
| task-binding-gap-audit | 01eb116c2b9ef786a51b62dbb15c94bbd76028b6 | ROADMAP.md |
| task-linkedin-announce-2026-09 | c501ddddce709be1429d81405359d85410d548b5 | docs/announcements/linkedin/post_2026-09-30/article.md |
| task-linkedin-announce-2026-09 | c501ddddce709be1429d81405359d85410d548b5 | docs/announcements/linkedin/post_2026-09-30/article.html |
| task-linkedin-announce-2026-09 | c501ddddce709be1429d81405359d85410d548b5 | docs/announcements/linkedin/post_2026-09-30/post.md |
| task-linkedin-announce-2026-09 | c501ddddce709be1429d81405359d85410d548b5 | docs/announcements/linkedin/post_2026-09-26/images/CAPTURE.md |
| task-linkedin-announce-2026-09 | c988a1ae2039c3c7018fd6e3b26cb2259a86ad0e | docs/announcements/linkedin/post_2026-09-30/article.md |
| task-linkedin-announce-2026-09 | c988a1ae2039c3c7018fd6e3b26cb2259a86ad0e | docs/announcements/linkedin/post_2026-09-30/article.html |
| task-linkedin-announce-2026-09 | c988a1ae2039c3c7018fd6e3b26cb2259a86ad0e | docs/announcements/linkedin/post_2026-09-30/post.md |
| task-agent-fleet | ce28d20132eaecabbd5ffee4c77a668e1cf55302 | docs/visuals/posters/konspekt-fleet-poster.html |
| task-cursor-implementation | 9cd74886219cd48d9509e7db797a040705a0a3fa | docs/visuals/posters/konspekt-fleet-dual-channel-poster.html |
| task-transition-log | 3832f492761b8a55513e269d9ae0eac533429271 | .claude/skills/konspekt-atom-readiness/SKILL.md |
| task-transition-log | 3832f492761b8a55513e269d9ae0eac533429271 | ROADMAP.md |
| task-transition-log | 3832f492761b8a55513e269d9ae0eac533429271 | lib/conformance.mjs |
| task-transition-log | 3832f492761b8a55513e269d9ae0eac533429271 | lib/validate.mjs |
| task-transition-log | 3832f492761b8a55513e269d9ae0eac533429271 | spec/architecture/SERIALIZATION.md |
| task-transition-log | 3832f492761b8a55513e269d9ae0eac533429271 | spec/data-model/SPEC.md |
| task-transition-log | 3832f492761b8a55513e269d9ae0eac533429271 | spec/data-model/schema.ts |
| task-transition-log | 3832f492761b8a55513e269d9ae0eac533429271 | test/conformance-transitions.test.mjs |
| task-transition-log-writers | 1b5ea14b39373b194d543bbfa57507fbf5de3650 | implementations/implementation-zero/app/server.mjs |
| task-transition-log-writers | 1b5ea14b39373b194d543bbfa57507fbf5de3650 | implementations/implementation-zero/app/test/server.test.mjs |
| task-transition-log-writers | 1b5ea14b39373b194d543bbfa57507fbf5de3650 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt |
| task-transition-log | 1b5ea14b39373b194d543bbfa57507fbf5de3650 | setup/init.mjs |
| task-transition-log | 1b5ea14b39373b194d543bbfa57507fbf5de3650 | setup/templates/transitions.md |
| task-transition-log | 1b5ea14b39373b194d543bbfa57507fbf5de3650 | test/setup-init.test.mjs |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | .claude/hooks/require-binding.sh | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | .claude/skills/konspekt-atom-readiness/SKILL.md | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | .claude/skills/konspekt-atom-readiness/SKILL.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | .konspekt/OPERATING.md | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | .konspekt/OPERATING.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | ROADMAP.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | implementations/implementation-zero/app/server.mjs | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | implementations/implementation-zero/app/test/server.test.mjs | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | lib/authority.mjs | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | lib/conformance.mjs | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | lib/conformance.mjs | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | setup/templates/transitions.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/architecture/AUTHORITY.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/architecture/BINDING.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/architecture/README.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/architecture/REVIEW.md | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/architecture/REVIEW.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/architecture/SERIALIZATION.md | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/architecture/SERIALIZATION.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/data-model/SPEC.md | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/data-model/SPEC.md | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/data-model/schema.ts | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/data-model/schema.ts | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/personas/engineer/AGENTS.md | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/personas/engineer/SPEC.md | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | spec/personas/engineer/registry.mjs | 2026-10-07T13:09:01Z |
| task-authority-mechanism | 87ba592409563050bdf20feeeba1f1964a4f51b3 | test/conformance-authority.test.mjs | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | test/conformance-authority.test.mjs | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | test/require-binding-hook.test.mjs | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 87ba592409563050bdf20feeeba1f1964a4f51b3 | tools/binding-audit.mjs | 2026-10-07T13:09:01Z |
| task-acceptance-before-work | 2a9785257f567c66b6cec6739a314231c1a3232a | .konspekt/binding-audit.json | 2026-10-07T16:13:12Z |
| task-acceptance-before-work | 2a9785257f567c66b6cec6739a314231c1a3232a | ROADMAP.md | 2026-10-07T16:13:12Z |
| task-authority-mechanism | 75f11de5de5fb74014ce71c788567ab7eafe835b | .konspekt/OPERATING.md | 2026-10-07T16:13:12Z |
| task-authority-mechanism | 75f11de5de5fb74014ce71c788567ab7eafe835b | docs/announcements/linkedin/README.md | 2026-10-07T16:13:12Z |
| task-transition-log-writers | 5c3928ff68964b099f6b6eeaca76f2f02da6868f | implementations/implementation-zero/app/projections.mjs | 2026-10-07T16:13:12Z |
| task-transition-log-writers | 5c3928ff68964b099f6b6eeaca76f2f02da6868f | implementations/implementation-zero/app/server.mjs | 2026-10-07T16:13:12Z |
| task-transition-log-writers | 5c3928ff68964b099f6b6eeaca76f2f02da6868f | implementations/implementation-zero/app/test/server.test.mjs | 2026-10-07T16:13:12Z |
| task-transition-log-writers | 5c3928ff68964b099f6b6eeaca76f2f02da6868f | implementations/implementation-zero/app/view/app.css | 2026-10-07T16:13:12Z |
| task-transition-log-writers | 5c3928ff68964b099f6b6eeaca76f2f02da6868f | implementations/implementation-zero/app/view/app.js | 2026-10-07T16:13:12Z |
| task-transition-log-writers | 5c3928ff68964b099f6b6eeaca76f2f02da6868f | implementations/implementation-zero/app/view/index.html | 2026-10-07T16:13:12Z |
| task-authority-writers-intellij | f8dd2d24e716a9ff1f59865b49509704b8d1b593 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt | 2026-10-07T16:13:12Z |
| task-authority-writers-intellij | f8dd2d24e716a9ff1f59865b49509704b8d1b593 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/ViewServer.kt | 2026-10-07T16:13:12Z |
| task-presentation-refresh | 40a47d5659f6cf724b061b24180fb35b8b7c203b | docs/index.html | 2026-10-07T16:13:12Z |
| task-spec-acceptance-prose | 6750f9de900a108f5e85ca22ea09d2b87e99343f | ROADMAP.md | 2026-10-07T17:55:00Z |
| task-spec-acceptance-prose | 95953f956ca3f3e7b57be927932527aa58b57260 | spec/data-model/SPEC.md | 2026-10-07T17:55:00Z |
