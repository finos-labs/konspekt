#!/usr/bin/env node
// Smoke test for setup/init.mjs — the adopter scaffolder (task-adoption-path).
//
// Scope: scaffold a fresh instance into a throwaway directory and check that
// every expected file lands in the right place, then check that a second
// scaffold into the same directory refuses. A second block covers
// --vendor-persona: that it makes the installed checker resolve a persona layer
// (instead of degrading to core-only) and that --check reports drift against the
// standard when a vendored file is edited.
//
// Run:  node test/setup-init.test.mjs   (exit 0 = pass, 1 = fail)

import { mkdtempSync, existsSync, rmSync, appendFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const INIT = join(HERE, "..", "setup", "init.mjs");
const { loadInstance } = await import(pathToFileURL(join(HERE, "..", "lib", "conformance.mjs")));

// Every path a default (no-arg) scaffold must create, relative to the repo root
// it runs in. Mirrors the put()/appendStanza() calls in setup/init.mjs.
const EXPECTED = [
  ".konspekt/instance/project.md",
  ".konspekt/instance/edges/edges.md",
  ".konspekt/instance/transitions/transitions.md",
  ".konspekt/instance/sources/README.md",
  ".konspekt/instance/nodes/.gitkeep",
  ".konspekt/instance/concepts/.gitkeep",
  ".konspekt/instance/noteworthy/.gitkeep",
  ".konspekt/instance/artifacts/.gitkeep",
  ".konspekt/instance/waypoints/.gitkeep",
  ".konspekt/OPERATING.md",
  ".konspekt/NOTES.md",
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
];

const failures = [];
const tmp = mkdtempSync(join(tmpdir(), "konspekt-setup-"));
const tmp2 = mkdtempSync(join(tmpdir(), "konspekt-persona-"));

try {
  // First scaffold must succeed (exit 0).
  try {
    execFileSync("node", [INIT, "--name", "Test Project", "--goal", "a test goal"],
      { cwd: tmp, stdio: "pipe" });
  } catch (e) {
    failures.push(`scaffold exited non-zero: ${e.status}\n${e.stderr || e.stdout || ""}`);
  }

  // Every expected file is present in the right place.
  for (const rel of EXPECTED) {
    if (!existsSync(join(tmp, rel))) failures.push(`missing: ${rel}`);
  }

  // The scaffolded instance ships an empty transition log and is conformant: the
  // file exists (so it is not "no-transition-log"), it holds no rows, and a fresh
  // instance with no atoms raises no transition errors (task-transition-log-writers).
  try {
    const r = loadInstance(join(tmp, ".konspekt", "instance"), {});
    const errs = r.problems.filter((p) => p.severity === "error" && p.code.includes("transition"));
    if (errs.length) failures.push(`scaffolded log is not conformant: ${errs.map((p) => p.code).join(", ")}`);
    if (r.meta.counts.transitions !== 0) failures.push(`scaffolded log should start empty, has ${r.meta.counts.transitions} rows`);
  } catch (e) {
    failures.push(`could not load scaffolded instance: ${e.message}`);
  }

  // The seed carries the policy fields the shipped Claude Code hooks read, and
  // OPERATING.md carries the section those hooks cite by name. Without them the
  // hooks point at a section that does not exist and the basis check is inert.
  const projectMd = readFileSync(join(tmp, ".konspekt", "instance", "project.md"), "utf8");
  if (!/^binding: required$/m.test(projectMd)) failures.push("project.md seed lacks `binding: required`");
  if (!/^basis: proposed$/m.test(projectMd)) failures.push("project.md seed lacks `basis: proposed`");
  const operatingMd = readFileSync(join(tmp, ".konspekt", "OPERATING.md"), "utf8");
  if (!operatingMd.includes("## Conversation binding")) failures.push("OPERATING.md seed lacks § Conversation binding");
  // No persona layer, no persona logs.
  if (existsSync(join(tmp, ".konspekt", "instance", "changes"))) failures.push("changes/ seeded without a persona layer");

  // A second scaffold into the same directory must refuse (non-zero exit),
  // rather than clobber the instance that is already there.
  let refused = false;
  try {
    execFileSync("node", [INIT], { cwd: tmp, stdio: "pipe" });
  } catch {
    refused = true;
  }
  if (!refused) failures.push("second scaffold did not refuse an existing instance");

  // --vendor-persona: the installed checker must resolve the layer only once its
  // registry is vendored. Run the adopter's OWN checker (.konspekt/lib/), whose
  // spec root is .konspekt/spec/personas/ — the source checker always resolves
  // against konspekt's spec, so it cannot witness vendoring.
  const checkerJson = (dir) => {
    const out = execFileSync("node", [join(dir, ".konspekt", "lib", "validate.mjs"), "--json"],
      { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return JSON.parse(out);
  };
  try {
    execFileSync("node", [INIT, "--name", "Persona", "--goal", "g", "--persona", "engineer"],
      { cwd: tmp2, stdio: "pipe" });
    execFileSync("node", [INIT, "--add", "conformance", "--force"], { cwd: tmp2, stdio: "pipe" });

    // The engineer brief tells the agent to append to these logs; they are
    // seeded empty so the first append finds the file.
    for (const f of ["changes/changed.md", "commands/executed.md"]) {
      if (!existsSync(join(tmp2, ".konspekt", "instance", f))) failures.push(`engineer scaffold did not seed ${f}`);
    }

    // Before vendoring: engineer is activated but unresolved — core-only.
    const before = checkerJson(tmp2);
    if (before.meta.personas.includes("engineer")) {
      failures.push("engineer resolved before its registry was vendored");
    }
    if (!before.problems.some((p) => p.code === "persona-not-loaded")) {
      failures.push("expected persona-not-loaded info before vendoring");
    }

    // Vendor it; the three layer files must land.
    execFileSync("node", [INIT, "--vendor-persona", "engineer"], { cwd: tmp2, stdio: "pipe" });
    for (const f of ["registry.mjs", "SPEC.md", "AGENTS.md"]) {
      if (!existsSync(join(tmp2, ".konspekt", "spec", "personas", "engineer", f))) {
        failures.push(`vendor-persona did not write engineer/${f}`);
      }
    }

    // After vendoring: the checker resolves the layer, no persona-not-loaded,
    // and the seeded empty logs raise no errors.
    const after = checkerJson(tmp2);
    const afterErrs = after.problems.filter((p) => p.severity === "error");
    if (afterErrs.length) failures.push(`engineer scaffold not conformant: ${afterErrs.map((p) => p.code).join(", ")}`);
    if (!after.meta.personas.includes("engineer")) {
      failures.push("engineer not resolved after vendoring its registry");
    }
    if (after.problems.some((p) => p.code === "persona-not-loaded")) {
      failures.push("persona-not-loaded still present after vendoring");
    }

    // Editing a vendored file is drift against the standard: --check must fail.
    appendFileSync(join(tmp2, ".konspekt", "spec", "personas", "engineer", "registry.mjs"),
      "\n// local edit\n");
    let drifted = false;
    try {
      execFileSync("node", [INIT, "--check"], { cwd: tmp2, stdio: "pipe" });
    } catch {
      drifted = true;
    }
    if (!drifted) failures.push("--check did not report drift on an edited vendored persona file");
  } catch (e) {
    failures.push(`vendor-persona block threw: ${e.message}\n${e.stderr || e.stdout || ""}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
  rmSync(tmp2, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL setup/init.mjs smoke test (${failures.length}):`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`ok setup/init.mjs — scaffolds ${EXPECTED.length} files in place, refuses to clobber, and vendors persona layers`);
