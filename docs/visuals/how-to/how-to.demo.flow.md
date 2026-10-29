# konspekt — how-to walkthrough (voice-over script)

Informal narration for the walkthrough video. One beat per slide; the slide
image for each beat is named in parentheses. Beat order follows the files in
this folder. Keep the delivery conversational — this is a friendly tour, not a
spec reading.

Rendered video: `konspekt-howto-walkthrough.mp4` (1080p, captions in
`konspekt-howto-walkthrough.srt`). Beat 11 plays over `title_card.png`.

1. So, what is konspekt really? Technically, it's just a directory that lives
   inside your repository — one place that holds your project's evolving state:
   the decisions, the tasks, the context behind them. Think of it as the memory
   your project keeps about itself. (graph_intro.png)

2. And it travels with you. Use it inside your IDE, in a local Gen-AI app, or on
   the web — anywhere, as long as there's a repo behind it. No repo yet? No
   problem: seed a session with the konspekt web-and-mobile prompt and you're
   off. (setup.png)

3. The first time you actually notice konspekt is right at the start of a
   session, when it asks you one simple thing: which node in the graph do you
   want to bind this conversation to? (binding.png)

4. Not sure what to bind to? Pop open the IntelliJ plugin and pick the node you
   want to work on. Working outside IntelliJ? There's a standalone UI app that
   ships with the tool and does exactly the same job. (ui_selection.png)

5. That UI is also where you browse. Filter and search across nodes in every
   state — it's basically your to-do list and a lightweight project manager in
   one view. (ui_desktop.png)

6. From there, konspekt quietly keeps the receipts. It tracks which commands
   were executed... (ui_commands.png)

7. ...which files were changed... (ui_changes.png)

8. ...and, maybe most importantly, who said what. (ui_provenance.png)

9. Every provenance record is backed by a hashed, verbatim transcript of the
   decision-making chain — so the trail isn't a tidy summary after the fact,
   it's the real conversation. (provenance_source.png)

10. And that pays off the moment you need to trace your ASR and ADR roots and
    ask, "wait, why did we decide this?" (ui_asr_adr.png)

11. Here's the best part: you don't have to do anything special to make any of
    this happen. A konspekt-equipped agent suggests the state changes for you —
    creating nodes, accepting them, moving them along.

12. Here's a task being proposed... (task_proposal.png)

13. ...and here it is, completed and accepted. (task_completion.png)

14. Finally, a couple of git checks keep everyone honest — for example, you have
    to accept a task before you're allowed to commit against it. (git_checkers.png)

15. So that's konspekt. The agent proposes, you accept, and git keeps the
    record. It's open source under FINOS Labs, so grab it from the repo on
    screen, try it on a project of your own, and tell us what you think.
    (end_card.png)
