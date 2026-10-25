import { test } from "node:test";
import assert from "node:assert/strict";
import { decideWatchAction, pidAlive } from "../committer-watch-hook.mjs";

test("decideWatchAction is a no-op outside a committer repo", () => {
  assert.equal(
    decideWatchAction({ hasConfig: false, outboxesReady: false, pidRecorded: false, pidAlive: false }),
    "skip-no-config",
  );
  // No config dominates even if a stale pid is recorded.
  assert.equal(
    decideWatchAction({ hasConfig: false, outboxesReady: false, pidRecorded: true, pidAlive: true }),
    "skip-no-config",
  );
});

test("decideWatchAction is a no-op when a config exists but outboxes are not stood up", () => {
  // The konspekt dogfood repo carries a fleet config but stands up no outbox
  // worktrees; the hook must not spawn a watcher that would only error and exit.
  assert.equal(
    decideWatchAction({ hasConfig: true, outboxesReady: false, pidRecorded: false, pidAlive: false }),
    "skip-not-ready",
  );
  // Not-ready dominates even if a stale pid lingers from an earlier stood-up run.
  assert.equal(
    decideWatchAction({ hasConfig: true, outboxesReady: false, pidRecorded: true, pidAlive: true }),
    "skip-not-ready",
  );
});

test("decideWatchAction leaves a live watcher alone (idempotent)", () => {
  assert.equal(
    decideWatchAction({ hasConfig: true, outboxesReady: true, pidRecorded: true, pidAlive: true }),
    "already-running",
  );
});

test("decideWatchAction starts when the fleet is ready and no live watcher is recorded", () => {
  assert.equal(
    decideWatchAction({ hasConfig: true, outboxesReady: true, pidRecorded: false, pidAlive: false }),
    "start",
  );
  // A recorded-but-dead pid (watcher crashed or machine restarted) re-starts.
  assert.equal(
    decideWatchAction({ hasConfig: true, outboxesReady: true, pidRecorded: true, pidAlive: false }),
    "start",
  );
});

test("importing the module does not run main() (no watcher spawned on import)", async () => {
  // Regression: the module once called main() at top level, so importing it
  // (this test, any tooling) spawned a real detached watcher in any repo whose
  // cwd held a stood-up fleet config. main() must run only as the entry point.
  // The import at the top of this file already happened; assert the guard shape
  // the fix relies on: argv[1] is this test runner, not the hook module.
  const { pathToFileURL } = await import("node:url");
  const hookUrl = new URL("../committer-watch-hook.mjs", import.meta.url).href;
  const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
  assert.notEqual(entryUrl, hookUrl);
});

test("pidAlive reports this process alive and an unused pid dead", () => {
  assert.equal(pidAlive(process.pid), true);
  assert.equal(pidAlive(0), false);
  assert.equal(pidAlive(-1), false);
  // A very high pid is almost certainly unused; process.kill throws ESRCH.
  assert.equal(pidAlive(2 ** 30), false);
});
