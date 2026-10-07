#!/usr/bin/env node
// Conformance test for the authority model and for acceptance before work
// (task-authority-mechanism, task-acceptance-before-work).
//
// Each case builds a small instance in a temporary directory and asserts the
// exact set of error and warning codes the checker reports. The authority cases
// follow spec/architecture/AUTHORITY.md: principals, grants, the nearest
// enclosing grant scope, acceptance by any holder of a grant on that scope, and
// the rule that an agent never accepts an atom it proposed. The basis cases
// follow spec/architecture/REVIEW.md § Acceptance before work.
//
// Run:  node test/conformance-authority.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const lib = (p) => import(pathToFileURL(join(HERE, "..", p)));
const { loadInstance, gitBlobSha } = await lib("lib/conformance.mjs");
const engineer = (await lib("spec/personas/engineer/registry.mjs")).default;

const T = (day, hh = "00") => `2026-01-${String(day).padStart(2, "0")}T${hh}:00:00Z`;
const fm = (fields, body) => "```yaml\n" + fields + "\n```\n" + body + "\n";
const base = (id, review) =>
  `id: ${id}\nreview: ${review}\nprovenance:\n  conversationId: t\n  timestamp: ${T(1)}\n  confidence: 0.9\n` +
  `createdAt: ${T(1)}\nupdatedAt: ${T(1)}`;
const table = (header, rows) =>
  `| ${header.join(" | ")} |\n| ${header.map(() => "---").join(" | ")} |\n` +
  rows.map((r) => `| ${r.join(" | ")} |\n`).join("");

const COMMAND = "node --test\n";
const COMMAND_HASH = gitBlobSha(Buffer.from(COMMAND));

// The graph every case starts from. goal-g decomposes into task-a and task-b;
// task-c sits under both. nw-a is a decision noted by task-a.
const GRAPH = () => ({
  project: "",
  nodes: {
    "goal-g": { type: "goal", review: "accepted", status: "active" },
    "task-a": { type: "task", review: "accepted", status: "open" },
    "task-b": { type: "task", review: "accepted", status: "open" },
    "task-c": { type: "task", review: "accepted", status: "open" },
  },
  noteworthy: { "nw-a": { kind: "decision", review: "accepted" } },
  edges: {
    "e-dec-a": ["decomposes", "node:goal-g", "node:task-a", "accepted"],
    "e-dec-b": ["decomposes", "node:goal-g", "node:task-b", "accepted"],
    "e-dec-ac": ["decomposes", "node:task-a", "node:task-c", "accepted"],
    "e-dec-bc": ["decomposes", "node:task-b", "node:task-c", "accepted"],
    "e-not-a": ["notes", "node:task-a", "noteworthy:nw-a", "accepted"],
  },
  principals: [
    ["alice", "human", "grantor", ""],
    ["bob", "human", "", ""],
    ["carol", "human", "", ""],
    ["bot-1", "agent", "", ""],
    ["bot-2", "agent", "", ""],
  ],
  grants: [["*", "alice", "grant", "alice", T(1), ""]],
  // Who accepted each atom, and when. A case overrides single entries.
  acceptedBy: {},
  acceptedAt: {},
  proposedBy: {},
  changed: [],
  executed: [],
  log: true,
});

