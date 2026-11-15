# Executed commands (engineer layer)

Append-only log binding each LLM-executed command to the entity it was about, one
row per execution in execution order (top to bottom is the timeline; there is no
stored timestamp). `command` is the `ni:///sha-256;<base64url>` reference of
`commands/sha-256/<hex>.md`, which holds the verbatim command text; `<hex>` is
the SHA-256 of that file's bytes. A command run twice is one file and two rows.
Written at execution time.

| entity | command |
|--------|---------|
