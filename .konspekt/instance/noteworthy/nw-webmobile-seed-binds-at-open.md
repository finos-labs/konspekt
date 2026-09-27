```yaml
id: nw-webmobile-seed-binds-at-open
kind: decision
review: proposed
provenance:
  sourceRef: 2ed0cd0d761d9adb44ef8d67b597dc72cd09b823
  contentHash: 2ed0cd0d761d9adb44ef8d67b597dc72cd09b823
  conversationId: webmobile-seed-binding-step
  timestamp: 2026-09-27T15:30:00Z
  confidence: 0.7
createdAt: 2026-09-27T15:30:00Z
updatedAt: 2026-09-27T15:30:00Z
```
# Noteworthy: the web/mobile seed makes the binding ask and its source repos explicit

The web/mobile seed (`setup/WEBMOBILE_SEED.md`, `artifact-webmobile-seed`) now
carries two additions a hook-less platform needs to operate the loop correctly.

First, an explicit **Bind at open** step: before any durable work the
conversation must ask the human which entity it attaches to, honoring the
instance's `binding:` policy (`required` = unconditional, "none" is not legal;
`optional` = a decline recorded as a waypoint). In Claude Code the `SessionStart`
hook injects `OPERATING.md` and forces this ask; on web/mobile there is no hook,
so the seed itself must instruct it. This closes, on the web/mobile path, the
same lapse [[nw-binding-enforcement-gap]] records — a session that produces no
bound atom and no recorded decline.

Second, the reading list is split by repository. A generic adopter has two
repos: the backend repo (`<owner>/<repo>`, holding `.konspekt/OPERATING.md` and
the instance) and the konspekt standard (`denisurusov/konspekt`, holding
`spec/`, `.claude/skills/`, and personas). `init.mjs` scaffolds only `.konspekt/`
into the backend repo, so the spec and skills are absent there unless vendored.
The prior seed used bare relative paths that did not name a repo — ambiguous for
any adopter whose backend repo is not itself a konspekt clone (this dogfood
instance, where both coincide, masked the ambiguity).

Refines [[nw-webmobile-seed-is-pointer-not-payload]]: a pointer must name which
repo each target lives in, and must carry the binding ask that no hook enforces
on web/mobile.
