# Changed code (engineer layer)

Append-only log binding each committed code change to the entity it was about,
one row per (entity, commit, file) in commit order (top to bottom is the
timeline; there is no stored timestamp). `commit` is the git commit SHA;
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

| entity | commit | file |
|--------|--------|------|
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
