1. Choose git repo mode. 
   2. for the UAT test we're using worktree mode, which is the default
2. Decided where the canonincal branch lives
   3. for the UAT test, it is the fleet_uat_test branch which lives in IdeaProjects/konspekt
4. In that branch, create fleet configuration
   5. which is fleet.json 
   5. this needs to go under ./konspekt/fleet/config directory
      6. this a noteworhty and needs to become a part of fleet design spec
6. Configure
   7. Noteworhy: we're deciding here that fleet config is the primary driver for the number/types of agents and 
      worktree directory setup
      8. add a task to in the future fit the pre-existing worktree/agent setup into konspekt fleet config
   9. Define the number and type of agents
   10. for each - worktree directory
11. Use default permission
12. run a script to set things up
    11. create directories with konspekt enabled for each agent
    12. make sure under ./konspekt there a config for this specific agent (e.g., spec writer agent needs to read 
        fleet spec writing skill
13. execute a script to start committer agent CLI

## Teardown

Tearing the fleet down removes the proposer worktrees and leaves canonical, the
git object store, and the outbox branches intact. It is supported by
`teardownFleet(descriptor, { force })` in
`implementations/fleet/app/worktrees.mjs`. There is no CLI subcommand for it yet
(gap, below).

- **Removes:** each proposer worktree directory (`git worktree remove`).
- **Preserves:** the canonical worktree and object store, and every outbox
  branch. A branch is kept because a proposer's un-folded proposals live on it;
  dropping it would lose them. Fold and consume first (or accept the loss).
- **Preconditions:** each proposer worktree must be clean, or pass
  `force: true`. Confirm no un-folded proposals remain — `ls
  <FLEET_ROOT>/outbox-<handle>/proposals` should be empty on every outbox. Every
  folded proposal must already be consumed from its outbox (re-fold constraint
  `nw-fleet-refold-clobbers-blessed`).
- **No live process may hold a worktree.** `git worktree remove` fails with
  `Permission denied` on Windows if a running process (e.g. a proposer's own
  editor/agent session) has that worktree as its working directory; `teardownFleet`
  throws on the first such worktree and stops, leaving the rest registered. Close
  every proposer session first. If a worktree is left half-removed (its admin
  entry gone but the directory still on disk), `git worktree prune` clears the
  entry and the directory is deleted by hand once unlocked.

Run it via the CLI (config-driven; `task-fleet-config-driven-setup`):

```
node implementations/fleet/app/cli.mjs teardown --canonical <CANONICAL_PATH>
```

It attaches from the committed `.konspekt/fleet/config/fleet.json`, resolving each
outbox worktree from `git worktree list`, and removes them. (The legacy flat path
is `--root <FLEET_ROOT>`.) The library entry point is `teardownFleet` in
`implementations/fleet/app/worktrees.mjs`.

A full wipe needs these by hand (teardownFleet does not do them):

- delete the outbox branches (`git branch -D outbox/<handle>`), safe only once
  every proposal is folded and consumed;
- remove the flat manifest `<FLEET_ROOT>/fleet.json` and any `authoring-*`
  scratch dirs;
- the canonical branch and its instance are never touched by teardown.

Setup is the mirror command: `node implementations/fleet/app/cli.mjs setup
--canonical <CANONICAL_PATH>` reads the committed config and stands up one
`outbox/<handle>` worktree per agent off the canonical branch — no `--proposers`
argument and no hand-written manifest (`task-fleet-config-driven-setup`,
`nw-fleet-config-is-setup-driver`).