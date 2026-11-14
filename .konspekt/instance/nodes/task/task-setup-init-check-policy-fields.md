```yaml
id: task-setup-init-check-policy-fields
type: task
title: Make setup/init.mjs --check report missing binding and basis fields
status: open
summary:
  origin: machine
  pinned: false
  updatedAt: 2026-11-14T18:50:36Z
review: proposed
provenance:
  sourceRef: d1dae8f32d04b04997ec93a28d445e23de3dbc59
  contentHash: d1dae8f32d04b04997ec93a28d445e23de3dbc59
  conversationId: source-uris
  timestamp: 2026-11-14T18:50:36Z
  confidence: 0.8
createdAt: 2026-11-14T18:50:36Z
updatedAt: 2026-11-14T18:50:36Z
```
# Task: Make setup/init.mjs --check report missing binding and basis fields

`test/setup-init.test.mjs` fails on `main` and on `task-ni-references` with
two failures: "--check did not fail on a project.md without binding/basis" and
"--check did not name both missing policy fields". The test removes the
`binding:` and `basis:` lines from a scaffolded `project.md` and runs
`setup/init.mjs --check`, which prints "Nothing installed to check." and exits
0, so the policy-field check is never reached.

The work: find why `--check` sees no installed components in the test's
scaffold, and make it report each missing policy field and exit non-zero.

Success is `node --test test/setup-init.test.mjs` passing.
