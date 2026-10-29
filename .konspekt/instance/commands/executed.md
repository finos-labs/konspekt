# Executed commands (engineer layer)

Append-only log binding each LLM-executed command to the entity it was about, one
row per execution in execution order (top to bottom is the timeline; there is no
stored timestamp). `command` is the git blob SHA of commands/<command>.md, which
holds the verbatim text. Written push-based at execution time.

Backfill note: these rows reconstruct the IntelliJ-plugin build in first-execution
order; the channel was not live during that work, so repeated runs are collapsed.
New rows below this backfill are recorded live.

| entity | command |
|--------|---------|
| task-intellij-plugin | d7af0071a5c5c218199ba899201ca54d4aa7f1cd |
| task-intellij-plugin | f25c7f09d71aa5746dd2273e70281fa87aabb701 |
| task-intellij-plugin | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-intellij-plugin | 451867baf7eff69f5ea0f475fce6b45054ead873 |
| task-intellij-plugin | 2434825abc523d17270385e39c14c475dd0657cf |
| task-related-commands-view | 665a4a190fbae07725ab359f16eb46eb09f8b24e |
| task-related-commands-view | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-asr-adr-ui | 665a4a190fbae07725ab359f16eb46eb09f8b24e |
| task-asr-adr-ui | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-plugin-pop-mode | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-plugin-pop-mode | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-plugin-pop-mode | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-record-code-changes | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-plugin-pop-mode | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-ui-simple-actions | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-ui-simple-actions | a507f620c5e3878fed269db1d24794cf843a8ee2 |
| task-ui-resolve-action | 97ef8feeb2273fd18e82c9d8bb05d1b91699755a |
| task-ui-resolve-action | b09be5556a9285dbab395d8e721e8bb31a6818f3 |
| task-ui-resolve-action | 627f256bd9c8ba5d69e0359958b146787234648b |
| task-ui-resolve-action | 665a4a190fbae07725ab359f16eb46eb09f8b24e |
| wp-adr-ui-resolve-action | 548440faad4c5dc0f8571f4a3383dfd3b7a19b9d |
| task-transition-log | f269e73dc6171ce3a0378cbc8c37275912e1f9e8 |
| task-transition-log | 3abc97780ac0a917faa0cb182109f8b659b171f2 |
| task-transition-log | 97ef8feeb2273fd18e82c9d8bb05d1b91699755a |
| task-authority-mechanism | 36d928599fb936e2ac5e29d02dd35f01ea4569b6 |
| task-authority-mechanism | 3abc97780ac0a917faa0cb182109f8b659b171f2 |
| task-authority-mechanism | 97ef8feeb2273fd18e82c9d8bb05d1b91699755a |
| task-acceptance-before-work | 36d928599fb936e2ac5e29d02dd35f01ea4569b6 |
| task-acceptance-before-work | 1813fed8007a190b1c0ee2276372c12845b2fe67 |
| task-acceptance-before-work | 89f98fb741e6b425a3505ff77afc8bc78364d75b |
| task-promo-video | 79ef83449b873b22bd8d11d2b78579854d8b8b2b |
| task-promo-video | 17979677eea4643abd215f054a4826d36906d85b |
| task-promo-video | 4626062f5076009f4f56120bb4c3890df6a4f215 |
| task-promo-video | 2e2747695e6ec2e29163034043d0c9e0beeb49df |
| task-promo-video | 28a4c5e43e6a664270d26019fe97b1790ba5615e |
| task-promo-video | 240a45558008056806d919c7646ac4c7612c1e4c |
| task-promo-video | 545dd01352aa4ba2c957ab24c241edd59424092e |
| task-promo-video | 4eaacdb3664e8a57dd9f29a0b22d534beb4e1273 |
| task-promo-video | de364bda9e3a88867385435dff3aa420633cfadc |
| task-promo-video | 1c61a435c7e69bea9de7b70a9ceeec65c0687f52 |
| task-promo-video | 56c076697f7e6497bb15c48d252b389d8fa82536 |
| task-promo-video | 3fd14eb58151f8a510b548161e3d704bfd03590b |
| task-promo-video | 8809283644f194a8c0098da1aaa75873da99ba12 |
| task-promo-video | e8a82913459b5b1695be5b1345992514f5707695 |
