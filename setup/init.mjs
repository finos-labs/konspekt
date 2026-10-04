#!/usr/bin/env node
/**
 * konspekt setup — scaffold konspekt project state into the current repo, and
 * install optional components into an instance that already exists.
 *
 * Run from the root of the repo you want to adopt konspekt (Node 18+):
 *
 *   node setup/init.mjs [--name "Project Name"] [--goal "one-line goal"] [--push]
 *       Scaffold a new instance. Refuses to clobber an existing one.
 *
 *   node setup/init.mjs --list
 *       List available components.
 *
 *   node setup/init.mjs --add <component> [--force] [--push]
 *       Install a component into an existing instance.
 *
 *   node setup/init.mjs --check [<component>]
 *       Report drift between installed files and their component templates.
 *       Writes nothing. Exit 1 if anything has drifted.
 *
 * Scaffolding creates a `.konspekt/` umbrella — a minimal konspekt instance
 * plus an operating envelope — and writes agent instruction files: the konspekt
 * stanza in AGENTS.md (the cross-tool standard) plus CLAUDE.md and GEMINI.md
 * pointers to it. --tool adds explicit per-tool files (cursor/copilot/windsurf).
 *
 * Components are the second mode, and the reason it exists: scaffolding is
 * create-or-refuse, so it cannot retrofit anything onto a live instance
 * (concept-instance-upgradeability). Installed component files are a
 * projection of setup/components/<id>/, never a tracking copy — edit the
 * component and re-run with --force. The one exception is a file marked
 * `seed: true` in the manifest, which is the adopter's config and is written
 * once.
 *
 * Component sources resolve relative to THIS SCRIPT; install targets resolve
 * relative to the CURRENT WORKING DIRECTORY. So installing into a second repo
 * is: cd /path/to/other-repo && node /path/to/konspekt/setup/init.mjs --add X
 *
 * Zero dependencies. The konspekt standard:
 * https://github.com/denisurusov/konspekt (spec/data-model, spec/architecture).
 */
import {
  existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync,
} from "node:fs";
import { dirname, join, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const TPL = join(HERE, "templates");
const COMPONENTS = join(HERE, "components");

// The instance lives at `.konspekt/instance`. This is a constant of the
// filesystem binding, not a configurable: this script is what writes it, so
// every consumer that hardcodes it is conforming rather than assuming.
const INSTANCE = ".konspekt/instance";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};

const root = process.cwd();

if (has("--help") || has("-h")) {
  console.log(
    [
      "konspekt setup",
      "",
      "  node setup/init.mjs [--name NAME] [--goal GOAL] [--persona LAYER] [--tool T] [--push]",
      "      Scaffold a new .konspekt/ instance into the current repo.",
      "      --persona activates a konspekt persona layer (repeatable),",
      "      e.g. --persona engineer.",
      "      --tool writes an explicit per-tool pointer file (repeatable):",
      "      cursor, copilot, windsurf. AGENTS.md + CLAUDE.md + GEMINI.md",
      "      are always written; most agents read AGENTS.md natively.",
      "",
      "  node setup/init.mjs --list",
      "      List available components.",
      "",
      "  node setup/init.mjs --add <component> [--force] [--push]",
      "      Install a component into an existing instance.",
      "",
      "  node setup/init.mjs --check [<component>]",
      "      Report drift between installed files and component templates.",
      "",
      "  Targets resolve relative to the current directory, so run this from",
      "  the root of the repo you are installing into.",
    ].join("\n")
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Manifest reading
//
// Deliberately not a YAML parser, for the same reason the notifier's
// front-matter reader is not one: it handles exactly the shapes the manifest
// format allows and fails loudly on anything else, rather than dragging in a
// dependency to be liberal about input we control.
// ---------------------------------------------------------------------------

function parseManifest(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const m = { files: [] };
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;

    // `needs:` is a bare list of repo-relative paths a component calls at
    // runtime but does not ship. Distinct from `requires:`, which names
    // install-time permissions. No shipped component uses it: `conformance`
    // was the candidate and instead ships the checker as a projection, because
    // a hand-vendored copy is the drift it exists to catch. Kept because the
    // case is real for a component that must call something it cannot own —
    // if nothing uses it by the third component, delete it.
    if (/^needs:\s*$/.test(raw)) {
      m.needs = [];
      for (i++; i < lines.length; i++) {
        const l = lines[i];
        if (!l.trim() || l.trimStart().startsWith("#")) continue;
        if (/^\S/.test(l)) { i--; break; }
        const item = l.match(/^\s*-\s+(.+)$/);
        if (item) m.needs.push(item[1].trim());
      }
      continue;
    }

    if (/^files:\s*$/.test(raw)) {
      for (i++; i < lines.length; i++) {
        const l = lines[i];
        if (!l.trim() || l.trimStart().startsWith("#")) continue;
        if (/^\S/.test(l)) { i--; break; }
        const item = l.match(/^\s*-\s+from:\s*(.+)$/);
        if (item) { m.files.push({ from: item[1].trim() }); continue; }
        const kv = l.match(/^\s+(\w+):\s*(.+)$/);
        if (kv && m.files.length) {
          const v = kv[2].trim();
          m.files[m.files.length - 1][kv[1]] = v === "true" ? true : v === "false" ? false : v;
        }
      }
      continue;
    }

    const block = raw.match(/^(\w+):\s*\|\s*$/);
    if (block) {
      const buf = [];
      for (i++; i < lines.length; i++) {
        const l = lines[i];
        if (l.trim() && /^\S/.test(l)) { i--; break; }
        buf.push(l.replace(/^ {2}/, ""));
      }
      m[block[1]] = buf.join("\n").replace(/\s+$/, "");
      continue;
    }

    const flow = raw.match(/^(\w+):\s*\[(.*)\]\s*$/);
    if (flow) {
      m[flow[1]] = flow[2].split(",").map((x) => x.trim()).filter(Boolean);
      continue;
    }

    const kv = raw.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      // Folded continuation: subsequent indented, non-list lines join with a space.
      let val = kv[2].trim();
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1]) && !/^\s*-\s/.test(lines[i + 1])) {
        val += " " + lines[++i].trim();
      }
      m[kv[1]] = val;
    }
  }
  return m;
}