function build(g) {
  const dir = mkdtempSync(join(tmpdir(), "konspekt-authority-"));
  for (const d of ["nodes/goal", "nodes/task", "noteworthy", "edges", "sources", "transitions", "authority", "changes", "commands"]) {
    mkdirSync(join(dir, d), { recursive: true });
  }
  writeFileSync(join(dir, "project.md"),
    fm(`id: project-t\ngoal: test\npersonas: [engineer]\ncreatedAt: ${T(1)}\nupdatedAt: ${T(1)}${g.project}`, "# t"));
  const log = [];
  const state = (ref, field, value) => {
    const id = ref.slice(ref.indexOf(":") + 1);
    if (field === "status") { log.push([ref, "status", "", value, T(2), "", g.proposedBy[id] || ""]); return; }
    if (value === "accepted") {
      const by = id in g.acceptedBy ? g.acceptedBy[id] : "alice";
      const at = g.acceptedAt[id] || T(3);
      log.push([ref, "review", "", "proposed", T(2), "", g.proposedBy[id] || ""]);
      log.push([ref, "review", "proposed", "accepted", at, "", by]);
    } else {
      log.push([ref, "review", "", value, T(2), "", g.proposedBy[id] || ""]);
    }
  };
  for (const [id, n] of Object.entries(g.nodes)) {
    writeFileSync(join(dir, `nodes/${n.type}/${id}.md`),
      fm(`${base(id, n.review)}\ntype: ${n.type}\ntitle: ${id}\nstatus: ${n.status}`, `# ${id}`));
    state(`node:${id}`, "review", n.review);
    state(`node:${id}`, "status", n.status);
  }
  for (const [id, n] of Object.entries(g.noteworthy)) {
    writeFileSync(join(dir, `noteworthy/${id}.md`), fm(`${base(id, n.review)}\nkind: ${n.kind}`, `# ${id}`));
    state(`noteworthy:${id}`, "review", n.review);
  }
  writeFileSync(join(dir, "edges/edges.md"),
    fm(`provenance:\n  conversationId: t\n  timestamp: ${T(1)}\nreview: accepted`,
      table(["id", "kind", "from", "to", "weight", "review"],
        Object.entries(g.edges).map(([id, [kind, from, to, review]]) => [id, kind, from, to, "", review]))));
  for (const [id, e] of Object.entries(g.edges)) state(`edge:${id}`, "review", e[3]);
  if (g.log) {
    log.sort((a, b) => (a[4] < b[4] ? -1 : a[4] > b[4] ? 1 : 0));
    writeFileSync(join(dir, "transitions/transitions.md"),
      "# Transitions\n\n" + table(["ref", "field", "from", "to", "timestamp", "source", "by"], log));
  }
  if (g.principals) {
    writeFileSync(join(dir, "authority/principals.md"), "# Principals\n\n" + table(["id", "kind", "roles", "key"], g.principals));
    writeFileSync(join(dir, "authority/grants.md"),
      "# Grants\n\n" + table(["scope", "acceptor", "action", "grantor", "timestamp", "source"], g.grants));
  }
  writeFileSync(join(dir, "changes/changed.md"),
    "# Changed code\n\n" + table(["entity", "commit", "file", "timestamp"], g.changed));
  writeFileSync(join(dir, `commands/${COMMAND_HASH}.md`), COMMAND);
  writeFileSync(join(dir, "commands/executed.md"),
    "# Executed commands\n\n" + table(["entity", "command"], g.executed.map((e) => [e, COMMAND_HASH])));
  return dir;
}

