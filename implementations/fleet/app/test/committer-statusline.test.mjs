import { test } from "node:test";
import assert from "node:assert/strict";
import { projectDirFrom, displayFieldsFrom, renderStatus } from "../committer-statusline.mjs";

test("projectDirFrom prefers workspace.project_dir (the launch directory)", () => {
  const input = {
    cwd: "/now/here",
    workspace: { project_dir: "/launched/here", current_dir: "/now/here" },
  };
  assert.equal(projectDirFrom(input), "/launched/here");
});

test("projectDirFrom falls back current_dir -> cwd -> process.cwd()", () => {
  assert.equal(projectDirFrom({ workspace: { current_dir: "/cur" } }), "/cur");
  assert.equal(projectDirFrom({ cwd: "/just-cwd" }), "/just-cwd");
  // No directory field anywhere: fall back to this process's cwd.
  assert.equal(projectDirFrom({}), process.cwd());
  assert.equal(projectDirFrom(null), process.cwd());
});

test("displayFieldsFrom extracts model name, directory base name, and context percent", () => {
  const f = displayFieldsFrom({
    model: { display_name: "Opus 4.8", id: "claude-opus-4-8" },
    workspace: { current_dir: "C:/Users/denis/IdeaProjects/cdm-collateral/" },
    context_window: { used_percentage: 42.6 },
  });
  assert.equal(f.modelName, "Opus 4.8");
  assert.equal(f.dirLabel, "cdm-collateral");
  assert.equal(f.contextPct, 42.6);
});

test("displayFieldsFrom falls back and reports a null context percent before the first response", () => {
  const f = displayFieldsFrom({ model: { id: "claude-opus-4-8" }, cwd: "/home/x/repo" });
  assert.equal(f.modelName, "claude-opus-4-8"); // no display_name: fall back to id
  assert.equal(f.dirLabel, "repo");
  assert.equal(f.contextPct, null); // no context_window yet
  assert.deepEqual(displayFieldsFrom({}), { modelName: "", dirLabel: "", contextPct: null });
});

test("renderStatus shows the count and the word bless when atoms are waiting", () => {
  const s = renderStatus({ pending: 3, modelName: "Opus 4.8", dirLabel: "cdm-collateral", contextPct: 10 });
  assert.match(s, /3/);
  assert.match(s, /awaiting bless/);
  assert.match(s, /Opus 4\.8/); // standard readout retained alongside the queue
  assert.match(s, /cdm-collateral/);
  assert.match(s, /ctx 10%/);
});

test("renderStatus reports an empty queue for zero and non-positive or non-integer input", () => {
  for (const v of [0, -1, 1.5, "x", null, undefined, NaN]) {
    assert.match(renderStatus({ pending: v }), /empty/, `expected empty-queue text for ${String(v)}`);
  }
  // Rounds the context percent and drops segments that are empty or non-finite.
  assert.match(renderStatus({ pending: 0, contextPct: 42.6 }), /ctx 43%/);
  assert.doesNotMatch(renderStatus({ pending: 0, contextPct: null }), /ctx/);
});

test("importing the module does not read stdin or write stdout (main() runs only as entry point)", async () => {
  // Regression guard (esm-entrypoint-guard): a top-level main() call would make
  // importing this module block on readFileSync(0) and emit to stdout. The import
  // at the top of this file already completed without doing either; assert the
  // guard shape the fix relies on — argv[1] is this test runner, not the module.
  const { pathToFileURL } = await import("node:url");
  const moduleUrl = new URL("../committer-statusline.mjs", import.meta.url).href;
  const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
  assert.notEqual(entryUrl, moduleUrl);
});
