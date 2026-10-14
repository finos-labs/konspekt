#!/usr/bin/env node
// konspekt notifier — compute notifiable events between two commits.
//
// Reads .konspekt/notify.yml for subscriptions, diffs the instance between
// two commits, and emits the matched events as JSON on stdout plus a rendered
// text body to --body-file. Sends nothing itself: delivery is the caller's
// job, so this stays testable offline and needs no network access.
//
// Usage:  node .konspekt/lib/konspekt-notify.mjs <beforeSha> <afterSha> [--body-file PATH]
//
// Design commitments:
//   - Zero dependencies. Node + git only.
//   - Events are keyed on the in-file `id`, NEVER on the file path. A rename
//     is a delete plus an add to a path-keyed differ; the 2026-07-19 migration
//     would have fired ~50 spurious events (nw-rename-fires-as-creation).
//   - Payloads are reference-only: id, type, event, commit URL, source link,
//     and — for status_changed — the enum values moved between. Never entity
//     body text (nw-payload-reference-only-admits-enums).
//   - Unknown/absent config is not an error. No notify.yml, or no matching
//     subscription, means zero events and a clean exit.
//
// Instance location is `.konspekt/instance` — a constant of the GitHub
// binding, not a configurable. `setup/init.mjs` is what writes that path, so
// this is conformance with the scaffolder rather than an assumption about it.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const [beforeSha, afterSha] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const bodyFlagIx = process.argv.indexOf("--body-file");
const bodyFile = bodyFlagIx > -1 ? process.argv[bodyFlagIx + 1] : null;

if (!beforeSha || !afterSha) {
  console.error("usage: konspekt-notify.mjs <beforeSha> <afterSha> [--body-file PATH]");
  process.exit(2);
}

const REPO = process.env.GITHUB_REPOSITORY || "denisurusov/konspekt";
const SERVER = process.env.GITHUB_SERVER_URL || "https://github.com";
const INSTANCE = ".konspekt/instance";

const ENTITY_DIRS = {
  concepts: "concept",
  noteworthy: "noteworthy",
  artifacts: "artifact",
  waypoints: "waypoint",
};

