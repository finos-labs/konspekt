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
 * https://github.com/finos-labs/konspekt (spec/data-model, spec/architecture).
 */
import {
  existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync,
} from "node:fs";
import { dirname, join, basename, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const TPL = join(HERE, "templates");
const COMPONENTS = join(HERE, "components");
// The standard's persona layers live at the repo root, beside setup/. Vendoring
// copies a layer FROM here INTO an adopter's .konspekt/spec/personas/<layer>/,
// where the checker resolves registries (nw-component-ships-import-closure).
const SPEC_PERSONAS = join(HERE, "..", "spec", "personas");

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
      "  node setup/init.mjs [--name NAME] [--goal GOAL] [--persona LAYER] [--tool T] [--full] [--push]",
      "      Scaffold a new .konspekt/ instance into the current repo.",
      "      --full also installs every component in the same run, producing",
      "      the fully adopted repo pictured in setup/README.md.",
      "      --persona activates a konspekt persona layer (repeatable),",
      "      e.g. --persona engineer. Add --vendor-persona to also copy the",
      "      layer's registry into .konspekt/spec/personas/ so the checker",
      "      resolves it instead of degrading to core-only.",
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
      "  node setup/init.mjs --vendor-persona <layer> [--push]",
      "      Copy a persona layer's registry from the standard into an existing",
      "      instance's .konspekt/spec/personas/<layer>/ (repeatable / comma list).",
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

// Merge a component's settings.json into an adopter's existing one instead of
// clobbering it. Claude Code fixes the .claude/settings.json path, so an
// adopter may already have hooks of their own. This adds each of the
// component's hook groups under its event, de-duped on the inner hook
// `command` (so --force re-install is idempotent), and copies any other
// top-level key only when absent — the adopter's own settings are never
// overwritten. targetText is "" when no file exists yet.
function mergeSettingsJson(targetText, sourceText) {
  const target = targetText.trim() ? JSON.parse(targetText) : {};
  const source = JSON.parse(sourceText);
  target.hooks = target.hooks || {};
  for (const [event, groups] of Object.entries(source.hooks || {})) {
    const existing = target.hooks[event] || (target.hooks[event] = []);
    const commands = new Set(
      existing.flatMap((g) => (g.hooks || []).map((h) => h.command))
    );
    for (const g of groups) {
      const cmds = (g.hooks || []).map((h) => h.command);
      if (cmds.some((c) => commands.has(c))) continue; // already wired
      existing.push(g);
      for (const c of cmds) commands.add(c);
    }
  }
  for (const k of Object.keys(source)) {
    if (k !== "hooks" && !(k in target)) target[k] = source[k];
  }
  return JSON.stringify(target, null, 2) + "\n";
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

// Install one component's files into `root`. Shared by --add and the scaffold
// --full path. Returns { wrote, m }. Hard errors (no instance, missing
// `needs`) exit the process. `quiet` suppresses the component's own "Next:"
// epilogue, for the batch (--full) case where one combined epilogue is printed.
function installComponent(id, { force = false, quiet = false } = {}) {
  const m = loadComponent(id);

  // A component needs an instance to attach to.
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

  const writes = [];
  const skips = [];
  for (const f of m.files) {
    const exists = existsSync(join(root, f.to));
    // Merge files are never skipped: the merge is non-destructive and
    // idempotent, so it runs whether or not the target already exists.
    if (f.merge) { writes.push(f); continue; }
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
    const src = readFileSync(join(m.dir, f.from), "utf8");
    if (f.merge === "json") {
      const existed = existsSync(p);
      writeFileSync(p, mergeSettingsJson(existed ? readFileSync(p, "utf8") : "", src));
      console.log(existed ? "  ~" : "  +", f.to, existed ? "(merged)" : "");
    } else {
      writeFileSync(p, src);
      console.log("  +", f.to);
    }
  }
  for (const [path, why] of skips) console.log("  =", path, `(${why})`);

  if (!writes.length) {
    console.log("\nNothing to do.");
    return { wrote: false, m };
  }

  if (m.next && !quiet) {
    console.log("\nNext:");
    for (const line of m.next.split("\n")) console.log("  " + line);
  }
  return { wrote: true, m };
}

// A persona layer is vendorable when the standard ships it with a registry —
// that is what the checker loads; the SPEC.md / AGENTS.md beside it are the
// layer's operating docs the agent reads, carried along for completeness.
function availablePersonas() {
  if (!existsSync(SPEC_PERSONAS)) return [];
  return readdirSync(SPEC_PERSONAS)
    .filter((d) => {
      const p = join(SPEC_PERSONAS, d);
      return statSync(p).isDirectory() && existsSync(join(p, "registry.mjs"));
    })
    .sort();
}

// Copy a persona layer from the standard into the adopter's umbrella at
// .konspekt/spec/personas/<layer>/, the one place the checker looks. This is an
// explicit, opt-in projection of the standard's spec (not auto-vendored at
// scaffold time), so a repo that wants its persona layer *resolved* — rather
// than degrading to core-only with a warning — asks for it with one command.
// Like any projection it overwrites: a local edit here is drift --check reports
// against the standard. Returns the number of files written.
function vendorPersona(layer, { quiet = false } = {}) {
  const srcDir = join(SPEC_PERSONAS, layer);
  if (!existsSync(srcDir) || !statSync(srcDir).isDirectory()) {
    console.error(`Unknown persona layer "${layer}". Available: ${availablePersonas().join(", ") || "(none)"}`);
    process.exit(1);
  }
  const relDir = `.konspekt/spec/personas/${layer}`;
  const targetDir = join(root, relDir);
  mkdirSync(targetDir, { recursive: true });
  if (!quiet) console.log(`Vendoring persona layer "${layer}" into ${relDir}/`);
  let wrote = 0;
  for (const name of readdirSync(srcDir)) {
    const sp = join(srcDir, name);
    if (!statSync(sp).isFile()) continue;
    const tp = join(targetDir, name);
    const existed = existsSync(tp);
    writeFileSync(tp, readFileSync(sp, "utf8"));
    if (!quiet) console.log(existed ? "  ~" : "  +", `${relDir}/${name}`);
    wrote++;
  }
  return wrote;
}

// Layers requested with --vendor-persona (repeatable / comma list). A bare
// --vendor-persona carries no layer and defers to the --persona set (scaffold
// path); a standalone call must name at least one.
const vendorArgs = args.flatMap((a, i) =>
  a === "--vendor-persona" && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1].split(",").map((x) => x.trim()).filter(Boolean)
    : []
);

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
  const layers = availablePersonas();
  if (layers.length) {
    console.log(`\nPersona layers:  ${layers.join(", ")}`);
    console.log("Vendor with:  node setup/init.mjs --vendor-persona <layer>");
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// --check
// ---------------------------------------------------------------------------

if (has("--check")) {
  const only = opt("--check", null);
  const ids = only ? [only] : listComponents();
  // True when --check runs inside the konspekt repo itself (setup/ is at the
  // repo root, so HERE/.. is that root). konspekt is the SOURCE the components
  // project from, not an adopter of them, so a file marked
  // `sourceRepoKeepsOwn` is hand-maintained here and legitimately differs from
  // the adopter template — skip it to avoid a false drift.
  const isSelf = resolve(join(HERE, "..")) === resolve(root);
  let drifted = 0;
  let checked = 0;
  for (const id of ids) {
    const m = loadComponent(id);
    for (const f of m.files) {
      const target = join(root, f.to);
      if (!existsSync(target)) continue; // not installed — not drift
      if (f.seed) continue;              // config, expected to differ
      if (f.merge) continue;             // merged into the adopter's file, expected to differ
      if (isSelf && f.sourceRepoKeepsOwn) continue; // konspekt's own source, not a projection
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

  // Vendored persona layers are projections of the standard's spec/personas/,
  // so check each adopter file against its source the same way. Only on a full
  // --check (a component-scoped check stays scoped); skipped in konspekt itself,
  // which has no .konspekt/spec/personas/ (its checker reads root spec/ direct).
  const adopterPersonas = join(root, ".konspekt/spec/personas");
  if (!only && existsSync(adopterPersonas)) {
    for (const layer of readdirSync(adopterPersonas)) {
      const tdir = join(adopterPersonas, layer);
      if (!statSync(tdir).isDirectory()) continue;
      const sdir = join(SPEC_PERSONAS, layer);
      for (const name of readdirSync(tdir)) {
        const tp = join(tdir, name);
        if (!statSync(tp).isFile()) continue;
        checked++;
        const rel = `.konspekt/spec/personas/${layer}/${name}`;
        const sp = join(sdir, name);
        if (!existsSync(sp)) {
          console.log(`DRIFT  ${rel}`);
          console.log(`       no counterpart in the standard's spec/personas/${layer}/`);
          drifted++;
          continue;
        }
        if (readFileSync(sp, "utf8") !== readFileSync(tp, "utf8")) {
          console.log(`DRIFT  ${rel}`);
          console.log(`       differs from the standard's spec/personas/${layer}/${name}`);
          drifted++;
        }
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
    console.log("    (persona file:  node setup/init.mjs --vendor-persona <layer>)");
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
  const { wrote, m } = installComponent(id, { force: has("--force") });
  if (!wrote) process.exit(0);

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
// --vendor-persona, standalone (instance already exists)
//
// Mirrors --add: retrofit a persona registry onto a live instance. When the
// instance does NOT yet exist this falls through to the scaffold path, where
// --vendor-persona runs after scaffolding (and a bare flag vendors the
// --persona layers). So a standalone call is distinguished by the instance
// already being present, and it must name the layer(s) explicitly.
// ---------------------------------------------------------------------------

if (has("--vendor-persona") && existsSync(join(root, INSTANCE))) {
  if (!vendorArgs.length) {
    console.error("--vendor-persona needs a layer id, e.g. --vendor-persona engineer");
    console.error(`Available: ${availablePersonas().join(", ") || "(none)"}`);
    process.exit(1);
  }
  let total = 0;
  for (const layer of vendorArgs) total += vendorPersona(layer);
  console.log(`\n${total} file(s) vendored. The checker now resolves: ${vendorArgs.join(", ")}.`);
  if (has("--push")) {
    console.log("\nPushing...");
    try {
      execSync("git add .konspekt/spec/personas", { cwd: root, stdio: "inherit" });
      execSync(`git commit -m "vendor konspekt persona layer(s): ${vendorArgs.join(", ")}"`, { cwd: root, stdio: "inherit" });
      execSync("git push", { cwd: root, stdio: "inherit" });
      console.log("Pushed.");
    } catch {
      console.error("git step failed — the files are on disk; commit manually.");
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

// --full installs every available component in the same run, so a single
// command produces the fully adopted repo that setup/README.md pictures:
// instance + envelope + installed tooling (.konspekt/lib/) + harness
// (.claude/, .github/workflows/). Components stay individually installable with
// --add; --full is the batch for adoption and for testing the README tree.
// (It does not auto-vendor persona registries into
// .konspekt/spec/personas/<layer>/; that stays an explicit opt-in via
// --vendor-persona, handled just below.)
const full = has("--full");
if (full) {
  const comps = listComponents();
  console.log(`\nInstalling all components (--full): ${comps.join(", ")}\n`);
  for (const id of comps) installComponent(id, { quiet: true });
}

// --vendor-persona on a scaffold run copies the named layers' registries into
// the umbrella so the checker resolves them. A bare flag vendors whatever
// --persona activated; explicit args override. This is the only path that
// writes .konspekt/spec/personas/<layer>/ — never automatic, always asked for.
if (has("--vendor-persona")) {
  const layers = vendorArgs.length ? vendorArgs : personas;
  if (!layers.length) {
    console.log("\n  ! --vendor-persona given with no layer and no --persona to defer to (skipped)");
  } else {
    console.log("");
    for (const layer of layers) vendorPersona(layer);
  }
}

console.log("\nDone. Next:");
console.log(`  1. Edit ${INSTANCE}/project.md \u2014 set the goal and summary.`);
console.log("  2. Review .konspekt/OPERATING.md \u2014 the operating policy you just adopted.");
if (full) {
  console.log("  3. Commit:  git add . && git commit -m 'adopt konspekt'");
} else {
  console.log("  3. Commit:  git add .konspekt AGENTS.md CLAUDE.md GEMINI.md && git commit -m 'adopt konspekt'");
  const comps = listComponents();
  if (comps.length) {
    console.log(`  4. Optional add-ons: node setup/init.mjs --list  (${comps.join(", ")})`);
    console.log("     or re-run with --full to install them all at once.");
  }
}

if (has("--push")) {
  console.log("\nPushing...");
  try {
    if (full) {
      // --full touched .konspekt, .claude and .github \u2014 stage the lot.
      execSync("git add .", { cwd: root, stdio: "inherit" });
    } else {
      const agentFiles = ["AGENTS.md", "CLAUDE.md", "GEMINI.md",
        ".github/copilot-instructions.md", ".windsurfrules", ".cursor/rules/konspekt.mdc"]
        .filter((f) => existsSync(join(root, f)));
      execSync(`git add .konspekt ${agentFiles.join(" ")}`, { cwd: root, stdio: "inherit" });
    }
    execSync('git commit -m "adopt konspekt project state"', { cwd: root, stdio: "inherit" });
    execSync("git push", { cwd: root, stdio: "inherit" });
    console.log("Pushed.");
  } catch {
    console.error("git step failed \u2014 the scaffold is on disk; commit manually.");
    process.exit(1);
  }
}
