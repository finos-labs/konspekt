```yaml
id: nw-fleet-setup-authority-preflight
kind: decision
review: proposed
provenance:
  sourceRef: faa36003d4bf3612e7e677825150d55cd78407e0
  contentHash: faa36003d4bf3612e7e677825150d55cd78407e0
  conversationId: fleet-adopter-authority-preflight
  timestamp: 2026-10-23T16:44:40Z
  confidence: 0.8
createdAt: 2026-10-23T16:44:40Z
updatedAt: 2026-10-23T16:44:40Z
```
# Noteworthy: fleet setup blocks on acceptance authority, and `doctor` checks it

The fleet `setup` command treats acceptance authority as a blocking precondition.
Before it stands up any worktree it runs a read-only acceptance-authority
preflight and refuses when the preflight fails, so an adopter cannot stand up a
fleet that can fold proposals but never attributably accept them.

The preflight blocks on two things. First, the canonical instance must declare an
acceptance authority — a human grantor principal in `authority/principals.md` and
an effective accept grant in `authority/grants.md`. Second, `KONSPEKT_PRINCIPAL`
must be set in the environment and name a declared principal that holds an accept
grant. A read-only `doctor` subcommand runs the same checks on demand from an
acceptance client's own shell and exits non-zero when the fleet is not ready.

This closes the gap the CDM adopter UAT surfaced: a fleet stood up against an
instance that declared no principals accepted a folded proposal through the
IntelliJ plugin with an empty `by`, losing attribution, and nothing failed at
setup time. Declaring principals makes a UI client fail-closed, but only at the
accept step; the preflight moves the requirement forward to setup. The env-var
check validates the environment the command runs in — a split topology still
needs the export in each acceptance client, and each client enforces fail-closed
at accept time.

Scopes [[task-agent-fleet]]; relates to [[nw-adopter-tooling-zero-config]] and
[[nw-fleet-proposer-is-declared-principal]].