const git = (...args) => {
  try {
    return execFileSync("git", args, {
      encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null; // missing path at that commit, unknown ref, etc.
  }
};

// ---------- front-matter: only the fields the notifier needs ----------
//
// Deliberately not a YAML parser. It reads `id`, `review`, `status`, and
// `provenance.sourceRef` out of the fenced block and ignores everything else,
// so it cannot break on front-matter shapes it was not designed for.

function readEntity(text) {
  if (!text) return null;
  const fence = text.replace(/\r\n/g, "\n").match(/^```ya?ml\n([\s\S]*?)\n```/);
  if (!fence) return null;
  const front = fence[1];
  const scalar = (key, indented) => {
    const re = new RegExp(`^${indented ? "  " : ""}${key}:[ \\t]*(.+)$`, "m");
    const m = front.match(re);
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  };
  const id = scalar("id", false);
  if (!id) return null;
  return {
    id,
    review: scalar("review", false),
    status: scalar("status", false),
    sourceRef: scalar("sourceRef", true),
  };
}

// ---------- read a whole instance at one commit, keyed by id ----------

function entitiesAt(sha) {
  const byId = new Map();
  for (const [dir, type] of Object.entries(ENTITY_DIRS)) {
    const listing = git("ls-tree", "--name-only", `${sha}:${INSTANCE}/${dir}`);
    if (!listing) continue;
    for (const name of listing.split("\n").filter((n) => n.endsWith(".md"))) {
      const e = readEntity(git("show", `${sha}:${INSTANCE}/${dir}/${name}`));
      if (e) byId.set(e.id, { ...e, type, path: `${INSTANCE}/${dir}/${name}` });
    }
  }
  const nodeTypes = git("ls-tree", "--name-only", `${sha}:${INSTANCE}/nodes`);
  if (nodeTypes) {
    for (const t of nodeTypes.split("\n").filter(Boolean)) {
      const nt = t.replace(/\/$/, "");
      const listing = git("ls-tree", "--name-only", `${sha}:${INSTANCE}/nodes/${nt}`);
      if (!listing) continue;
      for (const name of listing.split("\n").filter((n) => n.endsWith(".md"))) {
        const e = readEntity(git("show", `${sha}:${INSTANCE}/nodes/${nt}/${name}`));
        if (e) byId.set(e.id, { ...e, type: "node", path: `${INSTANCE}/nodes/${nt}/${name}` });
      }
    }
  }
  return byId;
}

// ---------- supersedes edges at one commit ----------

function supersededAt(sha) {
  const text = git("show", `${sha}:${INSTANCE}/edges/edges.md`);
  const out = new Set();
  if (!text) return out;
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const c = t.split("|").slice(1, -1).map((x) => x.trim());
    if (c.length < 4 || c[1] !== "supersedes") continue;
    const to = c[3];
    out.add(to.includes(":") ? to.slice(to.indexOf(":") + 1) : to);
  }
  return out;
}

// ---------- notify.yml: subscriptions only ----------

function readSubscriptions(sha) {
  const text = git("show", `${sha}:.konspekt/notify.yml`);
  if (!text) return [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const subs = [];
  let inList = false;
  let cur = null;
  const flow = (v) =>
    v.trim().startsWith("[")
      ? v.trim().slice(1, -1).split(",").map((x) => x.trim()).filter(Boolean)
      : [v.trim()];
  for (const raw of lines) {
    if (raw.trimStart().startsWith("#")) continue;
    if (/^subscriptions:/.test(raw)) {
      inList = true;
      if (/^subscriptions:\s*\[\s*\]\s*$/.test(raw)) inList = false;
      continue;
    }
    if (!inList) continue;
    if (/^\S/.test(raw) && raw.trim() !== "") break; // next top-level key
    const item = raw.match(/^\s*-\s+(\w+):\s*(.+)$/);
    if (item) {
      if (cur) subs.push(cur);
      cur = {};
      cur[item[1]] = flow(item[2]);
      continue;
    }
    const kv = raw.match(/^\s+(\w+):\s*(.+)$/);
    if (kv && cur) cur[kv[1]] = flow(kv[2]);
  }
  if (cur) subs.push(cur);
  return subs.filter((s) => s.types && s.events && s.to);
}

// ---------- compute events ----------

const before = entitiesAt(beforeSha);
const after = entitiesAt(afterSha);
const supBefore = supersededAt(beforeSha);
const supAfter = supersededAt(afterSha);

const events = [];

for (const [id, e] of after) {
  const prev = before.get(id);
  if (e.review === "accepted" && (!prev || prev.review !== "accepted")) {
    events.push({ event: "accepted", id, type: e.type, sourceRef: e.sourceRef });
  } else if (e.review === "proposed" && !prev) {
    events.push({ event: "proposed", id, type: e.type, sourceRef: e.sourceRef });
  }

  // Status transitions are orthogonal to review, not an alternative to it: one
  // commit can both bless a proposal and move its status, and both are events.
  // Requires a predecessor — an entity born with a status has not transitioned
  // (nw-node-status-does-transition).
  if (prev && e.status && prev.status && e.status !== prev.status) {
    events.push({
      event: "status_changed",
      id,
      type: e.type,
      sourceRef: e.sourceRef,
      statusFrom: prev.status,
      statusTo: e.status,
    });
  }
}

for (const id of supAfter) {
  if (supBefore.has(id)) continue;
  const e = after.get(id);
  events.push({ event: "superseded", id, type: e ? e.type : null, sourceRef: e ? e.sourceRef : null });
}

// ---------- match subscriptions ----------

const subs = readSubscriptions(afterSha);
const matched = [];
for (const ev of events) {
  const recipients = new Set();
  for (const s of subs) {
    if (!s.types.includes(ev.type)) continue;
    if (!s.events.includes(ev.event)) continue;
    // `status_to` narrows status_changed to specific destination states, so a
    // watcher can ask for "resolved" rather than every transition. Absent means
    // no narrowing. Ignored for every other event kind. Named `status_to`
    // because `to` is already the recipient list.
    if (ev.event === "status_changed" && s.status_to && !s.status_to.includes(ev.statusTo)) continue;
    for (const addr of s.to) recipients.add(addr);
  }
  if (recipients.size) matched.push({ ...ev, to: [...recipients].sort() });
}

// ---------- render (reference-only) ----------

const commitUrl = `${SERVER}/${REPO}/commit/${afterSha}`;
const entityUrl = (id) => {
  const e = after.get(id);
  return e ? `${SERVER}/${REPO}/blob/${afterSha}/${e.path}` : null;
};
const sourceUrl = (ref) =>
  ref ? `${SERVER}/${REPO}/blob/${afterSha}/${INSTANCE}/sources/${ref}.md` : null;

const lines = [];
for (const ev of matched) {
  const detail = ev.event === "status_changed" ? ` ${ev.statusFrom} -> ${ev.statusTo}` : "";
  lines.push(`${ev.event}: ${ev.id} (${ev.type})${detail}`);
  const eu = entityUrl(ev.id);
  if (eu) lines.push(`  entity: ${eu}`);
  const su = sourceUrl(ev.sourceRef);
  lines.push(su ? `  source: ${su}` : "  source: none recorded");
  lines.push("");
}
if (lines.length) {
  lines.push(`commit: ${commitUrl}`);
  lines.push("");
  lines.push("Reference-only by design: this notification carries no entity text.");
}
const body = lines.join("\n");

const recipients = [...new Set(matched.flatMap((m) => m.to))].sort();
const result = { count: matched.length, recipients, events: matched };

if (bodyFile) writeFileSync(bodyFile, body);
console.log(JSON.stringify(result, null, 2));

if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    `count=${matched.length}\nrecipients=${recipients.join(",")}\n`,
    { flag: "a" }
  );
}
