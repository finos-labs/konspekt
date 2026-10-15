# Changed code (engineer layer)

Append-only log binding each committed code change to the entity it was about,
one row per (entity, commit, file) in commit order (top to bottom is the
timeline). `timestamp` is the ISO 8601 time the row was written. `commit` is an
opaque revision token (the git commit SHA in a git repo); `file` is a
repo-relative path that commit touched for that entity. The diff itself is not
stored here — it lives in version control, recoverable by `commit`.

Rows are written at commit time, so a row points at the commit made just before
it. Bookkeeping commits — those touching only `.konspekt/instance/**` — are
excluded.

| entity | commit | file | timestamp |
|--------|--------|------|-----------|