function codes(mutate) {
  const g = GRAPH();
  mutate(g);
  const dir = build(g);
  try {
    return loadInstance(dir, { personas: [engineer] }).problems
      .filter((p) => p.severity !== "info")
      .map((p) => `${p.severity}:${p.code}`)
      .filter((c, ix, all) => all.indexOf(c) === ix)
      .sort();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const scoped = (g) => { g.grants.push(["node:task-a", "bob", "grant", "alice", T(1), ""]); };
const allAcceptedBy = (g, ids, who) => { for (const id of ids) g.acceptedBy[id] = who; };
// Atoms inside task-a's subgraph: the node, its noted decision, and the edges
// whose `from` endpoint is task-a. task-c is at distance 1 from task-a.
const UNDER_A = ["task-a", "nw-a", "e-dec-ac", "e-not-a", "task-c"];
const UNDER_B = ["task-b", "e-dec-bc", "task-c"];

const CASES = [
  // ----- authority -----
  ["baseline: one human with the whole-graph grant", () => {}, []],
  ["no registry: who wrote a row is not checked",
    (g) => { g.principals = null; g.acceptedBy["task-a"] = ""; }, []],
  ["acceptance row without by", (g) => { g.acceptedBy["task-a"] = ""; }, ["error:acceptance-unattributed"]],
  ["by is not a declared principal", (g) => { g.acceptedBy["task-a"] = "mallory"; }, ["error:unknown-principal"]],
  ["acceptor holds no grant", (g) => { g.acceptedBy["task-b"] = "bob"; }, ["error:acceptance-without-grant"]],
  ["grant issued after the acceptance",
    (g) => { g.grants.push(["*", "bob", "grant", "alice", T(5), ""]); g.acceptedBy["task-b"] = "bob"; },
    ["error:acceptance-without-grant"]],
  ["grant revoked before the acceptance",
    (g) => {
      g.grants.push(["*", "bob", "grant", "alice", T(1), ""], ["*", "bob", "revoke", "alice", T(2), ""]);
      g.acceptedBy["task-b"] = "bob";
    }, ["error:acceptance-without-grant"]],
  ["grant revoked after the acceptance: the acceptance stands",
    (g) => {
      g.grants.push(["*", "bob", "grant", "alice", T(1), ""], ["*", "bob", "revoke", "alice", T(9), ""]);
      g.acceptedBy["task-b"] = "bob";
    }, []],
  ["node scope: its acceptor accepts the node, its attached decision, and its edges",
    (g) => { scoped(g); allAcceptedBy(g, UNDER_A, "bob"); }, []],
  ["node scope: the whole-graph acceptor does not accept inside it",
    (g) => { scoped(g); allAcceptedBy(g, ["nw-a", "e-dec-ac", "e-not-a", "task-c"], "bob"); },
    ["error:acceptance-without-grant"]],
  ["node scope: its acceptor does not accept outside it",
    (g) => { scoped(g); allAcceptedBy(g, [...UNDER_A, "task-b"], "bob"); }, ["error:acceptance-without-grant"]],
  ["group: any holder of a grant on the scope accepts",
    (g) => {
      scoped(g);
      g.grants.push(["node:task-a", "carol", "grant", "alice", T(1), ""]);
      allAcceptedBy(g, ["task-a", "e-dec-ac", "task-c"], "bob");
      allAcceptedBy(g, ["nw-a", "e-not-a"], "carol");
    }, []],
  ["two scopes at the same distance from a proposed atom",
    (g) => {
      scoped(g);
      g.grants.push(["node:task-b", "carol", "grant", "alice", T(1), ""]);
      allAcceptedBy(g, ["task-a", "nw-a", "e-dec-ac", "e-not-a"], "bob");
      allAcceptedBy(g, ["task-b", "e-dec-bc"], "carol");
      g.nodes["task-c"].review = "proposed";
    }, ["error:ambiguous-grant-scope"]],
  ["a grant naming the entity resolves the ambiguity",
    (g) => {
      scoped(g);
      g.grants.push(["node:task-b", "carol", "grant", "alice", T(1), ""], ["node:task-c", "carol", "grant", "alice", T(1), ""]);
      allAcceptedBy(g, ["task-a", "nw-a", "e-dec-ac", "e-not-a"], "bob");
      allAcceptedBy(g, ["task-b", "e-dec-bc"], "carol");
      g.nodes["task-c"].review = "proposed";
    }, []],
  ["agent accepts an atom another agent proposed",
    (g) => {
      g.grants.push(["node:task-b", "bot-1", "grant", "alice", T(1), ""]);
      allAcceptedBy(g, UNDER_B, "bot-1");
      for (const id of UNDER_B) g.proposedBy[id] = "bot-2";
    }, []],
  ["agent accepts an atom it proposed",
    (g) => {
      g.grants.push(["node:task-b", "bot-1", "grant", "alice", T(1), ""]);
      allAcceptedBy(g, UNDER_B, "bot-1");
      for (const id of UNDER_B) g.proposedBy[id] = "bot-2";
      g.proposedBy["task-b"] = "bot-1";
    }, ["error:self-acceptance"]],
  ["agent accepts an atom with no recorded proposer",
    (g) => {
      g.grants.push(["node:task-b", "bot-1", "grant", "alice", T(1), ""]);
      allAcceptedBy(g, UNDER_B, "bot-1");
      for (const id of UNDER_B) g.proposedBy[id] = "bot-2";
      delete g.proposedBy["task-b"];
    }, ["error:unattributed-proposal"]],
  ["a grantor that is an agent", (g) => { g.principals[3] = ["bot-1", "agent", "grantor", ""]; }, ["error:grantor-not-human"]],
  ["a grant issued by a principal without the grantor role confers nothing",
    (g) => { g.grants.push(["node:task-b", "carol", "grant", "bob", T(1), ""]); }, ["error:grant-without-grantor"]],
  ["a grant issued by a non-grantor does not authorize an acceptance",
    (g) => { g.grants.push(["node:task-b", "carol", "grant", "bob", T(1), ""]); allAcceptedBy(g, UNDER_B, "carol"); },
    ["error:acceptance-without-grant", "error:grant-without-grantor"]],
  ["a registry with no grantor: no grant is effective",
    (g) => { g.principals[0] = ["alice", "human", "", ""]; },
    ["error:acceptance-without-grant", "error:grant-without-grantor", "error:no-grantor"]],
  ["grantorAccepts: forbidden and a grant to a grantor",
    (g) => { g.project = "\ngrantorAccepts: forbidden"; }, ["error:acceptance-without-grant", "error:grantor-accepts"]],
  ["grant scope that names no entity", (g) => { g.grants.push(["node:task-gone", "bob", "grant", "alice", T(1), ""]); },
    ["error:dangling-grant-scope"]],
  ["grant with an unknown action and an unparseable timestamp",
    (g) => { g.grants.push(["node:task-b", "bob", "permit", "alice", "soon", ""]); },
    ["error:grant-incomplete", "error:unknown-grant-action"]],
  ["proposed atom that no grant covers",
    (g) => { g.grants[0] = ["node:task-a", "alice", "grant", "alice", T(1), ""]; g.nodes["task-b"].review = "proposed";
      // Everything outside task-a's subgraph was accepted with no grant in force.
      g.acceptedBy["goal-g"] = "alice"; },
    ["error:acceptance-without-grant", "warning:no-acceptor"]],

  // ----- acceptance before work -----
  ["basis proposed (default): work on a proposed entity is not checked",
    (g) => { g.nodes["task-b"].review = "proposed"; g.changed.push(["task-b", "abc1234", "a.js", T(2)]); g.executed.push("task-b"); },
    []],
  ["basis accepted: changed-code row on a proposed entity",
    (g) => { g.project = "\nbasis: accepted"; g.nodes["task-b"].review = "proposed"; g.changed.push(["task-b", "abc1234", "a.js", ""]); },
    ["error:work-on-unaccepted"]],
  ["basis accepted: executed-command row on a proposed entity",
    (g) => { g.project = "\nbasis: accepted"; g.nodes["task-b"].review = "proposed"; g.executed.push("task-b"); },
    ["error:work-on-unaccepted"]],
  ["basis accepted: resolved node that is not accepted",
    (g) => { g.project = "\nbasis: accepted"; g.nodes["task-b"].review = "proposed"; g.nodes["task-b"].status = "resolved"; },
    ["error:work-on-unaccepted"]],
  ["basis accepted: resolved node with a proposed decision attached",
    (g) => { g.project = "\nbasis: accepted"; g.nodes["task-a"].status = "resolved"; g.noteworthy["nw-a"].review = "proposed"; },
    ["error:resolved-on-unaccepted-decision"]],
  ["basis accepted: binding row written before the acceptance",
    (g) => { g.project = "\nbasis: accepted"; g.changed.push(["task-b", "abc1234", "a.js", T(2, "12")]); },
    ["error:bound-before-acceptance"]],
  ["basis accepted: binding row written after the acceptance",
    (g) => { g.project = "\nbasis: accepted"; g.changed.push(["task-b", "abc1234", "a.js", T(4)]); g.executed.push("task-b"); }, []],
  ["basis accepted: binding row with no timestamp is exempt from the order check",
    (g) => { g.project = "\nbasis: accepted"; g.changed.push(["task-b", "abc1234", "a.js", ""]); }, []],
  ["basis accepted without a transition log: order cannot be checked",
    (g) => { g.project = "\nbasis: accepted"; g.principals = null; g.log = false; g.changed.push(["task-b", "abc1234", "a.js", T(4)]); },
    ["warning:basis-order-unverifiable"]],
  ["basis with an unknown value", (g) => { g.project = "\nbasis: strict"; }, ["warning:unknown-enum"]],
];

const failures = [];
for (const [name, mutate, want] of CASES) {
  const got = codes(mutate);
  const ok = JSON.stringify(got) === JSON.stringify(want.slice().sort());
  if (!ok) failures.push(`${name}: wanted [${want}] got [${got}]`);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}`);
}
if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
console.log(`\n${CASES.length} case(s) passed.`);