function listComponents() {
  if (!existsSync(COMPONENTS)) return [];
  return readdirSync(COMPONENTS)
    .filter((d) => statSync(join(COMPONENTS, d)).isDirectory())
    .filter((d) => existsSync(join(COMPONENTS, d, "manifest.yml")))
    .sort();
}

function loadComponent(id) {
  const dir = join(COMPONENTS, id);
  const mf = join(dir, "manifest.yml");
  if (!existsSync(mf)) {
    console.error(`Unknown component "${id}". Available: ${listComponents().join(", ") || "(none)"}`);
    process.exit(1);
  }
  const m = parseManifest(readFileSync(mf, "utf8"));
  if (!m.files.length) {
    console.error(`Component "${id}" declares no files.`);
    process.exit(1);
  }
  return { ...m, id, dir };
}

// ---------------------------------------------------------------------------
// --list
// ---------------------------------------------------------------------------

if (has("--list")) {
  const ids = listComponents();
  if (!ids.length) {
    console.log("No components available.");
    process.exit(0);
  }
  console.log("Available components:\n");
  for (const id of ids) {
    const m = loadComponent(id);
    console.log(`  ${id}${m.binding ? `  [${m.binding} binding]` : ""}`);
    if (m.title) console.log(`    ${m.title}`);
    if (m.summary) console.log(`    ${m.summary}`);
    if (m.requires) console.log(`    requires: ${m.requires.join(", ")}`);
    if (m.needs) console.log(`    needs: ${m.needs.join(", ")}`);
    console.log("");
  }
  console.log("Install with:  node setup/init.mjs --add <component>");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// --check
// ---------------------------------------------------------------------------

if (has("--check")) {
  const only = opt("--check", null);
  const ids = only ? [only] : listComponents();
  let drifted = 0;
  let checked = 0;
  for (const id of ids) {
    const m = loadComponent(id);
    for (const f of m.files) {
      const target = join(root, f.to);
      if (!existsSync(target)) continue; // not installed — not drift
      if (f.seed) continue;              // config, expected to differ
      checked++;
      const want = readFileSync(join(m.dir, f.from), "utf8");
      const got = readFileSync(target, "utf8");
      if (want !== got) {
        console.log(`DRIFT  ${f.to}`);
        console.log(`       differs from ${relative(root, join(m.dir, f.from)) || f.from}`);
        drifted++;
      }
    }
  }
  if (!checked) {
    console.log("Nothing installed to check.");
    process.exit(0);
  }
  if (drifted) {
    console.log(`\n${drifted} of ${checked} installed file(s) drifted.`);
    console.log("Regenerate with:  node setup/init.mjs --add <component> --force");
    process.exit(1);
  }
  console.log(`${checked} installed file(s) match their component templates.`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// --add
// ---------------------------------------------------------------------------

if (has("--add")) {
  const id = opt("--add", null);
  if (!id) {
    console.error("--add needs a component id. See: node setup/init.mjs --list");
    process.exit(1);
  }
  const m = loadComponent(id);

  // Inverse of the scaffold guard: a component needs something to attach to.
  if (!existsSync(join(root, INSTANCE))) {
    console.error(`No konspekt instance at ${INSTANCE}/.`);
    console.error("Scaffold one first:  node setup/init.mjs");
    process.exit(1);
  }

  // Runtime prerequisites a component calls but does not ship. Refuse rather
  // than install something that cannot run.
  if (m.needs && m.needs.length) {
    const missing = m.needs.filter((rel) => !existsSync(join(root, rel)));
    if (missing.length) {
      console.error(`Component "${id}" needs files this repo does not have:`);
      for (const rel of missing) console.error(`  ${rel}`);
      console.error("");
      console.error("Vendor them alongside setup/ and try again.");
      process.exit(1);
    }
  }

  const force = has("--force");
  const writes = [];
  const skips = [];
  for (const f of m.files) {
    const exists = existsSync(join(root, f.to));
    if (exists && f.seed) { skips.push([f.to, "seed file, kept as-is"]); continue; }
    if (exists && !force) { skips.push([f.to, "already installed, use --force to regenerate"]); continue; }
    writes.push(f);
  }

  if (m.requires && m.requires.includes("workflows")) {
    console.log(
      [
        "Note: this component writes under .github/workflows/.",
        "GitHub Apps and MCP connectors need an explicit `workflows` scope to PUSH",
        "such a file — the local write succeeds and the push is what gets rejected.",
        "If you are driving konspekt through a connector, run this from a terminal.",
        "",
      ].join("\n")
    );
  }

  console.log(`Installing component "${id}" into ${root}\n`);
  for (const f of writes) {
    const p = join(root, f.to);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, readFileSync(join(m.dir, f.from), "utf8"));
    console.log("  +", f.to);
  }
  for (const [path, why] of skips) console.log("  =", path, `(${why})`);

  if (!writes.length) {
    console.log("\nNothing to do.");
    process.exit(0);
  }

  if (m.next) {
    console.log("\nNext:");
    for (const line of m.next.split("\n")) console.log("  " + line);
  }

  if (has("--push")) {
    console.log("\nPushing...");
    const paths = m.files.map((f) => f.to).join(" ");
    try {
      execSync(`git add ${paths}`, { cwd: root, stdio: "inherit" });
      execSync(`git commit -m "install konspekt component: ${id}"`, { cwd: root, stdio: "inherit" });
      execSync("git push", { cwd: root, stdio: "inherit" });
      console.log("Pushed.");
    } catch {
      console.error("git step failed — the files are on disk; commit manually.");
      if (m.requires && m.requires.includes("workflows")) {
        console.error("If the push was rejected, check that your credential holds the `workflows` scope.");
      }
      process.exit(1);
    }
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Default: scaffold a new instance
// ---------------------------------------------------------------------------

const name = opt("--name", basename(root));
const slug =
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
const goal = opt("--goal", "ONE-LINE GOAL \u2014 replace with what this project is trying to achieve.");
// --persona is repeatable and also accepts a comma list: --persona engineer
const personas = args.flatMap((a, i) =>
  a === "--persona" && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1].split(",").map((x) => x.trim()).filter(Boolean)
    : []
);
const personasLine = personas.length
  ? `personas: [${personas.join(", ")}]`
  : "# personas: []   # optional persona layers, e.g. [engineer] \u2014 see spec/personas/";
// --tool writes an explicit per-tool pointer file (repeatable / comma list).
// AGENTS.md + CLAUDE.md + GEMINI.md are always written; these are extras for
// teams that want a native file per tool even though each reads AGENTS.md.
const tools = args.flatMap((a, i) =>
  a === "--tool" && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1].split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)
    : []
);
const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

if (existsSync(join(root, INSTANCE))) {
  console.error(`Refusing to overwrite existing ${INSTANCE}/. Remove it or edit by hand.`);
  console.error("To add an optional component to it instead:  node setup/init.mjs --list");
  process.exit(1);
}

const fill = (s) =>
  s.replaceAll("{{NAME}}", name).replaceAll("{{SLUG}}", slug).replaceAll("{{GOAL}}", goal).replaceAll("{{TS}}", ts).replaceAll("{{PERSONAS}}", personasLine);
const tpl = (f) => fill(readFileSync(join(TPL, f), "utf8"));
const put = (rel, content) => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  console.log("  +", rel);
};

