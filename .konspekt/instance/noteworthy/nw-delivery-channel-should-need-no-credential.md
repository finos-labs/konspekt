```yaml
id: nw-delivery-channel-should-need-no-credential
kind: decision
review: accepted
provenance:
  sourceRef: ni:///sha-256;w-Cx2eqgw6uDyZDUUBAEgMJy_azAPPht-SE7rYm3q78
  timestamp: 2026-07-19T23:05:00Z
  confidence: 0.7
  deprecated:
    migratedAt: 2026-11-14T19:37:32Z
    sourceRef: f5574006e917c8fcc273c30849754ae48b0d984e
    contentHash: f5574006e917c8fcc273c30849754ae48b0d984e
createdAt: 2026-07-19T23:05:00Z
updatedAt: 2026-07-19T23:20:00Z
```
# Noteworthy: a notifier's delivery channel should require no credential

The notifier's first delivery step sent email over Gmail SMTP. It never
delivered. The send was rejected with `530 Authentication Required`, and the
app password it needed could not be issued at all — Google withholds app
passwords from accounts without 2-Step Verification, and from accounts using
passkeys or under organisational management.

The fix was not a better mail provider. It was to stop needing a credential:
delivery now opens a GitHub issue using the workflow's built-in `GITHUB_TOKEN`,
which every Actions run already holds. No secret to provision, no external
service to keep alive, no account whose security posture can silently withdraw
the capability.

**The general claim.** A notifier is optional scaffolding around the graph, so
its delivery channel should cost an adopter nothing to stand up. An email step
looks free and is not: it assumes an SMTP account, a provisioning path for
credentials, and a provider that will keep issuing them. That assumption failed
here on the first attempt, on a personal account, with no organisational policy
involved. Prefer the channel already available in the transport the instance
lives on.

**What this is not.** Not a claim that email is wrong, and not a claim about the
konspekt standard — `notify.yml` is explicitly outside it
(`nw-subscriptions-are-config-not-graph`). An instance whose adopters already
run mail infrastructure loses nothing by using it.

**Why the confidence is not higher.** The GitHub-issue channel has its own
coupling: it binds notification to the host, which is exactly the dependency
`nw-mcp-binding-needs-neutral-read` argues against elsewhere. The counter is
that the notifier is not a read path and nothing in the graph depends on it —
but that distinction is asserted here, not tested. The issue channel also
creates a new issue per event batch, which is untested at volume.

**Corroborating evidence.** The seam held: switching channels changed the
workflow's delivery step and one field in `notify.yml`, and touched neither the
differ nor the event set nor the payload rule. That is weak evidence the
abstraction was drawn in the right place, since it survived a change it was not
designed for.
