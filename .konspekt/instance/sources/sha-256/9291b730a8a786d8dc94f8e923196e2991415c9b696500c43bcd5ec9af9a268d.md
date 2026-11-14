# Source excerpt — accept the body text on six artifact-fleet-* entities

Conversation: fleet-design-docs-placement
Date: 2026-11-12

---

**Claude:**

[...] **Item 2.** I changed 10 lines across six artifact entities so they name `implementations/fleet/design/` instead of `docs/design/` (commit `871c2cd`). These are written as `review: proposed`. Each line changes only the path: [...]

## Open items
1. **The body-text edits.** Pick one:
   - (a) Accept all six. I'll record the acceptance, run the full check set on a new throwaway branch, delete it if everything passes, and open the PR.
   - (b) Accept only `artifact-fleet-spec`. That clears the error, and the other five stay `proposed` for your review queue.
2. **A wrong `location`.** `artifact-fleet-worktree-design` has `location: implementations/fleet/worktree/docs/DESIGN.md`, but the file is at `implementations/fleet/docs/DESIGN.md`; `implementations/fleet/` has only `app/`, `docs/` and the new `design/`. This was already wrong before this task. I can fix it in this PR as one more proposed change, or leave it for a separate task.

---

**User:**

Accept them all and fix this in the PR
