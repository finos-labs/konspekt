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
| 2026-11-14T14:51:05Z | task-ni-references | ni:///sha-256;qOerW6MRS-tplQ3PVgtkOvRYjPXTb3iNCbrhJDga0yU | claude-mobile | claude-opus-5-5 | denisurusov |
| 2026-11-14T19:59:20Z | task-ni-references | ni:///sha-256;IFQtEzY7_YOT4d9vmohmgwK6E1K3oCld1AHrPCzzxYg | claude-code-cli | claude-opus-5-5 | denisurusov |
| 2026-11-21T03:09:21Z | task-ui-clickable-source-refs | ni:///sha-256;xHkGyH1eS25d7mR29PL_DdvyNcA-JW1TQU6iiUrk4aY | claude.ai-web | claude-opus-5-5 | denisurusov |
