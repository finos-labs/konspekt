#!/usr/bin/env node
// konspekt validate — run the conformance checker over an instance.
//
//   node lib/validate.mjs [instanceDir] [--json] [--slug-ok] [--no-sources]
//                         [--quiet] [--strict] [--no-check-locators]
//
//   instanceDir    defaults to .konspekt/instance under the current directory
//   --json         emit the full problem list as JSON instead of a report
//   --slug-ok      accept pre-2026-07-19 bare-slug filenames
//   --no-sources   skip provenance verification against sources/
//   --quiet        counts only, no per-problem lines
//   --strict       exit non-zero on warnings too, not only errors
//   --no-check-locators
//                  skip the network check. By default each provenance
//                  locator whose host is in project.md locators.allow is
//                  requested, and one that does not answer with a status
//                  below 400 is reported as a locator-unreachable warning
//                  (SERIALIZATION.md § Sources; ./locator-reach.mjs). An
//                  instance with no allowed locators makes no requests.
//
// Exit codes: 0 clean, 1 errors present (or warnings under --strict), 2 bad usage.
//
// This is a thin front end. Every rule lives in ./conformance.mjs, which the
// visualizer's snapshot build imports as well — one parser, one rule set, no
// second copy to drift (nw-derive-not-copy). Persona layers an instance
// activates (project.personas) are resolved by ./load-personas.mjs and handed
// to the checker; the checker itself stays pure and layout-agnostic.

import { existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadInstance, summarize } from "./conformance.mjs";
import { loadActivePersonas } from "./load-personas.mjs";
import { checkLocatorReach } from "./locator-reach.mjs";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const positional = args.filter((a) => !a.startsWith("--"));

if (has("--help") || has("-h")) {
  console.log(
    [
      "konspekt validate",
      "",
      "  node lib/validate.mjs [instanceDir] [--json] [--slug-ok] [--no-sources]",
      "                        [--quiet] [--strict] [--no-check-locators]",
      "",
      "  Checks a konspekt instance against spec/data-model/schema.ts and",
      "  spec/architecture/SERIALIZATION.md. Exit 0 clean, 1 on errors",
      "  (or warnings under --strict). Each allowed provenance locator is",
      "  requested and warned about when unreachable; --no-check-locators",
      "  skips that network check.",
    ].join("\n")
  );
  process.exit(0);
}

const instanceDir = resolve(positional[0] || join(process.cwd(), ".konspekt", "instance"));

if (!existsSync(instanceDir)) {
  console.error(`No instance at ${instanceDir}`);
  console.error("Pass one explicitly:  node lib/validate.mjs path/to/instance");
  process.exit(2);
}

// Persona registries ship with the checker under spec/personas/, resolved
// relative to this file (…/lib → …/spec/personas). A layer the instance names
// but whose registry is missing is warned and skipped, degrading to core.
const specPersonasDir = join(dirname(fileURLToPath(import.meta.url)), "..", "spec", "personas");
const personas = await loadActivePersonas(instanceDir, specPersonasDir, {
  warn: (m) => console.error(`warning: ${m}`),
});

const result = loadInstance(instanceDir, {
  filenameRule: has("--slug-ok") ? "slug-ok" : "strict",
  checkSources: !has("--no-sources"),
  personas,
});

// Network check, on unless --no-check-locators. Its warnings join the
// checker's problem list so the report, the JSON output and the --strict exit
// code treat them alike.
let locatorsChecked = null;
if (!has("--no-check-locators")) {
  const reach = await checkLocatorReach(result);
  locatorsChecked = reach.checked;
  result.problems.push(...reach.problems);
}

if (has("--json")) {
  console.log(JSON.stringify({ meta: result.meta, problems: result.problems }, null, 2));
} else {
  const c = result.meta.counts;
  console.log(`instance: ${instanceDir}`);
  if (result.meta.personas.length) {
    console.log(`  personas: ${result.meta.personas.join(", ")}`);
  }
  console.log(
    `  entities: ${c.nodes} node(s), ${c.concepts} concept(s), ${c.noteworthy} noteworthy, ` +
    `${c.artifacts} artifact(s), ${c.waypoints} waypoint(s)`
  );
  console.log(`  edges: ${c.edges}`);
  if (c.transitions) console.log(`  transitions: ${c.transitions}`);
  if (locatorsChecked !== null) console.log(`  locators requested: ${locatorsChecked}`);

  const counts = summarize(result.problems);
  console.log(
    `  problems: ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info`
  );

  if (!has("--quiet")) {
    // Grouped by code so a systemic divergence reads as one finding rather than
    // fifty. Attribution is the point: this report is per instance.
    const byCode = new Map();
    for (const p of result.problems) {
      if (!byCode.has(p.code)) byCode.set(p.code, []);
      byCode.get(p.code).push(p);
    }
    for (const [code, list] of byCode) {
      console.log(`\n  [${list[0].severity}] ${code} — ${list.length}`);
      for (const p of list) console.log(`    ${p.message}`);
    }
  }
}

const counts = summarize(result.problems);
const failed = counts.error > 0 || (has("--strict") && counts.warning > 0);
process.exit(failed ? 1 : 0);
