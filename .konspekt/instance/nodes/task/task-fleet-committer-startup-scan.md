```yaml
id: task-fleet-committer-startup-scan
type: task
title: Committer scans existing outboxes on start, not only on a manual pass
status: open
summary:
  origin: human
  pinned: false
  updatedAt: 2026-10-24T15:02:59Z
review: accepted
provenance:
  sourceRef: d0519caaa02e29bb560735c0b56daae55b856a62
  contentHash: d0519caaa02e29bb560735c0b56daae55b856a62
  conversationId: fleet-skill-root-flag-2026-10-24
  timestamp: 2026-10-24T15:02:59Z
  confidence: 0.8
createdAt: 2026-10-24T15:02:59Z
updatedAt: 2026-10-24T15:02:59Z
```
# Task: Committer scans existing outboxes on start, not only on a manual pass

The fleet lifecycle implicitly assumes the committer is already up and passing
when a proposer produces. When a proposer starts work before the committer and
commits one or more proposals to its outbox, nothing brings those proposals to
the committer's attention until a human manually runs `run-pass`. There is no
automatic check on committer start.

Current behavior (`implementations/fleet/app/committer.mjs` `readProposals`): a
pass reads whatever is present in each proposer outbox worktree at the moment it
runs, so a pass invoked after proposers have committed does pick up the waiting
proposals. The gap is the trigger, not the read: the committer only acts on an
explicit human `run-pass` / `bless`, so proposals that landed before the
committer came up sit unprocessed until someone remembers to run a pass.

The task: make the committer, when it starts, automatically reconcile the
existing outbox state — a startup catch-up that reads every outbox and reports
(and, under the normal verified-fold rule, folds) the proposals already waiting,
so a proposer that ran first is not silently stranded.

Open questions, for the konspekt core to decide:

1. **Shape of "on start".** A one-shot catch-up pass the committer always runs
   when it comes up, versus a watch that reacts to new outbox commits while it
   runs. The committer is the deterministic single writer with no model on the
   write path (`task-fleet-worktree-committer`), so any trigger must preserve
   that — a startup scan may surface and fold the verified set, but acceptance
   (`bless`) stays human-gated.
2. **Where it lives.** A committer subcommand or flag (e.g. a `run-pass` that is
   the default startup action), versus host policy that says "run a pass on
   start," versus the committer skill instructing the catch-up as step zero.
3. **Setup-ordering caveat.** Outbox worktrees are stood up by the committer's
   config-driven `setup`, so a proposer cannot commit to an outbox that `setup`
   has not created. The realistic pre-committer window is after `setup` but
   before the first pass; the task is about that window, not about a proposer
   predating setup.

Success: proposals committed to an outbox before the committer is running are
detected and reported (and folded under the normal verify rule) automatically
when the committer starts, with acceptance still carried by an explicit human
decision.

Decomposes [[task-agent-fleet]]; links to [[task-fleet-worktree-committer]].
