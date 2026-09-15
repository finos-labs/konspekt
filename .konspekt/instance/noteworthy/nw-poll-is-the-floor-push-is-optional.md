```yaml
id: nw-poll-is-the-floor-push-is-optional
kind: decision
review: proposed
provenance:
  sourceRef: fabe5755d9192324d0f0eea6a61cb13c66d65105
  contentHash: fabe5755d9192324d0f0eea6a61cb13c66d65105
  timestamp: 2026-09-14T18:15:00Z
  conversationId: app-design-101
createdAt: 2026-09-14T18:15:00Z
updatedAt: 2026-09-14T18:15:00Z
```
# Noteworthy: Polling is the floor, push is an optional accelerator

The storage interface does not mandate a push channel. It mandates the two
things polling needs — an opaque cursor and a changes-since query — so every
conformant backend can be polled. A backend that also offers a subscription is
offering lower latency, not a different contract: a filesystem watcher on a git
working tree, change streams on a document store, `LISTEN`/`NOTIFY` or logical
decoding on a relational one.

One rule makes them interchangeable: a notification carries the cursor and
nothing else. The consumer then calls changes-since to learn what moved, which
keeps the payload reference-only and makes a dropped event cost latency rather
than a lost change, since the next cursor sweeps up what was missed.

Two conditions keep this from becoming an assumption. Changes-since has to stay
cheap — ordered, resumable, bounded work per call — or polling degrades and push
quietly becomes mandatory. And on the git backend, freshness is separate from
delivery: polling a working tree says nothing about commits on the remote, so
something has to fetch. Who fetches, and how often, is open.

The last hop to the view is out of scope for the interface. A browser page is
fed by its own server, over server-sent events or a poll, whatever the backend
underneath does.
