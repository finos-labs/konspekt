#!/usr/bin/env node
// SessionStart hook: start the committer fold watcher in the background
// (task-fleet-adjustments).
//
// Claude Code runs this on SessionStart in the committer's canonical worktree.
// The fold watcher (`run-pass --watch`, committer.mjs watchLoop) only picks up
// outbox changes while its Node process is alive; nothing otherwise starts it,
// so a committer session that forgets to launch it folds nothing. This hook
// makes starting it the session's own first action.
//
// Contract, so the hook is safe to register in any repo:
//   - It NEVER blocks or fails session start: it always exits 0 and routes the
//     watcher's own output to a log file, not to this process.
//   - It is a no-op unless the project dir holds a fleet config
//     (.konspekt/fleet/config/fleet.json) AND that config's outbox worktrees are
//     stood up (loadFromConfig succeeds), so the same registration is harmless in
//     a non-committer repo and in a repo that merely carries a config without a
//     stood-up fleet (the konspekt dogfood repo).
//   - It is idempotent: a live watcher recorded in .konspekt-fleet/watch.pid is
//     left alone, so repeated session starts do not spawn duplicate watchers.
//   - The watcher it spawns is detached and unref'd, so it outlives this hook
//     and the session. It folds proposals as review: proposed and never accepts
//     (bless stays a separate human-gated pass).
//
// The watcher attaches config-driven (`run-pass --canonical <projectDir>`), so it
// reads instanceSubdir from the committed fleet config and needs no
// --instance-subdir flag (nw-fleet-committer-instance-subdir-from-config). The
// fold commit identity is KONSPEKT_COMMITTER_NAME / KONSPEKT_COMMITTER_EMAIL when
// set, else the repo's configured git identity.

import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, openSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFromConfig } from "./worktrees.mjs";

// Pure decision: given whether a fleet config exists, whether the fleet is
// actually attachable (its outbox worktrees are stood up), and whether the
// recorded watcher pid is live, say what the hook should do. Separated so it is
// unit-testable without a filesystem or a spawned process.
//
// `outboxesReady` matters because a repo can carry a fleet config yet not be a
// running committer — the konspekt dogfood repo has a config but no outbox
// worktrees stood up, and a watcher there would just error and exit. Only start
// when the fleet is attachable, so the same hook is a silent no-op in a repo
// that merely has a config.
export function decideWatchAction({ hasConfig, outboxesReady, pidRecorded, pidAlive }) {
  if (!hasConfig) return "skip-no-config";
  if (!outboxesReady) return "skip-not-ready";
  if (pidRecorded && pidAlive) return "already-running";
  return "start";
}

// Is `pid` a live process? process.kill(pid, 0) sends no signal: it throws
// ESRCH when the pid is gone and EPERM when it exists but is not signalable by
// us (still alive). Any other error is treated as not-alive, conservatively.
export function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}

function main() {
  // A SessionStart hook must never throw; wrap everything and exit 0.
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const appDir = dirname(fileURLToPath(import.meta.url));
    const configPath = join(projectDir, ".konspekt", "fleet", "config", "fleet.json");
    const runtimeDir = join(projectDir, ".konspekt-fleet");
    const pidFile = join(runtimeDir, "watch.pid");
    const logFile = join(runtimeDir, "watch.log");

    const hasConfig = existsSync(configPath);
    // A fleet config alone does not make this a running committer: the konspekt
    // dogfood repo carries a config but stands up no outbox worktrees, and a
    // watcher there errors on its first tick. loadFromConfig succeeds only when
    // every configured outbox worktree is stood up, so use it as the readiness
    // gate. It is read-only (reads the config, lists git worktrees).
    let outboxesReady = false;
    if (hasConfig) {
      try {
        const { fleet } = loadFromConfig({ canonicalPath: projectDir });
        outboxesReady = fleet.proposers.length > 0;
      } catch {
        outboxesReady = false;
      }
    }
    let recorded = null;
    if (existsSync(pidFile)) {
      const n = parseInt(readFileSync(pidFile, "utf8").trim(), 10);
      recorded = Number.isInteger(n) ? n : null;
    }
    const alive = recorded != null && pidAlive(recorded);
    const action = decideWatchAction({
      hasConfig,
      outboxesReady,
      pidRecorded: recorded != null,
      pidAlive: alive,
    });

    if (action === "skip-no-config") return; // not a committer repo: silent no-op
    if (action === "skip-not-ready") return; // config present but outboxes not stood up: silent no-op
    if (action === "already-running") {
      console.log(`fleet committer watch already running (pid ${recorded})`);
      return;
    }

    mkdirSync(runtimeDir, { recursive: true });
    const cli = join(appDir, "cli.mjs");
    const args = [cli, "run-pass", "--canonical", projectDir, "--watch", "--interval", "5"];
    if (process.env.KONSPEKT_COMMITTER_NAME) args.push("--name", process.env.KONSPEKT_COMMITTER_NAME);
    if (process.env.KONSPEKT_COMMITTER_EMAIL) args.push("--email", process.env.KONSPEKT_COMMITTER_EMAIL);

    const out = openSync(logFile, "a");
    const child = spawn(process.execPath, args, {
      cwd: projectDir,
      detached: true,
      stdio: ["ignore", out, out],
    });
    child.unref();
    writeFileSync(pidFile, String(child.pid) + "\n", "utf8");
    console.log(
      `fleet committer watch started (pid ${child.pid}); folding proposals as ` +
        `review: proposed every 5s. Log: .konspekt-fleet/watch.log`,
    );
  } catch (e) {
    // Degrade to a no-op: report and exit 0 so session start is never blocked.
    console.log(`fleet committer watch hook skipped: ${e.message}`);
  }
}

main();