console.log(`Scaffolding konspekt into ${root}\n`);
if (personas.length) console.log(`  persona layer(s): ${personas.join(", ")}\n`);

put(`${INSTANCE}/project.md`, tpl("project.md"));
put(`${INSTANCE}/edges/edges.md`, tpl("edges.md"));
put(`${INSTANCE}/transitions/transitions.md`, tpl("transitions.md"));
put(`${INSTANCE}/sources/README.md`, tpl("sources-README.md"));
for (const d of ["nodes", "concepts", "noteworthy", "artifacts", "waypoints"]) {
  put(`${INSTANCE}/${d}/.gitkeep`, "");
}
put(".konspekt/OPERATING.md", tpl("OPERATING.md"));
put(".konspekt/NOTES.md", tpl("NOTES.md"));

// Agent instruction files. AGENTS.md carries the konspekt stanza and is the
// cross-tool open standard (read natively by Claude Code, Cursor, Codex,
// Copilot, Grok, Windsurf, Zed, Aider, and others). CLAUDE.md and GEMINI.md are
// thin pointers to it, for the tools that key off their own filename; the stanza
// stays single-source in AGENTS.md. --tool adds explicit per-tool files.
const stanza = tpl("AGENTS-stanza.md");
const pointer = tpl("POINTER-stanza.md");
const MARKER = "## konspekt project state";

