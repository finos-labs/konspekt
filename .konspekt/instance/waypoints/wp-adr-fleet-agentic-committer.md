```yaml
id: wp-adr-fleet-agentic-committer
kind: decision
subtype: adr
timestamp: 2026-10-11T13:39:32Z
review: accepted
provenance:
  sourceRef: 66ce1472f226767b199556329bedbb9d60ca96f6
  contentHash: 66ce1472f226767b199556329bedbb9d60ca96f6
  timestamp: 2026-10-11T13:39:32Z
  conversationId: fleet-as-protocol
  confidence: 0.8
createdAt: 2026-10-11T13:39:32Z
updatedAt: 2026-10-11T13:39:32Z
```
# Waypoint: Minimize the committer's deterministic code; the committer may be an agent under human-authorized acceptance

Decide to minimize the size of the committer's JavaScript machinery
(`implementations/fleet/worktree/app/cli.mjs`, `committer.mjs`, `order.mjs`,
`outbox.mjs`, `worktrees.mjs`) in favor of agentic communication: model the
fleet as N agents following a protocol, where roles are personas, flow is verbs,
rules are the authority grants (`authority/grants.md`), and transport is
cross-session messaging between agents.

The committer may be an agent. Executing the commit command is already the
agent's action in single-agent konspekt today; the authorization boundary is
unchanged — the human authorizes acceptance (`accept` / `commit` / `push`),
agents propose and execute under that authorization and never originate an
acceptance ([[nw-accept-authority-enforced-not-gated]]).

What stays as code is the record-level checks (`lib/conformance.mjs`,
`tools/binding-audit.mjs`, the `git hash-object` content-address probe, and the
`transitions/transitions.md` log) and the byte-exact verb implementations the
agent calls (content hashing, the `review`-field flip, and the `edges.md` row
append). The fold translation may be removed when proposers author stored-form
atoms directly as `review: proposed`, leaving the committer to validate and
append.

Both proposal-ingest modes stay: git-worktree mode for co-located agents with an
outbox branch, and pure agentic mode over MCP / cross-session messaging for
surfaces with no worktree. This decision reduces the JavaScript machinery; it
removes neither mode ([[nw-fleet-committer-ingest-contract]]).

Forced by [[concept-write-integrity-by-verification]]. Supersedes
[[nw-fleet-committer-role-split]], whose two guarantees survive — the graph is
never left partially written, and the accepted commit carries the human
`Signed-off-by` — now resting on record-level verification plus human-authorized
acceptance rather than on excluding a model from the write operations. Marks
[[task-agent-fleet]].
