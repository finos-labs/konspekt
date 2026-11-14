# Checkpoints

Append-only log of every human `checkpoint`, one row per checkpoint in the order
written (`spec/architecture/SERIALIZATION.md` § Checkpoints). `entity` is the
conversation's active entity when the checkpoint was issued. `source` is the
`sources/` excerpt holding, verbatim, the command, the binding switches, the
pending proposals, and the open-items list. `venue` and `model` say where and on
which LLM the conversation ran. `by` is the human principal who issued it. At
open, `resume` reads the last row.

| timestamp | entity | source | venue | model | by |
|-----------|--------|--------|-------|-------|----|
| 2026-11-14T14:51:05Z | task-ni-references | aad016f7ff79fb7f18d247523e7c584ff1ae5437 | claude-mobile | claude-opus-5-5 | denisurusov |
