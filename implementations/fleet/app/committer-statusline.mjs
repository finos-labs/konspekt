#!/usr/bin/env node
// Claude Code status line for a committer repo: show the bless-queue depth — the
// number of proposals folded onto canonical as review: proposed and not yet
// blessed or rejected (task-fleet-adjustments).
//
// The fold watcher (committer-watch-hook.mjs) folds proposals in the background
// with no console. This status line is the signal the human committer reads in
// their own terminal: how many folded atoms are waiting for a bless/reject
// decision. The count equals buildIndex(...).counts.pending, which is the same
// number `cli.mjs review` prints as "Fleet review queue: N pending".
//
// Contract, so the same registration is safe in any repo:
//   - It reads one status-line JSON object on stdin (the Claude Code status-line
//     contract). workspace.project_dir is the directory Claude Code was launched
//     in — the committer's canonical worktree.
//   - It prints nothing and exits 0 unless the launch directory carries a fleet
//     config (.konspekt/fleet/config/fleet.json). Empty output leaves the status
//     line blank, so a non-committer repo keeps its default status line; this is
//     registered only in a committer repo.
//   - It never throws: any error prints nothing and exits 0, so the status line
//     is never broken by a parse or read failure.
//   - It makes no git subprocess: buildIndex(..., { withCommits: false }) reads
//     the fold log and the instance files only, so it is fast enough to run on
//     every status-line refresh.

import { existsSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_INSTANCE_SUBDIR } from "./preflight.mjs";
import { buildIndex } from "./proposed-ref.mjs";

// The launch directory from the status-line JSON. workspace.project_dir is the
// directory Claude Code was launched in (the committer's canonical worktree);
// fall back to workspace.current_dir, then the top-level cwd, then this
// process's cwd. Pure, so it is unit-testable without stdin.
export function projectDirFrom(input) {
  const ws = (input && input.workspace) || {};
  return ws.project_dir || ws.current_dir || (input && input.cwd) || process.cwd();
}

// The standard readout fields a command status line replaces when it is
// registered: the model name, the current directory's base name, and the
// context-window used percentage (null before the first API response). Pure, so
// it is unit-testable without stdin.
export function displayFieldsFrom(input) {
  const i = input || {};
  const model = i.model || {};
  const ws = i.workspace || {};
  const curDir = ws.current_dir || i.cwd || "";
  const cw = i.context_window || {};
  return {
    modelName: model.display_name || model.id || "",
    // basename after stripping a trailing slash, so "C:/x/cdm-collateral/" -> "cdm-collateral".
    dirLabel: curDir ? basename(String(curDir).replace(/[\\/]+$/, "")) : "",
    contextPct: typeof cw.used_percentage === "number" ? cw.used_percentage : null,
  };
}

// Render the status line. Segments are joined by a dim middle dot; empty
// segments are dropped. ANSI color is supported by the status line: the model
// name is cyan, the directory and context are dim, and the bless-queue segment
// is yellow with a filled marker when atoms are waiting or dim with a hollow
// marker when the queue is empty. Pure, so it is unit-testable.
export function renderStatus({ pending, modelName, dirLabel, contextPct } = {}) {
  const dim = (s) => `\u001b[2m${s}\u001b[0m`;
  const seg = [];
  if (modelName) seg.push(`\u001b[36m${modelName}\u001b[0m`);
  if (dirLabel) seg.push(dim(dirLabel));
  if (Number.isFinite(contextPct)) seg.push(dim(`ctx ${Math.round(contextPct)}%`));
  const n = Number.isInteger(pending) && pending > 0 ? pending : 0;
  if (n > 0) seg.push(`\u001b[33m\u25cf ${n} awaiting bless\u001b[0m`);
  else seg.push(dim("\u25cb bless queue empty"));
  return seg.join(dim(" \u00b7 "));
}

// Read the fleet config's instanceSubdir, defaulting to DEFAULT_INSTANCE_SUBDIR
// (the same default the CLI and worktrees.mjs apply). Pure read of one file.
function instanceSubdirFromConfig(configPath) {
  try {
    const cfg = JSON.parse(readFileSync(configPath, "utf8"));
    if (typeof cfg.instanceSubdir === "string" && cfg.instanceSubdir) return cfg.instanceSubdir;
  } catch {
    // fall through to the default
  }
  return DEFAULT_INSTANCE_SUBDIR;
}

function main() {
  // The status line must never fail: on any error print nothing and exit 0,
  // which leaves the status line blank rather than broken.
  try {
    let input = {};
    try {
      // fd 0 is the piped status-line JSON. Claude Code closes stdin after
      // writing it, so this read returns at EOF.
      const raw = readFileSync(0, "utf8");
      if (raw.trim()) input = JSON.parse(raw);
    } catch {
      input = {};
    }

    const projectDir = projectDirFrom(input);
    const configPath = join(projectDir, ".konspekt", "fleet", "config", "fleet.json");
    if (!existsSync(configPath)) return; // not a committer repo: blank status line

    const instanceSubdir = instanceSubdirFromConfig(configPath);
    const { counts } = buildIndex(projectDir, { instanceSubdir, withCommits: false });
    const { modelName, dirLabel, contextPct } = displayFieldsFrom(input);
    process.stdout.write(renderStatus({ pending: counts.pending ?? 0, modelName, dirLabel, contextPct }));
  } catch {
    // Degrade to a blank status line.
  }
}

// Run main() only when invoked as the entry point (`node committer-statusline.mjs`).
// Importing the module (the unit test) must not read stdin or write stdout
// (esm-entrypoint-guard): the pure functions above are what the test exercises.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
