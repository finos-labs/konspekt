<!-- konspekt source excerpt
     Verbatim transcript of the adoption-path / portable-notifications exchange,
     konspekt, 2026-07-20. Both sides included. This header is the only editorial
     text; everything below the rule is verbatim as written by each party, with
     omissions within a turn marked […]. No included line is paraphrased. -->

---

**User:** portable notifications is related to adoption path. Let's focus on these two

**Claude:** "Read both tasks against the live tree. The relation is sharper than 'related' — **notifications is a sub-problem of adoption, not a peer of it.** […] Nothing on that list is about notifications. Notifications is just the first component that isn't the instance itself, so it's the thing that exposed the setup kit's missing second mode. […] `init.mjs` grows a component model […] `--add` operates on an existing `.konspekt/` instead of refusing it. The manifest declares `requires: [workflows]`, so a run driven through an MCP connector fails *up front* with 'this component needs workflow write, install it locally' rather than half-landing and discovering the wall — which is what happened here. […] On thread 2, the cheapest fix is not to make the path configurable. `.konspekt/instance` is where `init.mjs` puts it; declare it a constant of the GitHub binding and the notifier's hardcode stops being a bug and becomes conformance."

**User:** "notifications is a sub-problem of adoption, not a peer of it." - agreed. Go ahead and modify the setup scripts

**Claude:** "Components are **not part of the standard**. A conformant instance with none of them is complete, and the manual re-upload probe passes without them. Each lives in `setup/components/<id>/` behind a `manifest.yml` declaring where its files go and what the install needs. Installed files are a **projection** of the component, never a tracking copy — edit the component and re-run with `--force`; `--check` tells you when the two have forked. The exception is a file marked `seed: true`, which is your config and is written exactly once. […] `--add` is the exact inverse guard of scaffold: scaffold refuses when an instance *exists*, `--add` refuses when one *doesn't*. […] **standard vs. scaffolding** — closed. Components are explicitly outside the standard; a conformant instance with none passes the re-upload probe. Stated in the manifest, `notify.yml`, and the README. […] this session produced at least one atom-shaped thing — components-are-not-the-standard, i.e. the setup kit ships things a conformant instance can lack. That's the rule that let `notify` move without touching the spec."

**User:** draft the new atom and persist. We'll then need to think about how to update code_tracer
