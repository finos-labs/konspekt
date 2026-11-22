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
| task-deck-acceptance-prose | cd44f8f7a2e6bb663d5be6090588d6cabf878a33 | ROADMAP.md | 2026-10-07T17:58:00Z |
| task-deck-acceptance-prose | 4d8831a9fd298adb295f5ba9de193b8b3ce7b498 | docs/index.html | 2026-10-07T17:58:00Z |
| task-linkedin-announce-2026-10 | 0714bc822345c5462dece3df5d4e11e0c6ce881d | docs/announcements/linkedin/README.md | 2026-10-07T18:05:00Z |
| task-linkedin-announce-2026-10 | 0714bc822345c5462dece3df5d4e11e0c6ce881d | docs/announcements/linkedin/post_2026-10-07/post.md | 2026-10-07T18:05:00Z |
| task-linkedin-announce-2026-10 | 0714bc822345c5462dece3df5d4e11e0c6ce881d | docs/announcements/linkedin/post_2026-10-07/article.md | 2026-10-07T18:05:00Z |
| task-linkedin-announce-2026-10 | 0714bc822345c5462dece3df5d4e11e0c6ce881d | docs/announcements/linkedin/post_2026-10-07/article.html | 2026-10-07T18:05:00Z |
| task-linkedin-announce-2026-10 | 0714bc822345c5462dece3df5d4e11e0c6ce881d | docs/announcements/linkedin/post_2026-10-07/images/acceptance.png | 2026-10-07T18:05:00Z |
| task-linkedin-announce-2026-10 | 0714bc822345c5462dece3df5d4e11e0c6ce881d | docs/announcements/linkedin/post_2026-10-07/images/CAPTURE.md | 2026-10-07T18:05:00Z |
| task-authority-writers-intellij | 8687dc1349be6630199160156d2df64f5a4c0550 | implementations/intellij-plugin/app/README.md | 2026-10-08T00:02:00Z |
| task-authority-mechanism | b876bf1df2692dd4359809936973b2e9d7f89ab5 | implementations/implementation-zero/app/README.md | 2026-10-08T00:02:00Z |
| task-intellij-plugin-distribution | 532825773e01ab98d5256499326e5b2ff763a7b3 | implementations/intellij-plugin/app/gradle.properties | 2026-10-08T00:02:00Z |
| task-intellij-plugin-distribution | 532825773e01ab98d5256499326e5b2ff763a7b3 | implementations/intellij-plugin/app/README.md | 2026-10-08T00:02:00Z |
| task-fleet-worktree-committer | a31159b336f7bfed3baba7fc744298a924270a50 | ROADMAP.md | 2026-10-10T13:00:18Z |
| task-fleet-worktree-committer | f7fe89c0f8baeeb86ca9d86f8f51657478c32ef7 | implementations/fleet/worktree/app/payload.mjs | 2026-10-10T13:25:33Z |
| task-fleet-worktree-committer | f26532ab424398c40f65e114546e9e45edcac6ad | implementations/fleet/worktree/app/worktrees.mjs | 2026-10-10T13:27:49Z |
| task-fleet-worktree-committer | 0c6af440c2e79c9c89f7fe24465c766b4c63d9a7 | implementations/fleet/worktree/app/outbox.mjs | 2026-10-10T13:30:47Z |
| task-fleet-worktree-committer | 5cf9a8fd4b25024cd94cffaa432db91df6b6ad4c | implementations/fleet/worktree/app/committer.mjs | 2026-10-10T13:45:13Z |
| task-fleet-worktree-committer | 0dd67e5a0a68bf1b53eeb2778bcb1d2cb208f47d | implementations/fleet/worktree/app/fold.mjs | 2026-10-10T15:32:30Z |
| task-fleet-worktree-committer | 445670d2e80d477503a6931f8051f3d51d5932dd | implementations/fleet/worktree/app/proposed-ref.mjs | 2026-10-10T15:36:50Z |
| task-fleet-worktree-committer | 0b1ca0cf16eba4d3ffda49559372701f98548b6d | implementations/fleet/worktree/app/bless.mjs | 2026-10-10T15:41:36Z |
| task-fleet-worktree-committer | 8abb3797a9c1548fae79c901675caee4b17c8b89 | implementations/fleet/worktree/app/cli.mjs | 2026-10-10T15:57:45Z |
| task-fleet-worktree-committer | b35fbcb48d4cf7c3aaa29d3e3f49f5e7d786f4c2 | implementations/fleet/worktree/app/cli.mjs | 2026-10-10T16:03:05Z |
| task-binding-gap-audit | b73f55910a62ae7ec0c94893406e19cb3fe764aa | .konspekt/OPERATING.md | 2026-10-10T16:18:09Z |
| task-vendor-neutral-interop | c9701f936d43681a13aeedcb2049bf5b877484bf | ROADMAP.md | 2026-10-10T17:16:58Z |
| task-fleet-worktree-committer | badb47df614f498971937508266fca8b6dd90a63 | .gitignore | 2026-10-10T22:16:51Z |
| task-fleet-worktree-committer | badb47df614f498971937508266fca8b6dd90a63 | docs/design/fleet-spec.md | 2026-10-10T22:16:51Z |
| task-fleet-worktree-committer | ce5c9ff21ab083c4b6d54c51c3aadb0f17dd0a98 | implementations/fleet/worktree/app/README.md | 2026-10-11T01:28:44Z |
| task-agent-fleet | c83c4c08ad5dd95d69f3da55995b33dc4ec39192 | docs/design/fleet-protocol.md | 2026-10-11T15:29:56Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/README.md | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/bless.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/cli.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/committer.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/fold.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/git.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/order.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/outbox.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/package.json | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/payload.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/proposed-ref.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/_fixtures.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/bless.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/cli.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/committer.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/fold.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/order.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/outbox.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/payload.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/proposed-ref.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/verify.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/test/worktrees.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/verify.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/app/worktrees.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/docs/ADOPTING.md | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/docs/DESIGN.md | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/README.md | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/bless.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/cli.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/committer.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/fold.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/git.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/order.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/outbox.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/package.json | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/payload.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/proposed-ref.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/_fixtures.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/bless.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/cli.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/committer.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/fold.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/order.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/outbox.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/payload.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/proposed-ref.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/verify.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/test/worktrees.test.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/verify.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/app/worktrees.mjs | 2026-10-12T15:06:34Z |
| task-agent-fleet | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | implementations/fleet/worktree/docs/DESIGN.md | 2026-10-12T15:06:34Z |
| task-fleet-config-driven-setup | 10589961311a065e6f042389535a48553bb28a82 | ROADMAP.md | 2026-10-13T01:58:47Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | .github/workflows/konspekt-notify.yml | 2026-10-14T16:46:17Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | .konspekt/lib/konspekt-notify.mjs | 2026-10-14T16:46:17Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | setup/README.md | 2026-10-14T16:46:17Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | setup/components/claude-code/manifest.yml | 2026-10-14T16:46:17Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | setup/components/conformance/manifest.yml | 2026-10-14T16:46:17Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | setup/components/conformance/workflow.yml | 2026-10-14T16:46:17Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | setup/components/notify/konspekt-notify.mjs | 2026-10-14T16:46:17Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | setup/components/notify/manifest.yml | 2026-10-14T16:46:17Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | setup/components/notify/workflow.yml | 2026-10-14T16:46:17Z |
| task-adoption-path | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | setup/init.mjs | 2026-10-14T16:46:17Z |
| task-adoption-path | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | setup/init.mjs | 2026-10-14T23:12:42Z |
| task-adoption-path | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | setup/README.md | 2026-10-14T23:12:42Z |
| task-adoption-path | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | setup/WEBMOBILE_SEED.md | 2026-10-14T23:12:42Z |
| task-adoption-path | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | setup/templates/OPERATING.md | 2026-10-14T23:12:42Z |
| task-adoption-path | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | setup/templates/AGENTS-stanza.md | 2026-10-14T23:12:42Z |
| task-adoption-path | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | setup/components/notify/konspekt-notify.mjs | 2026-10-14T23:12:42Z |
| task-adoption-path | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | .konspekt/lib/konspekt-notify.mjs | 2026-10-14T23:12:42Z |
| task-adoption-path | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | spec/architecture/SCHEMA-RECONCILIATION.md | 2026-10-14T23:12:42Z |
| task-adoption-path | 9be386b3c8a2b37afd42e636e4bd1bc264a4c76a | setup/init.mjs | 2026-10-14T23:34:56Z |
| task-adoption-path | 9be386b3c8a2b37afd42e636e4bd1bc264a4c76a | test/setup-init.test.mjs | 2026-10-14T23:34:56Z |
| task-adoption-path | 9be386b3c8a2b37afd42e636e4bd1bc264a4c76a | setup/README.md | 2026-10-14T23:34:56Z |
| task-fleet-worktree-committer | 0ac3d9a9dc094efd30cd9a35f93cccf60e2714e4 | .claude/skills/fleet-committer/SKILL.md | 2026-10-22T00:28:11Z |
| task-agent-fleet | 8816ff7686356101a8774913f94c37d77b85bddc | .claude/skills/fleet-proposer-common/SKILL.md | 2026-10-22T00:28:11Z |
| task-agent-fleet | 8816ff7686356101a8774913f94c37d77b85bddc | .claude/skills/fleet-presentation-writer/SKILL.md | 2026-10-22T00:28:11Z |
| task-agent-fleet | 8816ff7686356101a8774913f94c37d77b85bddc | .claude/skills/fleet-spec-writer/SKILL.md | 2026-10-22T00:28:11Z |
| task-agent-fleet | 8816ff7686356101a8774913f94c37d77b85bddc | .claude/skills/fleet-skill-builder/SKILL.md | 2026-10-22T00:28:11Z |
| task-fleet-config-driven-setup | 97358eec1b6602f77bd5c950e787b435b2ae83e4 | implementations/fleet/docs/instructions.md | 2026-10-22T00:28:11Z |
| task-agent-fleet | d1715a0ca76183c2df5c614f7ea298140c442a21 | .claude/skills/fleet-proposer-common/SKILL.md | 2026-10-22T01:45:22Z |
| task-fleet-worktree-committer | e2941dfdb2a71aadb52bbc98b00d041d5a272413 | .claude/skills/fleet-committer/SKILL.md | 2026-10-22T01:45:22Z |
| task-fleet-worktree-committer | 26d272f49f402647d3d44751e141cc687bab064f | docs/design/fleet-recovery.md | 2026-10-22T02:21:12Z |
| task-agent-fleet | 532eb07d49fc37fc14397f3351beb934561331cc | .claude/skills/fleet-proposer-common/SKILL.md | 2026-10-22T17:12:00Z |
| task-fleet-config-driven-setup | 2518cd1d60b418c4ed1ecd0678e2e9ba14423d27 | implementations/fleet/docs/instructions.md | 2026-10-22T17:08:11Z |
| task-fleet-config-driven-setup | bd0d25071505522a003f05c44f9fba1d9c6b4583 | implementations/fleet/docs/instructions.md | 2026-10-22T17:16:00Z |
| task-agent-fleet | c541ee158f4efeff6c6eb3ada6929136336cfd07 | .claude/skills/fleet-proposer-common/SKILL.md | 2026-10-22T17:24:00Z |
| task-agent-fleet | c541ee158f4efeff6c6eb3ada6929136336cfd07 | .claude/skills/fleet-spec-writer/SKILL.md | 2026-10-22T17:24:00Z |
| task-agent-fleet | c541ee158f4efeff6c6eb3ada6929136336cfd07 | .claude/skills/fleet-presentation-writer/SKILL.md | 2026-10-22T17:24:00Z |
| task-agent-fleet | c541ee158f4efeff6c6eb3ada6929136336cfd07 | .claude/skills/fleet-skill-builder/SKILL.md | 2026-10-22T17:24:00Z |
| task-agent-fleet | e6fe2e070ed7c4f10d21c8eb94c98ccc5412fa50 | docs/design/fleet-confidence-scale.md | 2026-10-22T17:30:00Z |
| task-fleet-worktree-committer | 4d27ffe17f127d03facc703a097a8651292a8b0f | docs/design/fleet-outbox-lifecycle.md | 2026-10-22T17:31:00Z |
| task-fleet-worktree-committer | c3d7bd3618e94e4785f0027a8cc38285b42c93ff | ROADMAP.md | 2026-10-22T17:35:00Z |
| task-fleet-fold-idempotent-impl | 76d4e25cb11bbf205259aa188d8e2177e32390c4 | implementations/fleet/app/fold.mjs | 2026-10-22T17:45:00Z |
| task-fleet-fold-idempotent-impl | 76d4e25cb11bbf205259aa188d8e2177e32390c4 | implementations/fleet/app/committer.mjs | 2026-10-22T17:45:00Z |
| task-fleet-fold-idempotent-impl | 76d4e25cb11bbf205259aa188d8e2177e32390c4 | implementations/fleet/app/cli.mjs | 2026-10-22T17:45:00Z |
| task-fleet-fold-idempotent-impl | 76d4e25cb11bbf205259aa188d8e2177e32390c4 | implementations/fleet/app/test/fold.test.mjs | 2026-10-22T17:45:00Z |
| task-fleet-fold-idempotent-impl | 76d4e25cb11bbf205259aa188d8e2177e32390c4 | docs/design/fleet-outbox-lifecycle.md | 2026-10-22T17:45:00Z |
| task-fleet-fold-idempotent-impl | bb2162a88a84e460d16a04227f2e8a34c8edec6d | ROADMAP.md | 2026-10-22T17:47:00Z |
| task-fleet-config-driven-setup | f62a251aabe41beb2123e420172ea0167424d487 | implementations/fleet/app/worktrees.mjs | 2026-10-22T18:05:00Z |
| task-fleet-config-driven-setup | f62a251aabe41beb2123e420172ea0167424d487 | implementations/fleet/app/cli.mjs | 2026-10-22T18:05:00Z |
| task-fleet-config-driven-setup | f62a251aabe41beb2123e420172ea0167424d487 | implementations/fleet/app/test/config.test.mjs | 2026-10-22T18:05:00Z |
| task-fleet-config-driven-setup | f62a251aabe41beb2123e420172ea0167424d487 | implementations/fleet/app/README.md | 2026-10-22T18:05:00Z |
| task-fleet-config-driven-setup | f62a251aabe41beb2123e420172ea0167424d487 | implementations/fleet/docs/instructions.md | 2026-10-22T18:05:00Z |
| task-fleet-config-driven-setup | f62a251aabe41beb2123e420172ea0167424d487 | .konspekt/fleet/config/fleet.json | 2026-10-22T18:05:00Z |
| task-fleet-config-driven-setup | 3579593fdcad47ccc3f8393fd1ac99c42322786b | ROADMAP.md | 2026-10-22T18:09:00Z |
| task-fleet-worktree-committer | d2a9b07e0c03c96724cb8a4b16f2bc31f1ade3ba | implementations/fleet/app/claims.mjs | 2026-10-22T18:20:00Z |
| task-fleet-worktree-committer | d2a9b07e0c03c96724cb8a4b16f2bc31f1ade3ba | implementations/fleet/app/cli.mjs | 2026-10-22T18:20:00Z |
| task-fleet-worktree-committer | d2a9b07e0c03c96724cb8a4b16f2bc31f1ade3ba | implementations/fleet/app/test/claims.test.mjs | 2026-10-22T18:20:00Z |
| task-fleet-worktree-committer | 6ff3aade9056ae53da991c1ad372100581b141bb | implementations/fleet/app/claims.mjs | 2026-10-22T18:30:00Z |
| task-fleet-worktree-committer | 6ff3aade9056ae53da991c1ad372100581b141bb | implementations/fleet/app/cli.mjs | 2026-10-22T18:30:00Z |
| task-fleet-worktree-committer | 6ff3aade9056ae53da991c1ad372100581b141bb | implementations/fleet/app/test/claims.test.mjs | 2026-10-22T18:30:00Z |
| task-fleet-worktree-committer | 6ff3aade9056ae53da991c1ad372100581b141bb | implementations/fleet/app/README.md | 2026-10-22T18:30:00Z |
| task-fleet-worktree-committer | f65db5f914b8095118103040d2c5bd079c966735 | implementations/fleet/app/review-assistant.mjs | 2026-10-22T18:40:00Z |
| task-fleet-worktree-committer | f65db5f914b8095118103040d2c5bd079c966735 | implementations/fleet/app/cli.mjs | 2026-10-22T18:40:00Z |
| task-fleet-worktree-committer | f65db5f914b8095118103040d2c5bd079c966735 | implementations/fleet/app/test/review-assistant.test.mjs | 2026-10-22T18:40:00Z |
| task-fleet-worktree-committer | f65db5f914b8095118103040d2c5bd079c966735 | implementations/fleet/app/README.md | 2026-10-22T18:40:00Z |
| task-fleet-worktree-committer | 0f6db1a6e6e9f07ed777174a85f878d4a49e1696 | ROADMAP.md | 2026-10-22T18:46:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | tools/sync-agents.mjs | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .konspekt/OPERATING.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .konspekt/agents/skills/fleet-proposer-common/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .konspekt/agents/skills/fleet-presentation-writer/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .konspekt/agents/skills/fleet-spec-writer/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .konspekt/agents/skills/fleet-skill-builder/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .claude/skills/fleet-committer/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .claude/skills/fleet-proposer-common/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .claude/skills/fleet-presentation-writer/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .claude/skills/fleet-spec-writer/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | c2a059bf935f64eb121a2601a37b9479538a3d80 | .claude/skills/fleet-skill-builder/SKILL.md | 2026-10-22T18:55:00Z |
| task-vendor-neutral-interop | fa9b88bc381b3e450cea9d1c89e75296fa50da35 | ROADMAP.md | 2026-10-22T19:01:00Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | .claude/hooks/load-mandatory-skills.sh | 2026-10-15T00:57:20Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | .claude/hooks/require-binding.sh | 2026-10-15T00:57:20Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | setup/README.md | 2026-10-15T00:57:20Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | setup/init.mjs | 2026-10-15T00:57:20Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | setup/templates/OPERATING.md | 2026-10-15T00:57:20Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | setup/templates/changes-changed.md | 2026-10-15T00:57:20Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | setup/templates/commands-executed.md | 2026-10-15T00:57:20Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | setup/templates/project.md | 2026-10-15T00:57:20Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | test/load-mandatory-skills-hook.test.mjs | 2026-10-15T00:57:20Z |
| task-adoption-path | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | test/setup-init.test.mjs | 2026-10-15T00:57:20Z |
| task-adoption-path | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | lib/conformance.mjs | 2026-10-15T01:07:15Z |
| task-adoption-path | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | setup/README.md | 2026-10-15T01:07:15Z |
| task-adoption-path | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | setup/components/conformance/binding-audit-workflow.yml | 2026-10-15T01:07:15Z |
| task-adoption-path | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | setup/components/conformance/manifest.yml | 2026-10-15T01:07:15Z |
| task-adoption-path | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | setup/init.mjs | 2026-10-15T01:07:15Z |
| task-adoption-path | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | spec/personas/engineer/AGENTS.md | 2026-10-15T01:07:15Z |
| task-adoption-path | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | test/setup-init.test.mjs | 2026-10-15T01:07:15Z |
| task-adoption-path | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | tools/binding-audit.mjs | 2026-10-15T01:07:15Z |
| task-adoption-path | 36052038f6841b5e2057c2e3bfa00bc8fd1d7978 | AGENTS.md | 2026-10-15T02:00:34Z |
| task-adoption-path | 59c37d8971eedce3b22122dcdbdfcb04ff27366e | setup/README.md | 2026-10-15T02:14:27Z |
| task-adoption-path | 59c37d8971eedce3b22122dcdbdfcb04ff27366e | setup/components/conformance/binding-audit-workflow.yml | 2026-10-15T02:14:27Z |
| task-adoption-path | 59c37d8971eedce3b22122dcdbdfcb04ff27366e | test/setup-init.test.mjs | 2026-10-15T02:14:27Z |
| task-adoption-path | 59c37d8971eedce3b22122dcdbdfcb04ff27366e | tools/binding-audit.mjs | 2026-10-15T02:14:27Z |
| task-agent-fleet | 7e166f6cfa486b7ec4445aa82842a9ed8ab89c1e | implementations/fleet/app/cli.mjs | 2026-10-23T16:44:40Z |
| task-agent-fleet | 7e166f6cfa486b7ec4445aa82842a9ed8ab89c1e | implementations/fleet/app/preflight.mjs | 2026-10-23T16:44:40Z |
| task-agent-fleet | 7e166f6cfa486b7ec4445aa82842a9ed8ab89c1e | implementations/fleet/app/test/preflight.test.mjs | 2026-10-23T16:44:40Z |
| task-linkedin-announce-fleet | c4e6c54f146841c9ea15aa7a8ad6bf7785d8271f | docs/announcements/linkedin/README.md | 2026-10-23T19:21:29Z |
| task-linkedin-announce-fleet | c4e6c54f146841c9ea15aa7a8ad6bf7785d8271f | docs/announcements/linkedin/post_2026-10-23/post.md | 2026-10-23T19:21:29Z |
| task-linkedin-announce-fleet | c4e6c54f146841c9ea15aa7a8ad6bf7785d8271f | docs/announcements/linkedin/post_2026-10-23/article.md | 2026-10-23T19:21:29Z |
| task-linkedin-announce-fleet | c4e6c54f146841c9ea15aa7a8ad6bf7785d8271f | docs/announcements/linkedin/post_2026-10-23/images/fleet.png | 2026-10-23T19:21:29Z |
| task-linkedin-announce-fleet | c4e6c54f146841c9ea15aa7a8ad6bf7785d8271f | docs/announcements/linkedin/post_2026-10-23/images/CAPTURE.md | 2026-10-23T19:21:29Z |
| task-linkedin-announce-fleet | c4e6c54f146841c9ea15aa7a8ad6bf7785d8271f | docs/announcements/linkedin/post_2026-10-23/carousel.pdf | 2026-10-23T19:21:29Z |
| task-agent-fleet | cdafc0fda0f85c55f1e833e0c75a4b1ec955dd7a | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-10-23T19:46:29Z |
| task-agent-fleet | cdafc0fda0f85c55f1e833e0c75a4b1ec955dd7a | .claude/skills/fleet-committer/SKILL.md | 2026-10-23T19:46:29Z |
| task-agent-fleet | c6cc7059ab70eee5c7db6f3a2c47e945535a5876 | implementations/fleet/app/preflight.mjs | 2026-10-23T21:11:02Z |
| task-agent-fleet | c6cc7059ab70eee5c7db6f3a2c47e945535a5876 | implementations/fleet/app/cli.mjs | 2026-10-23T21:11:02Z |
| task-agent-fleet | c6cc7059ab70eee5c7db6f3a2c47e945535a5876 | implementations/fleet/app/test/preflight.test.mjs | 2026-10-23T21:11:02Z |
| task-linkedin-announce-fleet | caaf08284082dde3c6b12217d58c37d8c2daa4b1 | docs/announcements/linkedin/post_2026-10-23/post.md | 2026-10-23T21:15:00Z |
| task-linkedin-announce-fleet | caaf08284082dde3c6b12217d58c37d8c2daa4b1 | docs/announcements/linkedin/post_2026-10-23/article.md | 2026-10-23T21:15:00Z |
| task-linkedin-announce-fleet | 49b0b4933b0e0b9524efa2eaaf993b18512e9d71 | docs/announcements/linkedin/post_2026-10-23/article.html | 2026-10-23T21:43:57Z |
| task-linkedin-announce-fleet | dc6cf6c0db623ab7535e0e5381d6303b5494d245 | docs/announcements/linkedin/post_2026-10-23/post.md | 2026-10-23T22:44:21Z |
| task-linkedin-announce-fleet | dc6cf6c0db623ab7535e0e5381d6303b5494d245 | docs/announcements/linkedin/post_2026-10-23/article.md | 2026-10-23T22:44:21Z |
| task-linkedin-announce-fleet | dc6cf6c0db623ab7535e0e5381d6303b5494d245 | docs/announcements/linkedin/README.md | 2026-10-23T22:44:21Z |
| task-agent-fleet | d71797f741bca0f296d4eb77fc097e0c564a8d58 | .konspekt/agents/skills/fleet-proposer-common/SKILL.md | 2026-10-24T14:52:15Z |
| task-agent-fleet | d71797f741bca0f296d4eb77fc097e0c564a8d58 | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-10-24T14:52:15Z |
| task-agent-fleet | d71797f741bca0f296d4eb77fc097e0c564a8d58 | .claude/skills/fleet-proposer-common/SKILL.md | 2026-10-24T14:52:15Z |
| task-agent-fleet | d71797f741bca0f296d4eb77fc097e0c564a8d58 | .claude/skills/fleet-committer/SKILL.md | 2026-10-24T14:52:15Z |
| task-fleet-committer-startup-scan | 3ed36fac434b8cd407eff52a4aed7fdcaa9882ec | ROADMAP.md | 2026-10-24T15:05:00Z |
| task-agent-fleet | c6c618e22ac8186da1e343d01f5701cb12a61152 | implementations/fleet/app/worktrees.mjs | 2026-10-24T15:20:00Z |
| task-agent-fleet | c6c618e22ac8186da1e343d01f5701cb12a61152 | implementations/fleet/app/cli.mjs | 2026-10-24T15:20:00Z |
| task-agent-fleet | c6c618e22ac8186da1e343d01f5701cb12a61152 | implementations/fleet/app/test/config.test.mjs | 2026-10-24T15:20:00Z |
| task-fleet-committer-startup-scan | bc4f3043ef572deb9ffc894b78facd462067e89f | implementations/fleet/app/cli.mjs | 2026-10-24T15:35:00Z |
| task-fleet-committer-startup-scan | bc4f3043ef572deb9ffc894b78facd462067e89f | implementations/fleet/app/committer.mjs | 2026-10-24T15:35:00Z |
| task-fleet-committer-startup-scan | bc4f3043ef572deb9ffc894b78facd462067e89f | implementations/fleet/app/test/committer.test.mjs | 2026-10-24T15:35:00Z |
| task-fleet-committer-startup-scan | bc4f3043ef572deb9ffc894b78facd462067e89f | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-10-24T15:35:00Z |
| task-fleet-committer-startup-scan | bc4f3043ef572deb9ffc894b78facd462067e89f | .claude/skills/fleet-committer/SKILL.md | 2026-10-24T15:35:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/cli.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/committer.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/fold.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/outbox.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/payload.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/verify.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/test/cli.test.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/test/fold.test.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/test/outbox.test.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | implementations/fleet/app/test/verify.test.mjs | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | .konspekt/agents/skills/fleet-proposer-common/SKILL.md | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | .claude/skills/fleet-committer/SKILL.md | 2026-10-24T15:55:00Z |
| task-fleet-proposal-carries-files | 849e2192ec02e1dd7661671002526282429f7d8c | .claude/skills/fleet-proposer-common/SKILL.md | 2026-10-24T15:55:00Z |
| task-linkedin-announce-fleet | b9b42fe5d6c6742de0ff6510d9973a3500070a0b | docs/index.html | 2026-10-25T01:49:00Z |
| task-linkedin-announce-fleet | 98fb8fccd5eb07c6c5a624c294a0adb68c6f208b | docs/index.html | 2026-10-25T01:49:00Z |
| task-agent-fleet | 6097d650bdec55812c91a112dcf4ace0e367f3c0 | ROADMAP.md | 2026-10-25T14:15:00Z |
| task-fleet-adjustments | b39ac80f1537cb41ef3625bcafee1489d4c793c5 | .konspekt/agents/skills/fleet-proposer-common/SKILL.md | 2026-10-25T14:25:00Z |
| task-fleet-adjustments | b39ac80f1537cb41ef3625bcafee1489d4c793c5 | .claude/skills/fleet-proposer-common/SKILL.md | 2026-10-25T14:25:00Z |
| task-fleet-adjustments | 68178f8cb373e79e3e32e6c07da2e810da8c76db | implementations/fleet/app/cli.mjs | 2026-10-25T15:05:00Z |
| task-fleet-adjustments | 68178f8cb373e79e3e32e6c07da2e810da8c76db | implementations/fleet/app/worktrees.mjs | 2026-10-25T15:05:00Z |
| task-fleet-adjustments | 68178f8cb373e79e3e32e6c07da2e810da8c76db | implementations/fleet/app/fold.mjs | 2026-10-25T15:05:00Z |
| task-fleet-adjustments | 68178f8cb373e79e3e32e6c07da2e810da8c76db | implementations/fleet/app/test/config.test.mjs | 2026-10-25T15:05:00Z |
| task-fleet-adjustments | 68178f8cb373e79e3e32e6c07da2e810da8c76db | implementations/fleet/app/test/fold.test.mjs | 2026-10-25T15:05:00Z |
| task-fleet-adjustments | 7214040f8d7b28bddcd570d860c1e9d67f5ac914 | implementations/fleet/app/committer-watch-hook.mjs | 2026-10-25T15:30:00Z |
| task-fleet-adjustments | 7214040f8d7b28bddcd570d860c1e9d67f5ac914 | implementations/fleet/app/test/committer-watch-hook.test.mjs | 2026-10-25T15:30:00Z |
| task-fleet-adjustments | 7214040f8d7b28bddcd570d860c1e9d67f5ac914 | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-10-25T15:30:00Z |
| task-fleet-adjustments | 7214040f8d7b28bddcd570d860c1e9d67f5ac914 | .claude/skills/fleet-committer/SKILL.md | 2026-10-25T15:30:00Z |
| task-fleet-adjustments | 211b21419906740729ae18ae60024e0d9c3e0dd5 | implementations/fleet/app/committer-watch-hook.mjs | 2026-10-25T15:45:00Z |
| task-fleet-adjustments | 211b21419906740729ae18ae60024e0d9c3e0dd5 | implementations/fleet/app/test/committer-watch-hook.test.mjs | 2026-10-25T15:45:00Z |
| task-fleet-adjustments | 4d9032cc826609a00ad849857de3f1d15230444d | implementations/fleet/app/git.mjs | 2026-10-25T16:05:00Z |
| task-fleet-adjustments | 4d9032cc826609a00ad849857de3f1d15230444d | implementations/fleet/app/committer-watch-hook.mjs | 2026-10-25T16:05:00Z |
| task-fleet-adjustments | eccd9af4e2ce694acf9c5c136d75d65197beba26 | implementations/fleet/app/committer-statusline.mjs | 2026-10-25T17:30:00Z |
| task-fleet-adjustments | eccd9af4e2ce694acf9c5c136d75d65197beba26 | implementations/fleet/app/test/committer-statusline.test.mjs | 2026-10-25T17:30:00Z |
| task-fleet-adjustments | eccd9af4e2ce694acf9c5c136d75d65197beba26 | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-10-25T17:30:00Z |
| task-fleet-adjustments | eccd9af4e2ce694acf9c5c136d75d65197beba26 | .claude/skills/fleet-committer/SKILL.md | 2026-10-25T17:30:00Z |
| task-fleet-adjustments | e65347006e8cf2b8cc625b3434e22d2742ce68ec | spec/personas/engineer/AGENTS.md | 2026-10-26T00:00:00Z |
| task-fleet-adjustments | 2de7d453415d37481613dbff4b08362c3cdc0bf3 | ROADMAP.md | 2026-10-26T21:35:00Z |
| goal-adoption | b595d5589c8a9e47ba729a8cd97e6f9a8d7308c9 | setup/README.md | 2026-10-29T20:40:18Z |
| goal-adoption | b595d5589c8a9e47ba729a8cd97e6f9a8d7308c9 | ROADMAP.md | 2026-10-29T20:40:18Z |
| goal-adoption | 4bdc2459925ffe75cf9271f99b2e6f0e6d186c7e | docs/visuals/how-to/how-to.demo.flow.md | 2026-10-29T21:24:56Z |
| task-binding-gap-audit | fe5fc1b2c8f807b04163b76f630254d35bc1876b | .konspekt/binding-audit.json | 2026-10-29T21:25:20Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/binding.png | 2026-10-29T21:45:08Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/git_checkers.png | 2026-10-29T21:45:08Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/provenance_source.png | 2026-10-29T21:45:08Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/setup.png | 2026-10-29T21:45:08Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/task_completion.png | 2026-10-29T21:45:08Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/task_proposal.png | 2026-10-29T21:45:08Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/ui_asr_adr.png | 2026-10-29T21:45:08Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/ui_desktop.png | 2026-10-29T21:45:08Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/ui_provenance.png | 2026-10-29T21:45:08Z |
| goal-adoption | 8e5642f305f4d707cf61e827d818470993f3519d | docs/visuals/how-to/ui_selection.png | 2026-10-29T21:45:08Z |
| task-promo-video | 37ce34cc7c03431927d7ee9920d4fe652249fed0 | docs/visuals/how-to/end_card.png | 2026-10-29T21:57:04Z |
| task-promo-video | 37ce34cc7c03431927d7ee9920d4fe652249fed0 | docs/visuals/how-to/how-to.demo.flow.md | 2026-10-29T21:57:04Z |
| task-promo-video | 37ce34cc7c03431927d7ee9920d4fe652249fed0 | docs/visuals/how-to/konspekt-howto-walkthrough.mp4 | 2026-10-29T21:57:04Z |
| task-promo-video | 37ce34cc7c03431927d7ee9920d4fe652249fed0 | docs/visuals/how-to/konspekt-howto-walkthrough.srt | 2026-10-29T21:57:04Z |
| task-promo-video | 37ce34cc7c03431927d7ee9920d4fe652249fed0 | docs/visuals/how-to/title_card.png | 2026-10-29T21:57:04Z |
| task-presentation-refresh | 3f76163fe2e518b5a386f6581d32956af48e325e | docs/index.html | 2026-11-04T02:53:33Z |
| task-promo-video | 99c67afcec56f91260973ecc5a9e3825a279e5a6 | ROADMAP.md | 2026-11-04T02:54:47Z |
| task-undriven-adr-visibility | ebc2f13d98e9cbf344d42083246c37f446a14dcb | implementations/implementation-zero/app/server.mjs | 2026-11-06T21:47:34Z |
| task-undriven-adr-visibility | ebc2f13d98e9cbf344d42083246c37f446a14dcb | implementations/implementation-zero/app/view/app.css | 2026-11-06T21:47:34Z |
| task-undriven-adr-visibility | ebc2f13d98e9cbf344d42083246c37f446a14dcb | implementations/implementation-zero/app/view/app.js | 2026-11-06T21:47:34Z |
| task-undriven-adr-visibility | ebc2f13d98e9cbf344d42083246c37f446a14dcb | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt | 2026-11-06T21:47:34Z |
| task-undriven-adr-visibility | ebc2f13d98e9cbf344d42083246c37f446a14dcb | lib/conformance.mjs | 2026-11-06T21:47:34Z |
| task-undriven-adr-visibility | ebc2f13d98e9cbf344d42083246c37f446a14dcb | spec/personas/engineer/SPEC.md | 2026-11-06T21:47:34Z |
| task-undriven-adr-visibility | ebc2f13d98e9cbf344d42083246c37f446a14dcb | spec/personas/engineer/registry.mjs | 2026-11-06T21:47:34Z |
| task-undriven-adr-visibility | ebc2f13d98e9cbf344d42083246c37f446a14dcb | test/conformance-adr-drives.test.mjs | 2026-11-06T21:47:34Z |
| task-undriven-adr-visibility | f83a8301f719bf089f033ad9684bf147b95e1253 | lib/conformance.mjs | 2026-11-06T22:39:42Z |
| task-undriven-adr-visibility | f83a8301f719bf089f033ad9684bf147b95e1253 | spec/personas/engineer/AGENTS.md | 2026-11-06T22:39:42Z |
| task-undriven-adr-visibility | f83a8301f719bf089f033ad9684bf147b95e1253 | spec/personas/engineer/SPEC.md | 2026-11-06T22:39:42Z |
| task-undriven-adr-visibility | f83a8301f719bf089f033ad9684bf147b95e1253 | test/conformance-adr-drives.test.mjs | 2026-11-06T22:39:42Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | .claude/hooks/load-mandatory-skills.sh | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | .konspekt/OPERATING.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | ROADMAP.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | WHITEPAPER.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | docs/design/fleet-protocol.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | lib/conformance.mjs | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | setup/WEBMOBILE_SEED.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | setup/init.mjs | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | setup/templates/AGENTS-stanza.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | setup/templates/OPERATING.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | setup/templates/checkpoints.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | spec/architecture/SERIALIZATION.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | spec/architecture/TRANSPORT.md | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | test/conformance-checkpoints.test.mjs | 2026-11-07T16:00:00Z |
| task-session-checkpoint | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | test/load-mandatory-skills-hook.test.mjs | 2026-11-07T16:00:00Z |
| task-linkedin-announce-checkpoint | 88422d7af0e950e27f547e9b56504673c69bd180 | ROADMAP.md | 2026-11-07T18:20:59Z |
| task-linkedin-announce-checkpoint | 88422d7af0e950e27f547e9b56504673c69bd180 | docs/announcements/linkedin/README.md | 2026-11-07T18:20:59Z |
| task-linkedin-announce-checkpoint | 88422d7af0e950e27f547e9b56504673c69bd180 | docs/announcements/linkedin/post_2026-11-07/images/CAPTURE.md | 2026-11-07T18:20:59Z |
| task-linkedin-announce-checkpoint | 88422d7af0e950e27f547e9b56504673c69bd180 | docs/announcements/linkedin/post_2026-11-07/images/checkpoint.png | 2026-11-07T18:20:59Z |
| task-linkedin-announce-checkpoint | 88422d7af0e950e27f547e9b56504673c69bd180 | docs/announcements/linkedin/post_2026-11-07/post.md | 2026-11-07T18:20:59Z |
| task-linkedin-announce-checkpoint | 88422d7af0e950e27f547e9b56504673c69bd180 | docs/index.html | 2026-11-07T18:20:59Z |
| task-linkedin-announce-checkpoint | 88422d7af0e950e27f547e9b56504673c69bd180 | docs/visuals/posters/konspekt-checkpoint-poster.html | 2026-11-07T18:20:59Z |
| task-linkedin-announce-checkpoint | e719182b239a3b9492b65ec0aa4f8c0afdb4a11b | docs/announcements/linkedin/post_2026-11-07/post.md | 2026-11-07T22:10:47Z |
| task-linkedin-announce-checkpoint | cf443de939130e9a7b27985b57fa2a8ca6eab557 | ROADMAP.md | 2026-11-07T22:10:47Z |
| task-fleet-canonical-follow | d749f88dca932c443767f58c3e7f44c66c4242db | ROADMAP.md | 2026-11-11T18:00:07Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | .claude/skills/fleet-committer/SKILL.md | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | .claude/skills/fleet-proposer-common/SKILL.md | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | .konspekt/agents/skills/fleet-proposer-common/SKILL.md | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | implementations/fleet/app/README.md | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | implementations/fleet/app/cli.mjs | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | implementations/fleet/app/committer-watch-hook.mjs | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | implementations/fleet/app/committer.mjs | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | implementations/fleet/app/follow.mjs | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | implementations/fleet/app/git.mjs | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | implementations/fleet/app/test/follow.test.mjs | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | ecf115121c74006473371f29ef50a4396fea6949 | implementations/fleet/app/worktrees.mjs | 2026-11-11T18:14:03Z |
| task-fleet-canonical-follow | 78df98db206fe23016077fe84934de238b48304e | ROADMAP.md | 2026-11-11T18:23:11Z |
| task-fleet-adjustments | 74874643390b09d42fdfe42f025f0fe0d41d1042 | .claude/skills/fleet-committer/SKILL.md | 2026-11-11T18:23:11Z |
| task-fleet-adjustments | 74874643390b09d42fdfe42f025f0fe0d41d1042 | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-11-11T18:23:11Z |
| task-fleet-adjustments | 74874643390b09d42fdfe42f025f0fe0d41d1042 | implementations/fleet/app/claims.mjs | 2026-11-11T18:23:11Z |
| task-fleet-adjustments | 74874643390b09d42fdfe42f025f0fe0d41d1042 | implementations/fleet/app/follow.mjs | 2026-11-11T18:23:11Z |
| task-fleet-adjustments | 74874643390b09d42fdfe42f025f0fe0d41d1042 | implementations/fleet/app/test/follow.test.mjs | 2026-11-11T18:23:11Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | .claude/skills/fleet-committer/SKILL.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | .claude/skills/fleet-proposer-common/SKILL.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | .claude/skills/fleet-spec-writer/SKILL.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | .konspekt/agents/skills/fleet-committer/SKILL.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | .konspekt/agents/skills/fleet-proposer-common/SKILL.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | .konspekt/agents/skills/fleet-spec-writer/SKILL.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | implementations/fleet/app/README.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | implementations/fleet/app/fold.mjs | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | implementations/fleet/design/fleet-confidence-scale.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | implementations/fleet/design/fleet-outbox-lifecycle.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | implementations/fleet/design/fleet-protocol.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | implementations/fleet/design/fleet-recovery.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | implementations/fleet/design/fleet-spec.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | implementations/fleet/docs/ADOPTING.md | 2026-11-13T00:58:16Z |
| task-fleet-design-docs-placement | 3beb05691360ac0671444a1744fda647aeeaada5 | implementations/fleet/docs/DESIGN.md | 2026-11-13T00:58:16Z |
| task-ni-references | bd14a5ecb6b8f3754f985e138d7035345314e7bf | docs/design/source-addressing.md | 2026-11-14T14:31:52Z |
| task-ni-references | bd177f96d83ac8167437df31996e80a5c4662de7 | docs/design/source-addressing.md | 2026-11-14T14:45:53Z |
| task-ni-references | bd177f96d83ac8167437df31996e80a5c4662de7 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt | 2026-11-14T14:45:53Z |
| task-ni-references | bd177f96d83ac8167437df31996e80a5c4662de7 | lib/conformance.mjs | 2026-11-14T14:45:53Z |
| task-ni-references | bd177f96d83ac8167437df31996e80a5c4662de7 | test/conformance-yaml-subset.test.mjs | 2026-11-14T14:45:53Z |
| task-ni-references | 0c1aee6cd2e09d94e522336efa3ab1fa8a59fc46 | ROADMAP.md | 2026-11-14T18:38:37Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | docs/design/source-addressing.md | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | implementations/fleet/app/claims.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | implementations/fleet/app/fold.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | implementations/fleet/app/outbox.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | implementations/fleet/app/payload.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | implementations/fleet/app/test/fold.test.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | implementations/fleet/app/test/outbox.test.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | implementations/fleet/app/test/payload.test.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | implementations/fleet/app/verify.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | lib/conformance.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 9be768f133536429abe17a6543d4d5bdbc8da72a | test/conformance-ni-refs.test.mjs | 2026-11-14T18:47:21Z |
| task-ni-test-migration | 68de1d218cff26ac6888816517042af25ba74166 | ROADMAP.md | 2026-11-14T18:47:43Z |
| task-ni-test-migration | cc26302bf46a3064f16c5e00d0c4079ac5674e2b | lib/conformance.mjs | 2026-11-14T18:55:49Z |
| task-ni-test-migration | cc26302bf46a3064f16c5e00d0c4079ac5674e2b | spec/personas/engineer/registry.mjs | 2026-11-14T18:55:49Z |
| task-ni-test-migration | cc26302bf46a3064f16c5e00d0c4079ac5674e2b | test/conformance-ni-refs.test.mjs | 2026-11-14T18:55:49Z |
| task-ni-test-migration | bc82b556d441d47128072c349d5edae0012ffd38 | .claude/skills/fleet-proposer-common/SKILL.md | 2026-11-14T18:55:49Z |
| task-ni-test-migration | bc82b556d441d47128072c349d5edae0012ffd38 | .konspekt/agents/skills/fleet-proposer-common/SKILL.md | 2026-11-14T18:55:49Z |
| task-ni-test-migration | bc82b556d441d47128072c349d5edae0012ffd38 | docs/design/source-addressing.md | 2026-11-14T18:55:49Z |
| task-ni-test-migration | bc82b556d441d47128072c349d5edae0012ffd38 | implementations/fleet/app/README.md | 2026-11-14T18:55:49Z |
| task-ni-test-migration | bc82b556d441d47128072c349d5edae0012ffd38 | implementations/fleet/design/fleet-outbox-lifecycle.md | 2026-11-14T18:55:49Z |
| task-ni-test-migration | bc82b556d441d47128072c349d5edae0012ffd38 | implementations/fleet/design/fleet-protocol.md | 2026-11-14T18:55:49Z |
| task-ni-test-migration | bc82b556d441d47128072c349d5edae0012ffd38 | implementations/fleet/design/fleet-spec.md | 2026-11-14T18:55:49Z |
| task-ni-test-migration | bc82b556d441d47128072c349d5edae0012ffd38 | implementations/fleet/docs/ADOPTING.md | 2026-11-14T18:55:49Z |
| task-ni-test-migration | bc82b556d441d47128072c349d5edae0012ffd38 | implementations/fleet/docs/DESIGN.md | 2026-11-14T18:55:49Z |
| task-ni-test-migration | 36fc1d8911f9e12625e5195695e63511c35ecd3a | implementations/intellij-plugin/app/gradle.properties | 2026-11-14T18:55:49Z |
| task-ni-test-migration | 666f911c36db36232b2d7d81934a674451f1bb63 | ROADMAP.md | 2026-11-14T18:56:09Z |
| task-ni-test-migration | 01c3029b098b501282922bf9a084b9e458d7a64b | docs/design/source-addressing.md | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 01c3029b098b501282922bf9a084b9e458d7a64b | implementations/fleet/design/fleet-spec.md | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 742698af3680a1556db7bfe728023c0a28349c3c | implementations/implementation-zero/app/server.mjs | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 742698af3680a1556db7bfe728023c0a28349c3c | implementations/implementation-zero/app/test/server.test.mjs | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 742698af3680a1556db7bfe728023c0a28349c3c | implementations/implementation-zero/app/view/app.js | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 742698af3680a1556db7bfe728023c0a28349c3c | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 0000297f1e81b85ae69268df7be8fc3db8800eda | .claude/hooks/load-mandatory-skills.sh | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 0000297f1e81b85ae69268df7be8fc3db8800eda | .konspekt/lib/konspekt-notify.mjs | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 0000297f1e81b85ae69268df7be8fc3db8800eda | lib/views.mjs | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 0000297f1e81b85ae69268df7be8fc3db8800eda | setup/components/notify/konspekt-notify.mjs | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 0000297f1e81b85ae69268df7be8fc3db8800eda | test/migrate-ni.test.mjs | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 0000297f1e81b85ae69268df7be8fc3db8800eda | tools/migrate-ni.mjs | 2026-11-14T19:37:15Z |
| task-ni-test-migration | 3ab83d189d1ba3a099dbc40de2b55e1de8aa7d6e | implementations/intellij-plugin/app/gradle.properties | 2026-11-14T19:40:04Z |
| task-ni-test-migration | dbbe4d0d3608c24ad223bbb796d0f9fb73cb4df9 | ROADMAP.md | 2026-11-14T19:40:04Z |
| task-ni-test-migration | 053537c5433614ec66a13b8fb3a8c08ee67b3ba6 | docs/design/source-addressing.md | 2026-11-14T19:40:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | lib/conformance.mjs | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/architecture/README.md | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/architecture/RECONCILIATION.md | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/architecture/SERIALIZATION.md | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/architecture/STORAGE.md | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/architecture/TRANSPORT.md | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/data-model/SPEC.md | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/data-model/schema.ts | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/personas/README.md | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/personas/engineer/AGENTS.md | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | spec/personas/engineer/SPEC.md | 2026-11-14T19:48:32Z |
| task-ni-references | 675b6a29a8cd6f1378664190b76ee0ff18592672 | test/conformance-ni-refs.test.mjs | 2026-11-14T19:48:32Z |
| task-ni-references | 07cf0d3ab2c7852387537c34af14b2907d72c55f | ROADMAP.md | 2026-11-14T19:48:51Z |
| task-ni-references | 183cc38da99bcd30880e02034c598eca05778be3 | lib/locator-reach.mjs | 2026-11-14T20:10:28Z |
| task-ni-references | 183cc38da99bcd30880e02034c598eca05778be3 | lib/validate.mjs | 2026-11-14T20:10:28Z |
| task-ni-references | 183cc38da99bcd30880e02034c598eca05778be3 | setup/components/conformance/manifest.yml | 2026-11-14T20:10:28Z |
| task-ni-references | 183cc38da99bcd30880e02034c598eca05778be3 | test/locator-reach.test.mjs | 2026-11-14T20:10:28Z |
| task-ni-references | b7c26b7ba010b0e9742a7c82a8707815c9ac6fbd | .gitattributes | 2026-11-14T20:12:15Z |
| task-ni-references | 1a9b14096f634db2b951890c59bd4b44d71d739f | .gitattributes | 2026-11-14T20:15:12Z |
| task-ni-references | dec86e3aea527c80cd434a0c72704b82283d89a0 | lib/locator-reach.mjs | 2026-11-14T20:16:21Z |
| task-ni-references | dec86e3aea527c80cd434a0c72704b82283d89a0 | lib/validate.mjs | 2026-11-14T20:16:21Z |
| task-ni-references | dec86e3aea527c80cd434a0c72704b82283d89a0 | test/locator-reach.test.mjs | 2026-11-14T20:16:21Z |
| task-ni-references | dec86e3aea527c80cd434a0c72704b82283d89a0 | tools/README.md | 2026-11-14T20:16:21Z |
| task-ni-references | 7e122952fd5ff63052f4e282ad839e2eb1c31c18 | lib/conformance.mjs | 2026-11-15T00:12:21Z |
| task-ni-references | 7e122952fd5ff63052f4e282ad839e2eb1c31c18 | spec/architecture/SERIALIZATION.md | 2026-11-15T00:12:21Z |
| task-ni-references | 7e122952fd5ff63052f4e282ad839e2eb1c31c18 | test/conformance-ni-refs.test.mjs | 2026-11-15T00:12:21Z |
| task-ni-references | a98e9f1590492bb89c48c2d5a7cfaea530c7e254 | .claude/skills/konspekt-atom-readiness/SKILL.md | 2026-11-15T00:19:10Z |
| task-ni-references | a98e9f1590492bb89c48c2d5a7cfaea530c7e254 | .konspekt/OPERATING.md | 2026-11-15T00:19:10Z |
| task-ni-references | a98e9f1590492bb89c48c2d5a7cfaea530c7e254 | setup/WEBMOBILE_SEED.md | 2026-11-15T00:19:10Z |
| task-ni-references | a98e9f1590492bb89c48c2d5a7cfaea530c7e254 | setup/templates/commands-executed.md | 2026-11-15T00:19:10Z |
| task-ni-references | a98e9f1590492bb89c48c2d5a7cfaea530c7e254 | setup/templates/sources-README.md | 2026-11-15T00:19:10Z |
| task-ni-references | d42c833481f16c2af2a68a45bf58a345d9c3b738 | WHITEPAPER.md | 2026-11-15T00:21:11Z |
| task-ni-references | d42c833481f16c2af2a68a45bf58a345d9c3b738 | docs/overview.html | 2026-11-15T00:21:11Z |
| task-ni-references | d42c833481f16c2af2a68a45bf58a345d9c3b738 | docs/overview.svg | 2026-11-15T00:21:11Z |
| task-ni-references | d42c833481f16c2af2a68a45bf58a345d9c3b738 | docs/visuals/posters/konspekt-fleet-poster.html | 2026-11-15T00:21:11Z |
| task-ni-references | d42c833481f16c2af2a68a45bf58a345d9c3b738 | spec/architecture/SCHEMA-RECONCILIATION.md | 2026-11-15T00:21:11Z |
| task-ni-references | 3ed03f8610bf24fcc368cf171ccf9d710f20177c | docs/overview.svg | 2026-11-15T00:28:08Z |
| task-ni-references | 3ed03f8610bf24fcc368cf171ccf9d710f20177c | docs/overview_dark_preview.png | 2026-11-15T00:28:08Z |
| task-ni-references | 3ed03f8610bf24fcc368cf171ccf9d710f20177c | docs/overview_light_preview.png | 2026-11-15T00:28:08Z |
| task-ni-impact-analysis | 2e76727b83b44b867f82d4d08aa642b19c26fa43 | docs/design/source-addressing.md | 2026-11-15T00:32:12Z |
| task-ni-impact-analysis | 9bbe2df3730f5fb0ab09822af3cc326308ccbbcb | ROADMAP.md | 2026-11-15T00:38:19Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | .gitattributes | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | README.md | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | docs/visuals/posters/konspekt-checkpoint-poster.html | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | docs/visuals/posters/konspekt-current-state-poster.html | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | docs/visuals/posters/konspekt-how-it-works-poster.html | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | implementations/implementation-zero/app/server.mjs | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | implementations/implementation-zero/app/test/server.test.mjs | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | implementations/implementation-zero/app/view/app.css | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | implementations/implementation-zero/app/view/app.js | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | spec/personas/engineer/registry.mjs | 2026-11-15T00:39:59Z |
| task-ni-references | 83b282cb664a99501327a7b610ba76051b54492d | tools/state-poster.mjs | 2026-11-15T00:39:59Z |
| task-ni-references | d1f511b432ad89928d69c3896ed3a3530f4dd070 | setup/templates/project.md | 2026-11-15T00:39:59Z |
| task-ni-references | 41aeebc7880cf112e54f8c645fbb04ec245e0eb1 | ROADMAP.md | 2026-11-15T00:52:10Z |
| task-ni-references | 3222f4a0763e139414a0a196d12537eb73e534a1 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt | 2026-11-15T01:02:21Z |
| task-ni-references | 134063216c81f82a29b3dc09b915f6f33142e275 | implementations/intellij-plugin/app/README.md | 2026-11-15T01:06:14Z |
| task-ni-references | 134063216c81f82a29b3dc09b915f6f33142e275 | implementations/intellij-plugin/app/build.gradle.kts | 2026-11-15T01:06:14Z |
| task-ni-references | 134063216c81f82a29b3dc09b915f6f33142e275 | implementations/intellij-plugin/app/src/test/kotlin/dev/konspekt/plugin/InstanceReaderLocatorsTest.kt | 2026-11-15T01:06:14Z |
| task-linkedin-announce-ni-references | 03d10c7a828d5713e73983cd5d868edf168941dc | docs/announcements/linkedin/README.md | 2026-11-15T15:09:55Z |
| task-linkedin-announce-ni-references | 03d10c7a828d5713e73983cd5d868edf168941dc | docs/announcements/linkedin/post_2026-11-16/carousel.pdf | 2026-11-15T15:09:55Z |
| task-linkedin-announce-ni-references | 03d10c7a828d5713e73983cd5d868edf168941dc | docs/announcements/linkedin/post_2026-11-16/images/CAPTURE.md | 2026-11-15T15:09:55Z |
| task-linkedin-announce-ni-references | 03d10c7a828d5713e73983cd5d868edf168941dc | docs/announcements/linkedin/post_2026-11-16/post.md | 2026-11-15T15:09:55Z |
| task-linkedin-announce-ni-references | 03d10c7a828d5713e73983cd5d868edf168941dc | docs/visuals/posters/konspekt-addressing-poster.html | 2026-11-15T15:09:55Z |
| task-linkedin-announce-ni-references | 34b404a36a797fc19156be47808f8fe6cb723467 | ROADMAP.md | 2026-11-15T15:10:23Z |
| task-linkedin-announce-ni-references | bb43a003e79278c6eb803b44d0fd603cefd4b9bf | docs/announcements/linkedin/post_2026-11-16/post.md | 2026-11-15T15:13:09Z |
| task-ni-references | addc3de8f8f4835bdbfb80c1d8c309cba0001df7 | docs/design/source-addressing.md | 2026-11-15T15:24:42Z |
| task-ni-references | addc3de8f8f4835bdbfb80c1d8c309cba0001df7 | setup/README.md | 2026-11-15T15:24:42Z |
| task-ni-references | addc3de8f8f4835bdbfb80c1d8c309cba0001df7 | setup/init.mjs | 2026-11-15T15:24:42Z |
| task-ni-references | addc3de8f8f4835bdbfb80c1d8c309cba0001df7 | test/migrate-ni.test.mjs | 2026-11-15T15:24:42Z |
| task-ni-references | addc3de8f8f4835bdbfb80c1d8c309cba0001df7 | test/setup-init.test.mjs | 2026-11-15T15:24:42Z |
| task-ni-references | addc3de8f8f4835bdbfb80c1d8c309cba0001df7 | tools/migrate-ni.mjs | 2026-11-15T15:24:42Z |
| task-ni-references | b94af594c5415a89fdb8bd361cbe5add22fe96a7 | ROADMAP.md | 2026-11-15T15:25:14Z |
| task-ni-references | 893a717cf59443622d6d4e7ef9eeb0b4ccea192e | docs/design/source-addressing.md | 2026-11-15T15:29:57Z |
| task-ni-references | 893a717cf59443622d6d4e7ef9eeb0b4ccea192e | setup/README.md | 2026-11-15T15:29:57Z |
| task-ni-references | 893a717cf59443622d6d4e7ef9eeb0b4ccea192e | setup/init.mjs | 2026-11-15T15:29:57Z |
| task-ni-references | 893a717cf59443622d6d4e7ef9eeb0b4ccea192e | setup/templates/project.md | 2026-11-15T15:29:57Z |
| task-ni-references | 893a717cf59443622d6d4e7ef9eeb0b4ccea192e | test/setup-init.test.mjs | 2026-11-15T15:29:57Z |
| task-ni-references | 5156071042d4b225f732cc1d5f058179cd737383 | ROADMAP.md | 2026-11-15T15:30:15Z |
| task-linkedin-announce-ni-references | 986c4bf170b13fcbab167d9f7713c0b28d64b2c3 | ROADMAP.md | 2026-11-15T16:01:55Z |
| task-ni-references | afaf1d84558c66b9e7cc34395fa4cad17a9a5c26 | setup/README.md | 2026-11-15T16:08:52Z |
| task-ni-references | afaf1d84558c66b9e7cc34395fa4cad17a9a5c26 | test/migrate-ni.test.mjs | 2026-11-15T16:08:52Z |
| task-ni-references | afaf1d84558c66b9e7cc34395fa4cad17a9a5c26 | tools/migrate-ni.mjs | 2026-11-15T16:08:52Z |
| task-linkedin-announce-ni-references | b36393628e041da41dd52d396f4973faf32be621 | docs/announcements/linkedin/README.md | 2026-11-15T16:24:16Z |
| task-linkedin-announce-ni-references | b36393628e041da41dd52d396f4973faf32be621 | docs/announcements/linkedin/post_2026-11-16/carousel.pdf | 2026-11-15T16:24:16Z |
| task-linkedin-announce-ni-references | b36393628e041da41dd52d396f4973faf32be621 | docs/announcements/linkedin/post_2026-11-16/post.md | 2026-11-15T16:24:16Z |
| task-linkedin-announce-ni-references | b36393628e041da41dd52d396f4973faf32be621 | docs/visuals/posters/konspekt-addressing-poster.html | 2026-11-15T16:24:16Z |
| task-linkedin-announce-ni-references | ab16fc34a8ed17295cedc1b178c65dd2d2203dd1 | docs/announcements/linkedin/README.md | 2026-11-15T16:55:52Z |
| task-linkedin-announce-ni-references | ab16fc34a8ed17295cedc1b178c65dd2d2203dd1 | docs/announcements/linkedin/post_2026-11-16/post.md | 2026-11-15T16:55:52Z |
| task-linkedin-announce-ni-references | a9cf2a77a7d14fcf56c2d2b2ea0afc8fdcb26554 | docs/announcements/linkedin/README.md | 2026-11-15T16:57:34Z |
| task-linkedin-announce-ni-references | a9cf2a77a7d14fcf56c2d2b2ea0afc8fdcb26554 | docs/announcements/linkedin/post_2026-11-15/carousel.pdf | 2026-11-15T16:57:34Z |
| task-linkedin-announce-ni-references | a9cf2a77a7d14fcf56c2d2b2ea0afc8fdcb26554 | docs/announcements/linkedin/post_2026-11-15/images/CAPTURE.md | 2026-11-15T16:57:34Z |
| task-linkedin-announce-ni-references | a9cf2a77a7d14fcf56c2d2b2ea0afc8fdcb26554 | docs/announcements/linkedin/post_2026-11-15/post.md | 2026-11-15T16:57:34Z |
| task-linkedin-announce-ni-references | a9cf2a77a7d14fcf56c2d2b2ea0afc8fdcb26554 | docs/announcements/linkedin/post_2026-11-16/carousel.pdf | 2026-11-15T16:57:34Z |
| task-linkedin-announce-ni-references | a9cf2a77a7d14fcf56c2d2b2ea0afc8fdcb26554 | docs/announcements/linkedin/post_2026-11-16/images/CAPTURE.md | 2026-11-15T16:57:34Z |
| task-linkedin-announce-ni-references | a9cf2a77a7d14fcf56c2d2b2ea0afc8fdcb26554 | docs/announcements/linkedin/post_2026-11-16/post.md | 2026-11-15T16:57:34Z |
| task-linkedin-announce-ni-references | f4daa28b90dbbc8b8f13664f4bd39f3d3a551705 | ROADMAP.md | 2026-11-15T16:58:10Z |
| task-ni-walkthrough-recapture | 1cccfea8b8ff915c12ce4b92fc12503d64f0066f | docs/design/source-addressing.md | 2026-11-15T17:22:37Z |
| task-ni-walkthrough-recapture | 1cccfea8b8ff915c12ce4b92fc12503d64f0066f | docs/visuals/how-to/konspekt-howto-walkthrough.mp4 | 2026-11-15T17:22:37Z |
| task-ni-walkthrough-recapture | 1cccfea8b8ff915c12ce4b92fc12503d64f0066f | docs/visuals/how-to/provenance_source.png | 2026-11-15T17:22:37Z |
| task-ni-walkthrough-recapture | 1cccfea8b8ff915c12ce4b92fc12503d64f0066f | docs/visuals/how-to/ui_provenance.png | 2026-11-15T17:22:37Z |
| task-ni-walkthrough-recapture | 30cdbcf1c0713591aa27218412a846422ade65da | ROADMAP.md | 2026-11-15T17:24:41Z |
| task-view-wrap-long-paths | f218cbd5394f78cd834c7854252be283648a9462 | implementations/implementation-zero/app/view/app.css | 2026-11-15T17:26:28Z |
| task-view-wrap-long-paths | f218cbd5394f78cd834c7854252be283648a9462 | implementations/intellij-plugin/app/gradle.properties | 2026-11-15T17:26:28Z |
| task-view-wrap-long-paths | 63a185ab88b18b4892de4978f95c4917ec091452 | ROADMAP.md | 2026-11-15T17:26:50Z |
| task-view-wrap-long-paths | 23110c3f2562cc8941acfde5a99f52b1498aa51d | ROADMAP.md | 2026-11-15T17:28:27Z |
| task-ni-walkthrough-recapture | 9429a61 | ROADMAP.md | 2026-11-15T18:00:01Z |
| task-ni-walkthrough-recapture | 7a42a91 | docs/visuals/how-to/ui_provenance.png | 2026-11-15T18:11:29Z |
| task-ni-walkthrough-recapture | 7a42a91 | docs/visuals/how-to/konspekt-howto-walkthrough.mp4 | 2026-11-15T18:11:29Z |
| task-ni-walkthrough-recapture | 4339330 | ROADMAP.md | 2026-11-15T18:13:18Z |
| task-ni-references | c954da1 | docs/design/source-addressing.md | 2026-11-15T19:14:25Z |
| task-ni-references | c954da1 | lib/conformance.mjs | 2026-11-15T19:14:25Z |
| task-ni-references | c954da1 | setup/README.md | 2026-11-15T19:14:25Z |
| task-ni-references | c954da1 | setup/templates/project.md | 2026-11-15T19:14:25Z |
| task-ni-references | c954da1 | spec/architecture/SERIALIZATION.md | 2026-11-15T19:14:25Z |
| task-ni-references | c954da1 | spec/data-model/schema.ts | 2026-11-15T19:14:25Z |
| task-ni-references | c954da1 | test/conformance-ni-refs.test.mjs | 2026-11-15T19:14:25Z |
| task-ni-references | c954da1 | test/migrate-ni.test.mjs | 2026-11-15T19:14:25Z |
| task-ni-references | c954da1 | test/setup-init.test.mjs | 2026-11-15T19:14:25Z |
| task-ni-references | c954da1 | tools/migrate-ni.mjs | 2026-11-15T19:14:25Z |
| task-ui-clickable-source-refs | 015820a | ROADMAP.md | 2026-11-21T02:32:28Z |
| task-ui-atom-neighborhood-graph | 66e63d5 | ROADMAP.md | 2026-11-21T02:58:48Z |
| task-ui-clickable-source-refs | 5accb4c40c0a18e4ce52a97104a12621669450cb | implementations/implementation-zero/app/server.mjs | 2026-11-21T14:21:53Z |
| task-ui-clickable-source-refs | 5accb4c40c0a18e4ce52a97104a12621669450cb | implementations/implementation-zero/app/test/server.test.mjs | 2026-11-21T14:21:53Z |
| task-ui-clickable-source-refs | 5accb4c40c0a18e4ce52a97104a12621669450cb | implementations/implementation-zero/app/view/app.css | 2026-11-21T14:21:53Z |
| task-ui-clickable-source-refs | 5accb4c40c0a18e4ce52a97104a12621669450cb | implementations/implementation-zero/app/view/app.js | 2026-11-21T14:21:53Z |
| task-ui-clickable-source-refs | 5accb4c40c0a18e4ce52a97104a12621669450cb | implementations/implementation-zero/app/view/index.html | 2026-11-21T14:21:53Z |
| task-ui-clickable-source-refs | 5accb4c40c0a18e4ce52a97104a12621669450cb | implementations/intellij-plugin/app/gradle.properties | 2026-11-21T14:21:53Z |
| task-ui-clickable-source-refs | 5accb4c40c0a18e4ce52a97104a12621669450cb | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt | 2026-11-21T14:21:53Z |
| task-ui-clickable-source-refs | 5accb4c40c0a18e4ce52a97104a12621669450cb | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/ViewServer.kt | 2026-11-21T14:21:53Z |
| task-ui-clickable-source-refs | 5accb4c40c0a18e4ce52a97104a12621669450cb | implementations/intellij-plugin/app/src/test/kotlin/dev/konspekt/plugin/InstanceReaderRefsTest.kt | 2026-11-21T14:21:53Z |
| task-ui-clickable-source-refs | 17197b610eec5201ca117cb5628f37f2fbbac630 | implementations/intellij-plugin/app/README.md | 2026-11-21T14:26:53Z |
| task-ui-clickable-source-refs | 8aca30e96a6e8ca28a49a76b5189029025606fba | ROADMAP.md | 2026-11-21T14:33:50Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/implementation-zero/app/projections.mjs | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/implementation-zero/app/server.mjs | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/implementation-zero/app/test/projections.test.mjs | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/implementation-zero/app/test/server.test.mjs | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/implementation-zero/app/view/app.css | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/implementation-zero/app/view/app.js | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/intellij-plugin/app/README.md | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/intellij-plugin/app/gradle.properties | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/ViewServer.kt | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | implementations/intellij-plugin/app/src/test/kotlin/dev/konspekt/plugin/InstanceReaderNeighborsTest.kt | 2026-11-21T15:06:32Z |
| task-ui-atom-neighborhood-graph | 3353cfbb1ceb31915be7d4466ebdd843bb378a96 | implementations/implementation-zero/app/view/app.css | 2026-11-21T15:16:15Z |
| task-ui-atom-neighborhood-graph | 3353cfbb1ceb31915be7d4466ebdd843bb378a96 | implementations/implementation-zero/app/view/app.js | 2026-11-21T15:16:15Z |
| task-ui-atom-neighborhood-graph | e0fba46273f8e9c78ddac305916d891210507aa3 | ROADMAP.md | 2026-11-21T15:24:53Z |
| task-ui-clickable-source-refs | 4241d7f31bc4b20eda6f46c902cbb1d157e1ebea | implementations/intellij-plugin/app/gradle.properties | 2026-11-21T16:11:22Z |
| task-ui-clickable-source-refs | 4241d7f31bc4b20eda6f46c902cbb1d157e1ebea | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/KonspektToolWindowFactory.kt | 2026-11-21T16:11:22Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/README.md | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/build_carousel.py | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/carousel.pdf | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/images/1_details_with_links.png | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/images/2_provenance_source_link.png | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/images/3_details_with_list_and_popup.png | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/images/4_graph_konspekt_depth2.png | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/images/5_graph_konspekt_full.png | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/images/6_graph_cdm_depth2.png | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/images/7_graph_cdm_full.png | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | e26c0e0e60574d7febe8308990bf14521b08c8bf | docs/announcements/linkedin/post_2026-11-22/post.md | 2026-11-21T16:37:57Z |
| task-linkedin-announce-graph-view | 62d0a382e82c062913b7c0d039f9cb8d52611705 | docs/announcements/linkedin/README.md | 2026-11-21T16:39:37Z |
| task-linkedin-announce-graph-view | 62d0a382e82c062913b7c0d039f9cb8d52611705 | docs/announcements/linkedin/post_2026-11-22/post.md | 2026-11-21T16:39:37Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/README.md | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/build_carousel.py | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/carousel.pdf | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/images/1_details_with_links.png | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/images/2_provenance_source_link.png | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/images/3_details_with_list_and_popup.png | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/images/4_graph_konspekt_depth2.png | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/images/5_graph_konspekt_full.png | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/images/6_graph_cdm_depth2.png | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/images/7_graph_cdm_full.png | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | docs/announcements/linkedin/post_2026-11-21/post.md | 2026-11-21T16:49:18Z |
| task-linkedin-announce-graph-view | 4280d2bdcb8821bc45b5cd668ee9153d8ba1504a | ROADMAP.md | 2026-11-22T15:31:25Z |
| task-ui-footer-write-actions | 2dc2e1d5b4e3f17106ee793db701c5a71d2f285d | implementations/implementation-zero/app/view/index.html | 2026-11-22T15:51:26Z |
| task-ui-footer-write-actions | 35240ef4ecce4a855c9b1d5103771f7c98463f20 | ROADMAP.md | 2026-11-22T15:51:34Z |
| task-review-unit-log | e2d91c37caed7d2477d426918b4af6086388923d | .konspekt/OPERATING.md | 2026-11-22T16:49:22Z |
| task-review-unit-log | e2d91c37caed7d2477d426918b4af6086388923d | ROADMAP.md | 2026-11-22T16:49:22Z |
| task-review-unit-log | e2d91c37caed7d2477d426918b4af6086388923d | lib/conformance.mjs | 2026-11-22T16:49:22Z |
| task-review-unit-log | e2d91c37caed7d2477d426918b4af6086388923d | spec/personas/engineer/AGENTS.md | 2026-11-22T16:49:22Z |
| task-review-unit-log | e2d91c37caed7d2477d426918b4af6086388923d | spec/personas/engineer/SPEC.md | 2026-11-22T16:49:22Z |
| task-review-unit-log | e2d91c37caed7d2477d426918b4af6086388923d | spec/personas/engineer/registry.mjs | 2026-11-22T16:49:22Z |
| task-review-unit-log | e2d91c37caed7d2477d426918b4af6086388923d | test/review-units.test.mjs | 2026-11-22T16:49:22Z |
| task-review-unit-log | e2d91c37caed7d2477d426918b4af6086388923d | tools/review-units.mjs | 2026-11-22T16:49:22Z |
| task-review-unit-log | d4abd99cd2d021a0989a4ef8bab587620a790d20 | .github/workflows/konspekt-review-units.yml | 2026-11-22T16:55:23Z |
| task-review-unit-log | d4abd99cd2d021a0989a4ef8bab587620a790d20 | .konspekt/OPERATING.md | 2026-11-22T16:55:23Z |
| task-review-unit-log | d4abd99cd2d021a0989a4ef8bab587620a790d20 | implementations/implementation-zero/app/server.mjs | 2026-11-22T16:55:23Z |
| task-review-unit-log | d4abd99cd2d021a0989a4ef8bab587620a790d20 | implementations/implementation-zero/app/view/app.js | 2026-11-22T16:55:23Z |
| task-review-unit-log | d4abd99cd2d021a0989a4ef8bab587620a790d20 | implementations/intellij-plugin/app/src/main/kotlin/dev/konspekt/plugin/InstanceReader.kt | 2026-11-22T16:55:23Z |
| task-review-unit-log | d4abd99cd2d021a0989a4ef8bab587620a790d20 | implementations/intellij-plugin/app/gradle.properties | 2026-11-22T16:55:23Z |
| task-review-unit-log | a86a142904f311e9a18e395e402032d28b62632e | ROADMAP.md | 2026-11-22T16:55:50Z |
| investigation-task-pr-map | 8870976d0989b193dbe919cb8fa8ab35c1ab8f7f | implementations/implementation-zero/app/view/app.js | 2026-11-22T17:14:10Z |
| investigation-task-pr-map | 8870976d0989b193dbe919cb8fa8ab35c1ab8f7f | implementations/intellij-plugin/app/gradle.properties | 2026-11-22T17:14:10Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | .github/workflows/konspekt-review-units.yml | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | .github/workflows/konspekt-review-units.yml | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | .konspekt/OPERATING.md | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | .konspekt/OPERATING.md | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | implementations/implementation-zero/app/server.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | implementations/implementation-zero/app/server.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | implementations/implementation-zero/app/view/app.js | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | implementations/implementation-zero/app/view/app.js | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | implementations/intellij-plugin/app/gradle.properties | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | implementations/intellij-plugin/app/gradle.properties | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | lib/conformance.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | lib/conformance.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | spec/personas/engineer/SPEC.md | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | spec/personas/engineer/SPEC.md | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | spec/personas/engineer/registry.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | spec/personas/engineer/registry.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | test/review-units-git.test.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | test/review-units-git.test.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | test/review-units.test.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | test/review-units.test.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | tools/binding-audit.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | tools/binding-audit.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 61936de1ce80893620d04017b0ec0132bb138841 | tools/review-units.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-landed-commits | 61936de1ce80893620d04017b0ec0132bb138841 | tools/review-units.mjs | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | c2ad2e0c410b6372b7024d0bc8898ac49e827103 | ROADMAP.md | 2026-11-22T19:04:19Z |
| task-review-unit-direct-rows | 45b70c14bc4309dcb46de89cb7a6517521f31b4e | ROADMAP.md | 2026-11-22T19:09:18Z |
