```yaml
id: nw-claude-mobile-not-a-target
kind: decision
review: proposed
provenance:
  sourceRef: b9a463107d5168222a3d2acd8d75ad4b66976864
  contentHash: b9a463107d5168222a3d2acd8d75ad4b66976864
  timestamp: 2026-09-14T16:00:00Z
  conversationId: app-design-101
createdAt: 2026-09-14T16:00:00Z
updatedAt: 2026-09-14T16:00:00Z
```
# Noteworthy: Vendor mobile is a host, konspekt mobile is the target

Two different things share the word mobile. The vendor's mobile app is a host
surface: it runs no local servers, takes only remote MCP servers, and cannot even
add a connector from the device. Konspekt mobile is a renderer: the konspekt view
at phone width in the phone's browser.

The vendor mobile app is not a target for the interface. Even where a card
renders, it is transient in a scrollback, phone-sized, inside a host that cannot
be configured from the device — none of which suits a review queue. It remains a
chat client, so an agent working there still proposes atoms and still needs a
reachable server.

Remote review therefore means konspekt mobile in a browser, which needs no host
cooperation at all.
