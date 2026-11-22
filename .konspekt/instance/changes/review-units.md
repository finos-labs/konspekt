# Review units (engineer layer)

Derived by `node tools/review-units.mjs`; do not edit by hand. Each row links a
commit bound in `changed.md` to a review unit (on GitHub, a pull request) that
contains it, one row per (review unit, commit), in the changed-code log's
commit order. The entity is found through `changed.md`. `state` is open,
merged, or closed; `timestamp` is the unit's merge, else close, else creation
time. A commit on the default branch that no review unit contains has one
`direct` row, with no review unit or merge commit and the commit's committer
time; a commit with no row is not on the default branch yet, or not derived
yet. `landed` is the default-branch commit that carries the change; `match` is
`same`, `squash`, `patch-id`, or `position` (spec/personas/engineer/SPEC.md).

| review unit | state | merge commit | commit | timestamp | landed | match |
|-------------|-------|--------------|--------|-----------|--------|-------|
| https://github.com/finos-labs/konspekt/pull/27 | merged | 3f88b4ccac289d8d3949d8cd2351b482c6398cc3 | ba45f45766b15b7074cd3d79fa2739657fdf89c7 | 2026-09-20T19:02:45Z | ba45f45766b15b7074cd3d79fa2739657fdf89c7 | same |
| https://github.com/finos-labs/konspekt/pull/27 | merged | 3f88b4ccac289d8d3949d8cd2351b482c6398cc3 | 04198b0d108b1a5ad5d0a912e4ed5f7a580863af | 2026-09-20T19:02:45Z | 04198b0d108b1a5ad5d0a912e4ed5f7a580863af | same |
| https://github.com/finos-labs/konspekt/pull/27 | merged | 3f88b4ccac289d8d3949d8cd2351b482c6398cc3 | 280639ef9ea418e25c54b379c2d0b183b6062969 | 2026-09-20T19:02:45Z | 280639ef9ea418e25c54b379c2d0b183b6062969 | same |
| https://github.com/finos-labs/konspekt/pull/27 | merged | 3f88b4ccac289d8d3949d8cd2351b482c6398cc3 | 4d3239070a5c2d65abb34810b39568559eacc6b1 | 2026-09-20T19:02:45Z | 4d3239070a5c2d65abb34810b39568559eacc6b1 | same |
| https://github.com/finos-labs/konspekt/pull/27 | merged | 3f88b4ccac289d8d3949d8cd2351b482c6398cc3 | e81c602b6f2d9f29476d90cad9cfc8afe4135544 | 2026-09-20T19:02:45Z | e81c602b6f2d9f29476d90cad9cfc8afe4135544 | same |
| https://github.com/finos-labs/konspekt/pull/27 | merged | 3f88b4ccac289d8d3949d8cd2351b482c6398cc3 | 7116cb67025c328c2ab19c279f4c51ec0061972a | 2026-09-20T19:02:45Z | 7116cb67025c328c2ab19c279f4c51ec0061972a | same |
| https://github.com/finos-labs/konspekt/pull/29 | merged | fbf625f13de762ff2ca31369c65f1caebb053a78 | 774adc93e5469544d4eb231af5d8e1e4c360dd67 | 2026-09-20T21:01:25Z | 774adc93e5469544d4eb231af5d8e1e4c360dd67 | same |
| https://github.com/finos-labs/konspekt/pull/29 | merged | fbf625f13de762ff2ca31369c65f1caebb053a78 | 010e30d64bb6435bc07c8d6e662598612a7a9337 | 2026-09-20T21:01:25Z | 010e30d64bb6435bc07c8d6e662598612a7a9337 | same |
| https://github.com/finos-labs/konspekt/pull/29 | merged | fbf625f13de762ff2ca31369c65f1caebb053a78 | c0e0b24206aaa512d7699bc335f9845b9a56dee6 | 2026-09-20T21:01:25Z | c0e0b24206aaa512d7699bc335f9845b9a56dee6 | same |
| https://github.com/finos-labs/konspekt/pull/39 | merged | c717026fa7af50cc9f5180b85309904624d13a24 | 48bcc4df76f2d09a5f594f509fde97adc482e4ba | 2026-09-26T19:48:27Z | 48bcc4df76f2d09a5f594f509fde97adc482e4ba | same |
| https://github.com/finos-labs/konspekt/pull/43 | merged | 326bddaa432b215edca40ac8d69c421c00dbb8b1 | bd2623854300df7f84c092f4e5bfb4c28518a050 | 2026-09-26T23:50:24Z | bd2623854300df7f84c092f4e5bfb4c28518a050 | same |
| https://github.com/finos-labs/konspekt/pull/43 | merged | 326bddaa432b215edca40ac8d69c421c00dbb8b1 | ff1b2b86c668726ba6d2f075b28334b967c0cd17 | 2026-09-26T23:50:24Z | ff1b2b86c668726ba6d2f075b28334b967c0cd17 | same |
| https://github.com/finos-labs/konspekt/pull/44 | merged | 79b52d7e5c828f7692c619767be523fb052b33c2 | 869f0bf28bd818708674fa20ea84a63257935c04 | 2026-09-27T01:04:41Z | 869f0bf28bd818708674fa20ea84a63257935c04 | same |
| https://github.com/finos-labs/konspekt/pull/49 | merged | 656366df989e9c00f49147f63fafa2ad3a91f86c | 4fbd9c8016ced9dbbe886a6c8f2d411159bd6e89 | 2026-09-27T03:10:12Z | 4fbd9c8016ced9dbbe886a6c8f2d411159bd6e89 | same |
|  | direct |  | 1ecad2645ee531eb7179bc58b0480f55f2e1af8e | 2026-09-27T13:14:44Z | 1ecad2645ee531eb7179bc58b0480f55f2e1af8e | same |
|  | direct |  | b90b2d82dd45fa0be84bf61b31bb5224b03c5b43 | 2026-09-27T13:24:54Z | b90b2d82dd45fa0be84bf61b31bb5224b03c5b43 | same |
|  | direct |  | d45926ef45acc417aacebfc18c6e2429fa94b48e | 2026-09-27T14:15:29Z | d45926ef45acc417aacebfc18c6e2429fa94b48e | same |
|  | direct |  | b6698c594a79cfedc6c7e9c873df45fc5e094112 | 2026-09-27T14:29:38Z | b6698c594a79cfedc6c7e9c873df45fc5e094112 | same |
| https://github.com/finos-labs/konspekt/pull/50 | merged | f7c7cc49596ce41a9decff9efafd9ed39c06de7d | 2660a08e72e71d32e4d6853c176bf28ebfb3e19f | 2026-09-27T14:51:30Z | 2660a08e72e71d32e4d6853c176bf28ebfb3e19f | same |
|  | direct |  | 7f0fa63b055b30c1895430dbb5ffd19950bbaf24 | 2026-09-27T14:39:28Z | 7f0fa63b055b30c1895430dbb5ffd19950bbaf24 | same |
| https://github.com/finos-labs/konspekt/pull/51 | merged | 698a943c4fa72701de479bfd7f288484aa5c7308 | 03c1a8c4a1f30ded46a836d9dcad41d38d4a4c58 | 2026-09-27T14:57:22Z | 03c1a8c4a1f30ded46a836d9dcad41d38d4a4c58 | same |
| https://github.com/finos-labs/konspekt/pull/52 | merged | dd92c999b7c7d4810e4c043020a00c067f1be025 | b6187edec5f1f9456a0cc6562f4580d00d0e9035 | 2026-09-27T14:58:40Z | b6187edec5f1f9456a0cc6562f4580d00d0e9035 | same |
| https://github.com/finos-labs/konspekt/pull/54 | merged | c830dc641fa7bc520eda4eabb2b3eed56e03f50c | c559ee7181d2893a8fbe06b90763b047425e6993 | 2026-09-27T23:06:35Z | c559ee7181d2893a8fbe06b90763b047425e6993 | same |
| https://github.com/finos-labs/konspekt/pull/56 | merged | 95461d35be1a3340c65c5338c8b612844c1bb6c4 | 03d27b157746fac106ae39e10e4f8798b4ebc938 | 2026-09-28T23:28:21Z | 03d27b157746fac106ae39e10e4f8798b4ebc938 | same |
| https://github.com/finos-labs/konspekt/pull/58 | merged | bebd3dbf5c55f640918ac90f63e7ddc9d6ee1676 | c7bf98761555f7dd958666c73c14518ef6853d61 | 2026-09-29T00:23:22Z | c7bf98761555f7dd958666c73c14518ef6853d61 | same |
| https://github.com/finos-labs/konspekt/pull/59 | merged | c8b03d7e5fd7e2c19e69e44f1bbf43c1f0d54b83 | 8ffc64fe9a3fbc55a9bac32ad2981e76a28b556f | 2026-09-29T01:52:21Z | 8ffc64fe9a3fbc55a9bac32ad2981e76a28b556f | same |
| https://github.com/finos-labs/konspekt/pull/60 | merged | d4a3bfb6ccbdf9b2b5db239d565a785b85fa9939 | 933985e010d25d20328285c861a987003440b4a4 | 2026-09-29T02:57:33Z | 933985e010d25d20328285c861a987003440b4a4 | same |
| https://github.com/finos-labs/konspekt/pull/62 | merged | 1ce18a07c3bbc8f0e8c0e2bbf9c679f4d13d22c3 | 01eb116c2b9ef786a51b62dbb15c94bbd76028b6 | 2026-09-30T01:23:44Z | 01eb116c2b9ef786a51b62dbb15c94bbd76028b6 | same |
| https://github.com/finos-labs/konspekt/pull/64 | merged | 66c30a9327f7ee9910cc5889ebda6bb9f1666658 | c501ddddce709be1429d81405359d85410d548b5 | 2026-10-01T00:06:54Z | c501ddddce709be1429d81405359d85410d548b5 | same |
| https://github.com/finos-labs/konspekt/pull/64 | merged | 66c30a9327f7ee9910cc5889ebda6bb9f1666658 | c988a1ae2039c3c7018fd6e3b26cb2259a86ad0e | 2026-10-01T00:06:54Z | c988a1ae2039c3c7018fd6e3b26cb2259a86ad0e | same |
| https://github.com/finos-labs/konspekt/pull/66 | merged | 00e7db682b795e6080389ff284b0aba0e150478c | ce28d20132eaecabbd5ffee4c77a668e1cf55302 | 2026-10-02T23:28:46Z | ce28d20132eaecabbd5ffee4c77a668e1cf55302 | same |
| https://github.com/finos-labs/konspekt/pull/69 | merged | b217551c27a4a246283edc7c4f0eeb9ca5ca42a6 | 9cd74886219cd48d9509e7db797a040705a0a3fa | 2026-10-03T15:40:49Z | 9cd74886219cd48d9509e7db797a040705a0a3fa | same |
| https://github.com/finos-labs/konspekt/pull/70 | merged | 84f189d2118988d54b07276015a600f4568c03bb | 3832f492761b8a55513e269d9ae0eac533429271 | 2026-10-04T16:58:14Z | 3832f492761b8a55513e269d9ae0eac533429271 | same |
| https://github.com/finos-labs/konspekt/pull/71 | merged | 60edaf3523c4372c9058a261aedc732e090ff5b3 | 1b5ea14b39373b194d543bbfa57507fbf5de3650 | 2026-10-04T20:34:57Z | 1b5ea14b39373b194d543bbfa57507fbf5de3650 | same |
| https://github.com/finos-labs/konspekt/pull/73 | merged | 486785c24153a55ae8966554ec7ce9f1e59c00a9 | 87ba592409563050bdf20feeeba1f1964a4f51b3 | 2026-10-07T13:15:04Z | 87ba592409563050bdf20feeeba1f1964a4f51b3 | same |
| https://github.com/finos-labs/konspekt/pull/74 | merged | 1e531752042780bc5522190ca10016c5f015ec22 | 2a9785257f567c66b6cec6739a314231c1a3232a | 2026-10-07T16:16:48Z | 2a9785257f567c66b6cec6739a314231c1a3232a | same |
| https://github.com/finos-labs/konspekt/pull/74 | merged | 1e531752042780bc5522190ca10016c5f015ec22 | 75f11de5de5fb74014ce71c788567ab7eafe835b | 2026-10-07T16:16:48Z | 75f11de5de5fb74014ce71c788567ab7eafe835b | same |
| https://github.com/finos-labs/konspekt/pull/74 | merged | 1e531752042780bc5522190ca10016c5f015ec22 | 5c3928ff68964b099f6b6eeaca76f2f02da6868f | 2026-10-07T16:16:48Z | 5c3928ff68964b099f6b6eeaca76f2f02da6868f | same |
| https://github.com/finos-labs/konspekt/pull/74 | merged | 1e531752042780bc5522190ca10016c5f015ec22 | f8dd2d24e716a9ff1f59865b49509704b8d1b593 | 2026-10-07T16:16:48Z | f8dd2d24e716a9ff1f59865b49509704b8d1b593 | same |
| https://github.com/finos-labs/konspekt/pull/74 | merged | 1e531752042780bc5522190ca10016c5f015ec22 | 40a47d5659f6cf724b061b24180fb35b8b7c203b | 2026-10-07T16:16:48Z | 40a47d5659f6cf724b061b24180fb35b8b7c203b | same |
| https://github.com/finos-labs/konspekt/pull/78 | merged | d411aeef1e6282c936919449360d8d6620165538 | 6750f9de900a108f5e85ca22ea09d2b87e99343f | 2026-10-08T01:52:51Z | 6750f9de900a108f5e85ca22ea09d2b87e99343f | same |
| https://github.com/finos-labs/konspekt/pull/78 | merged | d411aeef1e6282c936919449360d8d6620165538 | 95953f956ca3f3e7b57be927932527aa58b57260 | 2026-10-08T01:52:51Z | 95953f956ca3f3e7b57be927932527aa58b57260 | same |
| https://github.com/finos-labs/konspekt/pull/78 | merged | d411aeef1e6282c936919449360d8d6620165538 | cd44f8f7a2e6bb663d5be6090588d6cabf878a33 | 2026-10-08T01:52:51Z | cd44f8f7a2e6bb663d5be6090588d6cabf878a33 | same |
| https://github.com/finos-labs/konspekt/pull/78 | merged | d411aeef1e6282c936919449360d8d6620165538 | 4d8831a9fd298adb295f5ba9de193b8b3ce7b498 | 2026-10-08T01:52:51Z | 4d8831a9fd298adb295f5ba9de193b8b3ce7b498 | same |
| https://github.com/finos-labs/konspekt/pull/76 | merged | dddc8c9dcd073b90159be34d5b48426984b8c0a9 | 0714bc822345c5462dece3df5d4e11e0c6ce881d | 2026-10-07T23:47:21Z | 0714bc822345c5462dece3df5d4e11e0c6ce881d | same |
| https://github.com/finos-labs/konspekt/pull/77 | merged | 331546d3523db3aa92ec4d450d0ea4f4e4a310b5 | 8687dc1349be6630199160156d2df64f5a4c0550 | 2026-10-08T01:48:57Z | 8687dc1349be6630199160156d2df64f5a4c0550 | same |
| https://github.com/finos-labs/konspekt/pull/77 | merged | 331546d3523db3aa92ec4d450d0ea4f4e4a310b5 | b876bf1df2692dd4359809936973b2e9d7f89ab5 | 2026-10-08T01:48:57Z | b876bf1df2692dd4359809936973b2e9d7f89ab5 | same |
| https://github.com/finos-labs/konspekt/pull/77 | merged | 331546d3523db3aa92ec4d450d0ea4f4e4a310b5 | 532825773e01ab98d5256499326e5b2ff763a7b3 | 2026-10-08T01:48:57Z | 532825773e01ab98d5256499326e5b2ff763a7b3 | same |
|  | direct |  | a31159b336f7bfed3baba7fc744298a924270a50 | 2026-10-10T13:01:11Z | a31159b336f7bfed3baba7fc744298a924270a50 | same |
|  | direct |  | f7fe89c0f8baeeb86ca9d86f8f51657478c32ef7 | 2026-10-10T13:25:33Z | f7fe89c0f8baeeb86ca9d86f8f51657478c32ef7 | same |
|  | direct |  | f26532ab424398c40f65e114546e9e45edcac6ad | 2026-10-10T13:27:49Z | f26532ab424398c40f65e114546e9e45edcac6ad | same |
|  | direct |  | 0c6af440c2e79c9c89f7fe24465c766b4c63d9a7 | 2026-10-10T13:30:47Z | 0c6af440c2e79c9c89f7fe24465c766b4c63d9a7 | same |
|  | direct |  | 5cf9a8fd4b25024cd94cffaa432db91df6b6ad4c | 2026-10-10T13:45:13Z | 5cf9a8fd4b25024cd94cffaa432db91df6b6ad4c | same |
|  | direct |  | 0dd67e5a0a68bf1b53eeb2778bcb1d2cb208f47d | 2026-10-10T15:32:30Z | 0dd67e5a0a68bf1b53eeb2778bcb1d2cb208f47d | same |
|  | direct |  | 445670d2e80d477503a6931f8051f3d51d5932dd | 2026-10-10T15:36:50Z | 445670d2e80d477503a6931f8051f3d51d5932dd | same |
|  | direct |  | 0b1ca0cf16eba4d3ffda49559372701f98548b6d | 2026-10-10T15:41:36Z | 0b1ca0cf16eba4d3ffda49559372701f98548b6d | same |
|  | direct |  | 8abb3797a9c1548fae79c901675caee4b17c8b89 | 2026-10-10T15:57:45Z | 8abb3797a9c1548fae79c901675caee4b17c8b89 | same |
|  | direct |  | b35fbcb48d4cf7c3aaa29d3e3f49f5e7d786f4c2 | 2026-10-10T16:03:05Z | b35fbcb48d4cf7c3aaa29d3e3f49f5e7d786f4c2 | same |
|  | direct |  | b73f55910a62ae7ec0c94893406e19cb3fe764aa | 2026-10-10T16:18:09Z | b73f55910a62ae7ec0c94893406e19cb3fe764aa | same |
|  | direct |  | c9701f936d43681a13aeedcb2049bf5b877484bf | 2026-10-10T17:16:58Z | c9701f936d43681a13aeedcb2049bf5b877484bf | same |
|  | direct |  | badb47df614f498971937508266fca8b6dd90a63 | 2026-10-10T22:16:51Z | badb47df614f498971937508266fca8b6dd90a63 | same |
|  | direct |  | ce5c9ff21ab083c4b6d54c51c3aadb0f17dd0a98 | 2026-10-11T01:28:44Z | ce5c9ff21ab083c4b6d54c51c3aadb0f17dd0a98 | same |
|  | direct |  | c83c4c08ad5dd95d69f3da55995b33dc4ec39192 | 2026-10-11T15:29:56Z | c83c4c08ad5dd95d69f3da55995b33dc4ec39192 | same |
|  | direct |  | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | 2026-10-12T01:29:45Z | 06c0c52a10235f2a1537653ebf1b5410619a25b1 | same |
|  | direct |  | 10589961311a065e6f042389535a48553bb28a82 | 2026-10-13T01:58:47Z | 10589961311a065e6f042389535a48553bb28a82 | same |
| https://github.com/finos-labs/konspekt/pull/84 | merged | d8a1f2f7230695116b3ebea5a555ec9085bdef5d | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | 2026-10-15T00:13:57Z | 83f8e5494addbc76acbab95f70c9f0bf88457a5f | same |
| https://github.com/finos-labs/konspekt/pull/84 | merged | d8a1f2f7230695116b3ebea5a555ec9085bdef5d | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | 2026-10-15T00:13:57Z | 4d73a7d6c70afe9dcb8c0f3d27c9ae2f5e8dea4a | same |
| https://github.com/finos-labs/konspekt/pull/84 | merged | d8a1f2f7230695116b3ebea5a555ec9085bdef5d | 9be386b3c8a2b37afd42e636e4bd1bc264a4c76a | 2026-10-15T00:13:57Z | 9be386b3c8a2b37afd42e636e4bd1bc264a4c76a | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 0ac3d9a9dc094efd30cd9a35f93cccf60e2714e4 | 2026-10-22T22:19:30Z | 0ac3d9a9dc094efd30cd9a35f93cccf60e2714e4 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 8816ff7686356101a8774913f94c37d77b85bddc | 2026-10-22T22:19:30Z | 8816ff7686356101a8774913f94c37d77b85bddc | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 97358eec1b6602f77bd5c950e787b435b2ae83e4 | 2026-10-22T22:19:30Z | 97358eec1b6602f77bd5c950e787b435b2ae83e4 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | d1715a0ca76183c2df5c614f7ea298140c442a21 | 2026-10-22T22:19:30Z | d1715a0ca76183c2df5c614f7ea298140c442a21 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | e2941dfdb2a71aadb52bbc98b00d041d5a272413 | 2026-10-22T22:19:30Z | e2941dfdb2a71aadb52bbc98b00d041d5a272413 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 26d272f49f402647d3d44751e141cc687bab064f | 2026-10-22T22:19:30Z | 26d272f49f402647d3d44751e141cc687bab064f | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 532eb07d49fc37fc14397f3351beb934561331cc | 2026-10-22T22:19:30Z | 532eb07d49fc37fc14397f3351beb934561331cc | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 2518cd1d60b418c4ed1ecd0678e2e9ba14423d27 | 2026-10-22T22:19:30Z | 2518cd1d60b418c4ed1ecd0678e2e9ba14423d27 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | bd0d25071505522a003f05c44f9fba1d9c6b4583 | 2026-10-22T22:19:30Z | bd0d25071505522a003f05c44f9fba1d9c6b4583 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | c541ee158f4efeff6c6eb3ada6929136336cfd07 | 2026-10-22T22:19:30Z | c541ee158f4efeff6c6eb3ada6929136336cfd07 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | e6fe2e070ed7c4f10d21c8eb94c98ccc5412fa50 | 2026-10-22T22:19:30Z | e6fe2e070ed7c4f10d21c8eb94c98ccc5412fa50 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 4d27ffe17f127d03facc703a097a8651292a8b0f | 2026-10-22T22:19:30Z | 4d27ffe17f127d03facc703a097a8651292a8b0f | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | c3d7bd3618e94e4785f0027a8cc38285b42c93ff | 2026-10-22T22:19:30Z | c3d7bd3618e94e4785f0027a8cc38285b42c93ff | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 76d4e25cb11bbf205259aa188d8e2177e32390c4 | 2026-10-22T22:19:30Z | 76d4e25cb11bbf205259aa188d8e2177e32390c4 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | bb2162a88a84e460d16a04227f2e8a34c8edec6d | 2026-10-22T22:19:30Z | bb2162a88a84e460d16a04227f2e8a34c8edec6d | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | f62a251aabe41beb2123e420172ea0167424d487 | 2026-10-22T22:19:30Z | f62a251aabe41beb2123e420172ea0167424d487 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 3579593fdcad47ccc3f8393fd1ac99c42322786b | 2026-10-22T22:19:30Z | 3579593fdcad47ccc3f8393fd1ac99c42322786b | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | d2a9b07e0c03c96724cb8a4b16f2bc31f1ade3ba | 2026-10-22T22:19:30Z | d2a9b07e0c03c96724cb8a4b16f2bc31f1ade3ba | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 6ff3aade9056ae53da991c1ad372100581b141bb | 2026-10-22T22:19:30Z | 6ff3aade9056ae53da991c1ad372100581b141bb | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | f65db5f914b8095118103040d2c5bd079c966735 | 2026-10-22T22:19:30Z | f65db5f914b8095118103040d2c5bd079c966735 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | 0f6db1a6e6e9f07ed777174a85f878d4a49e1696 | 2026-10-22T22:19:30Z | 0f6db1a6e6e9f07ed777174a85f878d4a49e1696 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | c2a059bf935f64eb121a2601a37b9479538a3d80 | 2026-10-22T22:19:30Z | c2a059bf935f64eb121a2601a37b9479538a3d80 | same |
| https://github.com/finos-labs/konspekt/pull/88 | merged | c143358407517b67709a09b9820d922562246687 | fa9b88bc381b3e450cea9d1c89e75296fa50da35 | 2026-10-22T22:19:30Z | fa9b88bc381b3e450cea9d1c89e75296fa50da35 | same |
| https://github.com/finos-labs/konspekt/pull/86 | merged | 287d41a9fee73a9c2c2823735d547b1b0dfa463d | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | 2026-10-15T02:01:32Z | a4274bfcbbd50e595a73d2b9b52f07bb1af119f6 | same |
| https://github.com/finos-labs/konspekt/pull/86 | merged | 287d41a9fee73a9c2c2823735d547b1b0dfa463d | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | 2026-10-15T02:01:32Z | c9cd86e2fd90ecd8991159b7d1bb8152ee160e57 | same |
| https://github.com/finos-labs/konspekt/pull/86 | merged | 287d41a9fee73a9c2c2823735d547b1b0dfa463d | 36052038f6841b5e2057c2e3bfa00bc8fd1d7978 | 2026-10-15T02:01:32Z | 36052038f6841b5e2057c2e3bfa00bc8fd1d7978 | same |
| https://github.com/finos-labs/konspekt/pull/87 | merged | abdcecd48ba9431f21cac209d204052d8b834899 | 59c37d8971eedce3b22122dcdbdfcb04ff27366e | 2026-10-15T02:18:22Z | 59c37d8971eedce3b22122dcdbdfcb04ff27366e | same |
| https://github.com/finos-labs/konspekt/pull/90 | merged | 11371a2ef94d97d285e5ae0a957713595126a9fd | 7e166f6cfa486b7ec4445aa82842a9ed8ab89c1e | 2026-10-23T17:46:15Z | 7e166f6cfa486b7ec4445aa82842a9ed8ab89c1e | same |
| https://github.com/finos-labs/konspekt/pull/92 | merged | cd920ada0b15293ded89acdf7db52c4131bf0260 | c4e6c54f146841c9ea15aa7a8ad6bf7785d8271f | 2026-10-23T21:41:14Z | c4e6c54f146841c9ea15aa7a8ad6bf7785d8271f | same |
| https://github.com/finos-labs/konspekt/pull/91 | merged | 5d8d31d2a5e529c762a773c545d88841e302377c | cdafc0fda0f85c55f1e833e0c75a4b1ec955dd7a | 2026-10-23T21:36:04Z | cdafc0fda0f85c55f1e833e0c75a4b1ec955dd7a | same |
| https://github.com/finos-labs/konspekt/pull/91 | merged | 5d8d31d2a5e529c762a773c545d88841e302377c | c6cc7059ab70eee5c7db6f3a2c47e945535a5876 | 2026-10-23T21:36:04Z | c6cc7059ab70eee5c7db6f3a2c47e945535a5876 | same |
| https://github.com/finos-labs/konspekt/pull/92 | merged | cd920ada0b15293ded89acdf7db52c4131bf0260 | caaf08284082dde3c6b12217d58c37d8c2daa4b1 | 2026-10-23T21:41:14Z | caaf08284082dde3c6b12217d58c37d8c2daa4b1 | same |
| https://github.com/finos-labs/konspekt/pull/94 | merged | 0e5cc8817082e4f49b415b54c07466687df50118 | 49b0b4933b0e0b9524efa2eaaf993b18512e9d71 | 2026-10-23T22:47:19Z | 49b0b4933b0e0b9524efa2eaaf993b18512e9d71 | same |
| https://github.com/finos-labs/konspekt/pull/94 | merged | 0e5cc8817082e4f49b415b54c07466687df50118 | dc6cf6c0db623ab7535e0e5381d6303b5494d245 | 2026-10-23T22:47:19Z | dc6cf6c0db623ab7535e0e5381d6303b5494d245 | same |
|  | direct |  | d71797f741bca0f296d4eb77fc097e0c564a8d58 | 2026-10-24T14:53:40Z | d71797f741bca0f296d4eb77fc097e0c564a8d58 | same |
|  | direct |  | 3ed36fac434b8cd407eff52a4aed7fdcaa9882ec | 2026-10-24T15:04:51Z | 3ed36fac434b8cd407eff52a4aed7fdcaa9882ec | same |
|  | direct |  | c6c618e22ac8186da1e343d01f5701cb12a61152 | 2026-10-24T15:24:03Z | c6c618e22ac8186da1e343d01f5701cb12a61152 | same |
|  | direct |  | bc4f3043ef572deb9ffc894b78facd462067e89f | 2026-10-24T15:30:53Z | bc4f3043ef572deb9ffc894b78facd462067e89f | same |
|  | direct |  | 849e2192ec02e1dd7661671002526282429f7d8c | 2026-10-24T15:38:18Z | 849e2192ec02e1dd7661671002526282429f7d8c | same |
| https://github.com/finos-labs/konspekt/pull/96 | merged | 11c86da47e46a27733d4d86859bfdb19b711b01b | b9b42fe5d6c6742de0ff6510d9973a3500070a0b | 2026-10-25T01:52:07Z | b9b42fe5d6c6742de0ff6510d9973a3500070a0b | same |
| https://github.com/finos-labs/konspekt/pull/96 | merged | 11c86da47e46a27733d4d86859bfdb19b711b01b | 98fb8fccd5eb07c6c5a624c294a0adb68c6f208b | 2026-10-25T01:52:07Z | 98fb8fccd5eb07c6c5a624c294a0adb68c6f208b | same |
|  | direct |  | 6097d650bdec55812c91a112dcf4ace0e367f3c0 | 2026-10-25T14:30:06Z | 6097d650bdec55812c91a112dcf4ace0e367f3c0 | same |
|  | direct |  | b39ac80f1537cb41ef3625bcafee1489d4c793c5 | 2026-10-25T14:35:50Z | b39ac80f1537cb41ef3625bcafee1489d4c793c5 | same |
|  | direct |  | 68178f8cb373e79e3e32e6c07da2e810da8c76db | 2026-10-25T14:59:27Z | 68178f8cb373e79e3e32e6c07da2e810da8c76db | same |
|  | direct |  | 7214040f8d7b28bddcd570d860c1e9d67f5ac914 | 2026-10-25T16:24:33Z | 7214040f8d7b28bddcd570d860c1e9d67f5ac914 | same |
|  | direct |  | 211b21419906740729ae18ae60024e0d9c3e0dd5 | 2026-10-25T16:32:18Z | 211b21419906740729ae18ae60024e0d9c3e0dd5 | same |
|  | direct |  | 4d9032cc826609a00ad849857de3f1d15230444d | 2026-10-25T19:00:11Z | 4d9032cc826609a00ad849857de3f1d15230444d | same |
|  | direct |  | eccd9af4e2ce694acf9c5c136d75d65197beba26 | 2026-10-25T23:02:25Z | eccd9af4e2ce694acf9c5c136d75d65197beba26 | same |
|  | direct |  | e65347006e8cf2b8cc625b3434e22d2742ce68ec | 2026-10-26T21:09:21Z | e65347006e8cf2b8cc625b3434e22d2742ce68ec | same |
|  | direct |  | 2de7d453415d37481613dbff4b08362c3cdc0bf3 | 2026-10-26T21:17:04Z | 2de7d453415d37481613dbff4b08362c3cdc0bf3 | same |
|  | direct |  | b595d5589c8a9e47ba729a8cd97e6f9a8d7308c9 | 2026-10-29T20:41:54Z | b595d5589c8a9e47ba729a8cd97e6f9a8d7308c9 | same |
|  | direct |  | 4bdc2459925ffe75cf9271f99b2e6f0e6d186c7e | 2026-10-29T21:24:56Z | 4bdc2459925ffe75cf9271f99b2e6f0e6d186c7e | same |
|  | direct |  | fe5fc1b2c8f807b04163b76f630254d35bc1876b | 2026-10-29T21:25:20Z | fe5fc1b2c8f807b04163b76f630254d35bc1876b | same |
|  | direct |  | 8e5642f305f4d707cf61e827d818470993f3519d | 2026-10-29T21:45:08Z | 8e5642f305f4d707cf61e827d818470993f3519d | same |
|  | direct |  | 37ce34cc7c03431927d7ee9920d4fe652249fed0 | 2026-10-29T21:57:04Z | 37ce34cc7c03431927d7ee9920d4fe652249fed0 | same |
| https://github.com/finos-labs/konspekt/pull/102 | merged | a0cc354ebd9cb04762679d47c6cf6e456093c33c | 3f76163fe2e518b5a386f6581d32956af48e325e | 2026-11-04T02:58:40Z | 3f76163fe2e518b5a386f6581d32956af48e325e | same |
|  | direct |  | 99c67afcec56f91260973ecc5a9e3825a279e5a6 | 2026-10-29T22:12:09Z | 99c67afcec56f91260973ecc5a9e3825a279e5a6 | same |
| https://github.com/finos-labs/konspekt/pull/103 | merged | 137a21521574b144440adb0a605d201ec3727958 | ebc2f13d98e9cbf344d42083246c37f446a14dcb | 2026-11-06T21:48:32Z | ebc2f13d98e9cbf344d42083246c37f446a14dcb | same |
| https://github.com/finos-labs/konspekt/pull/104 | merged | 01336d04e7dac5e6d29e58c02fab73b7ace9eaf9 | f83a8301f719bf089f033ad9684bf147b95e1253 | 2026-11-06T22:48:01Z | f83a8301f719bf089f033ad9684bf147b95e1253 | same |
| https://github.com/finos-labs/konspekt/pull/105 | merged | 689b08a3b0a9c674e3497d4c0b189ba99fadb049 | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | 2026-11-07T16:01:49Z | ef5644e47f9a3e154fa8c73d2ba106d8165d6df8 | same |
| https://github.com/finos-labs/konspekt/pull/106 | merged | 19769b52d2b3c8bfbef86ad9c0817e820af25049 | 88422d7af0e950e27f547e9b56504673c69bd180 | 2026-11-07T18:22:01Z | 88422d7af0e950e27f547e9b56504673c69bd180 | same |
|  | direct |  | e719182b239a3b9492b65ec0aa4f8c0afdb4a11b | 2026-11-07T22:10:32Z | e719182b239a3b9492b65ec0aa4f8c0afdb4a11b | same |
|  | direct |  | cf443de939130e9a7b27985b57fa2a8ca6eab557 | 2026-11-07T22:10:47Z | cf443de939130e9a7b27985b57fa2a8ca6eab557 | same |
|  | direct |  | d749f88dca932c443767f58c3e7f44c66c4242db | 2026-11-11T18:00:07Z | d749f88dca932c443767f58c3e7f44c66c4242db | same |
|  | direct |  | ecf115121c74006473371f29ef50a4396fea6949 | 2026-11-11T18:14:03Z | ecf115121c74006473371f29ef50a4396fea6949 | same |
|  | direct |  | 78df98db206fe23016077fe84934de238b48304e | 2026-11-11T18:23:11Z | 78df98db206fe23016077fe84934de238b48304e | same |
|  | direct |  | 74874643390b09d42fdfe42f025f0fe0d41d1042 | 2026-11-11T18:23:11Z | 74874643390b09d42fdfe42f025f0fe0d41d1042 | same |
| https://github.com/finos-labs/konspekt/pull/108 | merged | 337857e2bba2a9c0b2c10a0a9f9482df80627133 | 3beb05691360ac0671444a1744fda647aeeaada5 | 2026-11-13T01:24:10Z | 3beb05691360ac0671444a1744fda647aeeaada5 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | bd14a5ecb6b8f3754f985e138d7035345314e7bf | 2026-11-15T01:13:19Z | bd14a5ecb6b8f3754f985e138d7035345314e7bf | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | bd177f96d83ac8167437df31996e80a5c4662de7 | 2026-11-15T01:13:19Z | bd177f96d83ac8167437df31996e80a5c4662de7 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 0c1aee6cd2e09d94e522336efa3ab1fa8a59fc46 | 2026-11-15T01:13:19Z | 0c1aee6cd2e09d94e522336efa3ab1fa8a59fc46 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 9be768f133536429abe17a6543d4d5bdbc8da72a | 2026-11-15T01:13:19Z | 9be768f133536429abe17a6543d4d5bdbc8da72a | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 68de1d218cff26ac6888816517042af25ba74166 | 2026-11-15T01:13:19Z | 68de1d218cff26ac6888816517042af25ba74166 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | cc26302bf46a3064f16c5e00d0c4079ac5674e2b | 2026-11-15T01:13:19Z | cc26302bf46a3064f16c5e00d0c4079ac5674e2b | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | bc82b556d441d47128072c349d5edae0012ffd38 | 2026-11-15T01:13:19Z | bc82b556d441d47128072c349d5edae0012ffd38 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 36fc1d8911f9e12625e5195695e63511c35ecd3a | 2026-11-15T01:13:19Z | 36fc1d8911f9e12625e5195695e63511c35ecd3a | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 666f911c36db36232b2d7d81934a674451f1bb63 | 2026-11-15T01:13:19Z | 666f911c36db36232b2d7d81934a674451f1bb63 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 01c3029b098b501282922bf9a084b9e458d7a64b | 2026-11-15T01:13:19Z | 01c3029b098b501282922bf9a084b9e458d7a64b | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 742698af3680a1556db7bfe728023c0a28349c3c | 2026-11-15T01:13:19Z | 742698af3680a1556db7bfe728023c0a28349c3c | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 0000297f1e81b85ae69268df7be8fc3db8800eda | 2026-11-15T01:13:19Z | 0000297f1e81b85ae69268df7be8fc3db8800eda | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 3ab83d189d1ba3a099dbc40de2b55e1de8aa7d6e | 2026-11-15T01:13:19Z | 3ab83d189d1ba3a099dbc40de2b55e1de8aa7d6e | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | dbbe4d0d3608c24ad223bbb796d0f9fb73cb4df9 | 2026-11-15T01:13:19Z | dbbe4d0d3608c24ad223bbb796d0f9fb73cb4df9 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 053537c5433614ec66a13b8fb3a8c08ee67b3ba6 | 2026-11-15T01:13:19Z | 053537c5433614ec66a13b8fb3a8c08ee67b3ba6 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 675b6a29a8cd6f1378664190b76ee0ff18592672 | 2026-11-15T01:13:19Z | 675b6a29a8cd6f1378664190b76ee0ff18592672 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 07cf0d3ab2c7852387537c34af14b2907d72c55f | 2026-11-15T01:13:19Z | 07cf0d3ab2c7852387537c34af14b2907d72c55f | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 183cc38da99bcd30880e02034c598eca05778be3 | 2026-11-15T01:13:19Z | 183cc38da99bcd30880e02034c598eca05778be3 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | b7c26b7ba010b0e9742a7c82a8707815c9ac6fbd | 2026-11-15T01:13:19Z | b7c26b7ba010b0e9742a7c82a8707815c9ac6fbd | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 1a9b14096f634db2b951890c59bd4b44d71d739f | 2026-11-15T01:13:19Z | 1a9b14096f634db2b951890c59bd4b44d71d739f | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | dec86e3aea527c80cd434a0c72704b82283d89a0 | 2026-11-15T01:13:19Z | dec86e3aea527c80cd434a0c72704b82283d89a0 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 7e122952fd5ff63052f4e282ad839e2eb1c31c18 | 2026-11-15T01:13:19Z | 7e122952fd5ff63052f4e282ad839e2eb1c31c18 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | a98e9f1590492bb89c48c2d5a7cfaea530c7e254 | 2026-11-15T01:13:19Z | a98e9f1590492bb89c48c2d5a7cfaea530c7e254 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | d42c833481f16c2af2a68a45bf58a345d9c3b738 | 2026-11-15T01:13:19Z | d42c833481f16c2af2a68a45bf58a345d9c3b738 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 3ed03f8610bf24fcc368cf171ccf9d710f20177c | 2026-11-15T01:13:19Z | 3ed03f8610bf24fcc368cf171ccf9d710f20177c | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 2e76727b83b44b867f82d4d08aa642b19c26fa43 | 2026-11-15T01:13:19Z | 2e76727b83b44b867f82d4d08aa642b19c26fa43 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 9bbe2df3730f5fb0ab09822af3cc326308ccbbcb | 2026-11-15T01:13:19Z | 9bbe2df3730f5fb0ab09822af3cc326308ccbbcb | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 83b282cb664a99501327a7b610ba76051b54492d | 2026-11-15T01:13:19Z | 83b282cb664a99501327a7b610ba76051b54492d | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | d1f511b432ad89928d69c3896ed3a3530f4dd070 | 2026-11-15T01:13:19Z | d1f511b432ad89928d69c3896ed3a3530f4dd070 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 41aeebc7880cf112e54f8c645fbb04ec245e0eb1 | 2026-11-15T01:13:19Z | 41aeebc7880cf112e54f8c645fbb04ec245e0eb1 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 3222f4a0763e139414a0a196d12537eb73e534a1 | 2026-11-15T01:13:19Z | 3222f4a0763e139414a0a196d12537eb73e534a1 | same |
| https://github.com/finos-labs/konspekt/pull/109 | merged | e872aa93a8b938acbc1ac302e6b72a358b8f4eef | 134063216c81f82a29b3dc09b915f6f33142e275 | 2026-11-15T01:13:19Z | 134063216c81f82a29b3dc09b915f6f33142e275 | same |
| https://github.com/finos-labs/konspekt/pull/111 | merged | 84f3114de89ca8855708ca99821081c5f43814aa | 03d10c7a828d5713e73983cd5d868edf168941dc | 2026-11-15T16:33:53Z | 03d10c7a828d5713e73983cd5d868edf168941dc | same |
| https://github.com/finos-labs/konspekt/pull/111 | merged | 84f3114de89ca8855708ca99821081c5f43814aa | 34b404a36a797fc19156be47808f8fe6cb723467 | 2026-11-15T16:33:53Z | 34b404a36a797fc19156be47808f8fe6cb723467 | same |
| https://github.com/finos-labs/konspekt/pull/111 | merged | 84f3114de89ca8855708ca99821081c5f43814aa | bb43a003e79278c6eb803b44d0fd603cefd4b9bf | 2026-11-15T16:33:53Z | bb43a003e79278c6eb803b44d0fd603cefd4b9bf | same |
| https://github.com/finos-labs/konspekt/pull/112 | merged | d23ac1aff0c06f4b4caa6f4b047ba93925ac5ce8 | addc3de8f8f4835bdbfb80c1d8c309cba0001df7 | 2026-11-15T15:59:47Z | addc3de8f8f4835bdbfb80c1d8c309cba0001df7 | same |
| https://github.com/finos-labs/konspekt/pull/112 | merged | d23ac1aff0c06f4b4caa6f4b047ba93925ac5ce8 | b94af594c5415a89fdb8bd361cbe5add22fe96a7 | 2026-11-15T15:59:47Z | b94af594c5415a89fdb8bd361cbe5add22fe96a7 | same |
| https://github.com/finos-labs/konspekt/pull/112 | merged | d23ac1aff0c06f4b4caa6f4b047ba93925ac5ce8 | 893a717cf59443622d6d4e7ef9eeb0b4ccea192e | 2026-11-15T15:59:47Z | 893a717cf59443622d6d4e7ef9eeb0b4ccea192e | same |
| https://github.com/finos-labs/konspekt/pull/112 | merged | d23ac1aff0c06f4b4caa6f4b047ba93925ac5ce8 | 5156071042d4b225f732cc1d5f058179cd737383 | 2026-11-15T15:59:47Z | 5156071042d4b225f732cc1d5f058179cd737383 | same |
| https://github.com/finos-labs/konspekt/pull/111 | merged | 84f3114de89ca8855708ca99821081c5f43814aa | 986c4bf170b13fcbab167d9f7713c0b28d64b2c3 | 2026-11-15T16:33:53Z | 986c4bf170b13fcbab167d9f7713c0b28d64b2c3 | same |
| https://github.com/finos-labs/konspekt/pull/113 | merged | 9b8fba8304b7dbdb0510b21392fde882a6fdf92d | afaf1d84558c66b9e7cc34395fa4cad17a9a5c26 | 2026-11-15T16:10:57Z | afaf1d84558c66b9e7cc34395fa4cad17a9a5c26 | same |
| https://github.com/finos-labs/konspekt/pull/111 | merged | 84f3114de89ca8855708ca99821081c5f43814aa | b36393628e041da41dd52d396f4973faf32be621 | 2026-11-15T16:33:53Z | b36393628e041da41dd52d396f4973faf32be621 | same |
|  | direct |  | ab16fc34a8ed17295cedc1b178c65dd2d2203dd1 | 2026-11-15T16:55:51Z | ab16fc34a8ed17295cedc1b178c65dd2d2203dd1 | same |
|  | direct |  | a9cf2a77a7d14fcf56c2d2b2ea0afc8fdcb26554 | 2026-11-15T16:57:34Z | a9cf2a77a7d14fcf56c2d2b2ea0afc8fdcb26554 | same |
|  | direct |  | f4daa28b90dbbc8b8f13664f4bd39f3d3a551705 | 2026-11-15T16:58:10Z | f4daa28b90dbbc8b8f13664f4bd39f3d3a551705 | same |
|  | direct |  | 1cccfea8b8ff915c12ce4b92fc12503d64f0066f | 2026-11-15T17:22:37Z | 1cccfea8b8ff915c12ce4b92fc12503d64f0066f | same |
|  | direct |  | 30cdbcf1c0713591aa27218412a846422ade65da | 2026-11-15T17:24:41Z | 30cdbcf1c0713591aa27218412a846422ade65da | same |
|  | direct |  | f218cbd5394f78cd834c7854252be283648a9462 | 2026-11-15T17:26:28Z | f218cbd5394f78cd834c7854252be283648a9462 | same |
|  | direct |  | 63a185ab88b18b4892de4978f95c4917ec091452 | 2026-11-15T17:26:50Z | 63a185ab88b18b4892de4978f95c4917ec091452 | same |
|  | direct |  | 23110c3f2562cc8941acfde5a99f52b1498aa51d | 2026-11-15T17:28:27Z | 23110c3f2562cc8941acfde5a99f52b1498aa51d | same |
|  | direct |  | 9429a61 | 2026-11-15T18:00:01Z | 9429a619f50c7bb57144c80a9d4c91cde6cf1e8d | same |
|  | direct |  | 7a42a91 | 2026-11-15T18:11:29Z | 7a42a91ebbefd7cd9a1669d2480aaf97be124782 | same |
|  | direct |  | 4339330 | 2026-11-15T18:13:18Z | 4339330c6c14c0649bc17f33d1982ec44a6ea890 | same |
|  | direct |  | c954da1 | 2026-11-15T19:14:25Z | c954da13b7e9a8e40e6ec4bf5f9ba652e1f6c042 | same |
|  | direct |  | 015820a | 2026-11-21T02:32:28Z | 015820a424810bb52cc87bdcf84b6cacf85a2923 | same |
|  | direct |  | 66e63d5 | 2026-11-21T02:58:48Z | 66e63d5beeb4a39c72cca67d8ebecd6c91aac19e | same |
|  | direct |  | 5accb4c40c0a18e4ce52a97104a12621669450cb | 2026-11-21T14:21:48Z | 5accb4c40c0a18e4ce52a97104a12621669450cb | same |
|  | direct |  | 17197b610eec5201ca117cb5628f37f2fbbac630 | 2026-11-21T14:26:44Z | 17197b610eec5201ca117cb5628f37f2fbbac630 | same |
|  | direct |  | 8aca30e96a6e8ca28a49a76b5189029025606fba | 2026-11-21T14:33:49Z | 8aca30e96a6e8ca28a49a76b5189029025606fba | same |
|  | direct |  | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | 2026-11-21T15:05:22Z | 3acb7a9229b75fd24fc14ccbf7ee4e45854db8e8 | same |
|  | direct |  | 3353cfbb1ceb31915be7d4466ebdd843bb378a96 | 2026-11-21T15:15:39Z | 3353cfbb1ceb31915be7d4466ebdd843bb378a96 | same |
|  | direct |  | e0fba46273f8e9c78ddac305916d891210507aa3 | 2026-11-21T15:24:53Z | e0fba46273f8e9c78ddac305916d891210507aa3 | same |
|  | direct |  | 4241d7f31bc4b20eda6f46c902cbb1d157e1ebea | 2026-11-21T16:11:22Z | 4241d7f31bc4b20eda6f46c902cbb1d157e1ebea | same |
|  | direct |  | e26c0e0e60574d7febe8308990bf14521b08c8bf | 2026-11-21T16:37:57Z | e26c0e0e60574d7febe8308990bf14521b08c8bf | same |
|  | direct |  | 62d0a382e82c062913b7c0d039f9cb8d52611705 | 2026-11-21T16:39:37Z | 62d0a382e82c062913b7c0d039f9cb8d52611705 | same |
|  | direct |  | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | 2026-11-21T16:49:18Z | 3ee76ff6c5d01a3fc67482bb5bc0e62c1ac10dfe | same |
|  | direct |  | 4280d2bdcb8821bc45b5cd668ee9153d8ba1504a | 2026-11-22T15:31:25Z | 4280d2bdcb8821bc45b5cd668ee9153d8ba1504a | same |
|  | direct |  | 2dc2e1d5b4e3f17106ee793db701c5a71d2f285d | 2026-11-22T15:51:26Z | 2dc2e1d5b4e3f17106ee793db701c5a71d2f285d | same |
|  | direct |  | 35240ef4ecce4a855c9b1d5103771f7c98463f20 | 2026-11-22T15:51:34Z | 35240ef4ecce4a855c9b1d5103771f7c98463f20 | same |
|  | direct |  | e2d91c37caed7d2477d426918b4af6086388923d | 2026-11-22T16:49:22Z | e2d91c37caed7d2477d426918b4af6086388923d | same |
|  | direct |  | d4abd99cd2d021a0989a4ef8bab587620a790d20 | 2026-11-22T16:55:23Z | d4abd99cd2d021a0989a4ef8bab587620a790d20 | same |
|  | direct |  | a86a142904f311e9a18e395e402032d28b62632e | 2026-11-22T16:55:50Z | a86a142904f311e9a18e395e402032d28b62632e | same |
|  | direct |  | 8870976d0989b193dbe919cb8fa8ab35c1ab8f7f | 2026-11-22T17:14:10Z | 8870976d0989b193dbe919cb8fa8ab35c1ab8f7f | same |
| https://github.com/finos-labs/konspekt/pull/122 | merged | 5ee18d1c3f0d02302305e239003f338b4048e599 | 61936de1ce80893620d04017b0ec0132bb138841 | 2026-11-22T19:08:17Z | 61936de1ce80893620d04017b0ec0132bb138841 | same |
| https://github.com/finos-labs/konspekt/pull/122 | merged | 5ee18d1c3f0d02302305e239003f338b4048e599 | c2ad2e0c410b6372b7024d0bc8898ac49e827103 | 2026-11-22T19:08:17Z | c2ad2e0c410b6372b7024d0bc8898ac49e827103 | same |
|  | direct |  | 45b70c14bc4309dcb46de89cb7a6517521f31b4e | 2026-11-22T19:09:18Z | 45b70c14bc4309dcb46de89cb7a6517521f31b4e | same |
|  | direct |  | 77887e327e388e8acc1e999e205d397f12acac69 | 2026-11-22T19:12:21Z | 77887e327e388e8acc1e999e205d397f12acac69 | same |
|  | direct |  | 5b478603a916f625c78b72ac0da238c863e54ef3 | 2026-11-22T20:04:39Z | 5b478603a916f625c78b72ac0da238c863e54ef3 | same |
|  | direct |  | b5467f6892e19f98406c0ab362bb810a5f15f82e | 2026-11-22T20:07:45Z | b5467f6892e19f98406c0ab362bb810a5f15f82e | same |
|  | direct |  | e1031e38d01adbd52940369acfaa89c858094ad9 | 2026-11-22T20:46:39Z | e1031e38d01adbd52940369acfaa89c858094ad9 | same |
|  | direct |  | a605d7d5588e0f6605aee60459d0792c1fe88141 | 2026-11-22T20:50:50Z | a605d7d5588e0f6605aee60459d0792c1fe88141 | same |
|  | direct |  | c67a78ff453efe728400f99dfa439058554e2318 | 2026-11-22T20:52:00Z | c67a78ff453efe728400f99dfa439058554e2318 | same |
|  | direct |  | d4dca7d08c81223f0d38b9d9b67e29525ae14f36 | 2026-11-22T20:55:06Z | d4dca7d08c81223f0d38b9d9b67e29525ae14f36 | same |
|  | direct |  | 830cd5cf8b7998c622714906eab661fddf145902 | 2026-11-22T21:01:29Z | 830cd5cf8b7998c622714906eab661fddf145902 | same |
| https://github.com/finos-labs/konspekt/pull/123 | merged | 91f6049f80447aee6e36d6d430cf813766c0f25a | 70263403406e9f7d4ec32190f1d5772ba3cffdc3 | 2026-11-22T21:06:48Z | 70263403406e9f7d4ec32190f1d5772ba3cffdc3 | same |
|  | direct |  | 24c52b4714f3c15e63e466532e2f970a23115a56 | 2026-11-22T21:04:40Z | 24c52b4714f3c15e63e466532e2f970a23115a56 | same |
|  | direct |  | fff6c9a21ebfab15830643c3fd22f4ef5d224608 | 2026-11-22T21:08:21Z | fff6c9a21ebfab15830643c3fd22f4ef5d224608 | same |
|  | direct |  | a4e85ab6419924867cf66e6b09fa8fbc839e516b | 2026-11-22T21:11:23Z | a4e85ab6419924867cf66e6b09fa8fbc839e516b | same |
