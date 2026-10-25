Source excerpt — committer bless-queue status line
Conversation: fleet-resolve-and-adjustments-2026-10-25

Context: the SessionStart watch hook now folds in the background with no console
(windowsHide fix). The human asked how a committer learns there are proposals.

Assistant (venture): The watcher already folds proposals to review: proposed on
its own. What a human needs is the bless queue — entities at review: proposed
awaiting a decision. Options: (a) one persistent console window; (b) a Claude
Code status line in the committer terminal showing the count; (c) both.

Human: "try (b)"

Assistant: built implementations/fleet/app/committer-statusline.mjs. It reads the
status-line JSON on stdin, takes the project dir from workspace.project_dir, and
prints buildIndex(...).counts.pending (the folded-but-not-blessed count, same as
cli.mjs review). Registered in CDM .claude/settings.json with refreshInterval 5.
Noted that a command status line replaces the default readout, and offered:
1a konspekt line only; 1b konspekt line plus the standard fields (model,
directory, context percent).

Human: "1b seems more solid. 2. go all the way 3. yes, please do 4. yes"

Decision: the committer bless-queue status line is adjustment of the fleet. It
shows model, current directory, context-window percent, and the bless-queue
depth (counts.pending) on one line, refreshing every 5 seconds so the count
tracks background folds. It makes no git subprocess, prints nothing outside a
committer repo, and is registered only in a committer repo. Persist as
review: proposed (the human commanded persisting, framed as proposed).