const appendStanza = (rel, body, label) => {
  const p = join(root, rel);
  if (existsSync(p)) {
    const cur = readFileSync(p, "utf8");
    if (cur.includes(MARKER)) {
      console.log(`  = ${rel} already has a konspekt stanza (skipped)`);
    } else {
      writeFileSync(p, cur.replace(/\s*$/, "") + "\n\n" + body);
      console.log(`  ~ ${rel} (appended ${label})`);
    }
  } else {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
    console.log("  +", rel);
  }
};

appendStanza("AGENTS.md", stanza, "konspekt stanza");
appendStanza("CLAUDE.md", pointer, "konspekt pointer");
appendStanza("GEMINI.md", pointer, "konspekt pointer");

for (const t of tools) {
  if (t === "cursor") {
    const cp = join(root, ".cursor/rules/konspekt.mdc");
    if (existsSync(cp)) {
      console.log("  = .cursor/rules/konspekt.mdc already present (skipped)");
    } else {
      mkdirSync(dirname(cp), { recursive: true });
      writeFileSync(cp, tpl("cursor-rule.mdc"));
      console.log("  + .cursor/rules/konspekt.mdc");
    }
  } else if (t === "copilot") {
    appendStanza(".github/copilot-instructions.md", pointer, "konspekt pointer");
  } else if (t === "windsurf") {
    appendStanza(".windsurfrules", pointer, "konspekt pointer");
  } else {
    console.log(`  ! unknown --tool "${t}" (known: cursor, copilot, windsurf)`);
  }
}

console.log("\nDone. Next:");
console.log(`  1. Edit ${INSTANCE}/project.md \u2014 set the goal and summary.`);
console.log("  2. Review .konspekt/OPERATING.md \u2014 the operating policy you just adopted.");
console.log("  3. Commit:  git add .konspekt AGENTS.md CLAUDE.md GEMINI.md && git commit -m 'adopt konspekt'");
const comps = listComponents();
if (comps.length) {
  console.log(`  4. Optional add-ons: node setup/init.mjs --list  (${comps.join(", ")})`);
}

if (has("--push")) {
  console.log("\nPushing...");
  try {
    const agentFiles = ["AGENTS.md", "CLAUDE.md", "GEMINI.md",
      ".github/copilot-instructions.md", ".windsurfrules", ".cursor/rules/konspekt.mdc"]
      .filter((f) => existsSync(join(root, f)));
    execSync(`git add .konspekt ${agentFiles.join(" ")}`, { cwd: root, stdio: "inherit" });
    execSync('git commit -m "adopt konspekt project state"', { cwd: root, stdio: "inherit" });
    execSync("git push", { cwd: root, stdio: "inherit" });
    console.log("Pushed.");
  } catch {
    console.error("git step failed \u2014 the scaffold is on disk; commit manually.");
    process.exit(1);
  }
}
