---
platform: linkedin
format: feed
date: 2026-11-07
url:
announces: "checkpoint and resume: hand a conversation to another LLM, the next day, or another device"
assets:
  - file: images/checkpoint.png
    source: docs/visuals/posters/konspekt-checkpoint-poster.html
    alt: One conversation writes a checkpoint into the git repository; three later conversations (another LLM, the next day, another device) read it at open. Below, a comparison with the memory and project context built into LLM tools.
first_comment: |
  Spec: https://github.com/finos-labs/konspekt/blob/main/spec/architecture/TRANSPORT.md#checkpoint-and-resume
  Change: https://github.com/finos-labs/konspekt/pull/105
  Repo: https://github.com/finos-labs/konspekt
---

Switching LLMs in the middle of a project usually means starting the conversation over. konspekt now lets you hand a conversation to a different LLM, or to tomorrow's session, or to another device, and pick up where you stopped.

At the end of a conversation you type "checkpoint". konspekt writes one row into the project's graph, which lives in your git repository. The row records the item the conversation was working on, the proposals still pending, and the open-items list, saved word for word. The next conversation reads it first and opens with: "Last checkpoint was on task-X, Saturday, via Claude mobile, 4 open items. Continue there?" You confirm, and it lists what is still open and what has been accepted since.

Three uses:

1. LLM to LLM. The checkpoint is plain markdown in your repo, and nothing in it is tied to one vendor. I checkpointed a conversation in Claude and resumed it in Grok: Grok bound to the same item and listed the same open items.

2. Daily hand-overs. End the day with "checkpoint". The next morning a fresh conversation opens on the same item with the same open list, and you skip the re-explaining.

3. Device to device. Start on your phone, continue in the IDE or the terminal. In Claude Code a session-start hook loads the last checkpoint automatically. On web and mobile, the project instructions tell the conversation to read it.

How this differs from the project context and memory built into LLM tools:

- Built-in memory is written by the model as a summary and stored by the vendor. A checkpoint is issued by you, keeps the exact text, and is versioned in your repository.
- Built-in memory belongs to one product and one account. Any model or tool that can read the repository can read a checkpoint.
- Project files are static documents. A checkpoint records where the work stopped, and on resume it is checked against the graph's current state.
- In our own 240-trial comparison, native memory got 0 of 20 questions about current project state right, mostly by returning decisions that had since been superseded. The graph got 20 of 20.

Resuming accepts nothing on your behalf. You still confirm the binding, and pending proposals are proposed again.

Spec, code and repo in the comments.

#AI #LLM #KnowledgeGraphs #OpenSource #FINOS #konspekt
