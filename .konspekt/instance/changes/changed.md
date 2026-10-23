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
