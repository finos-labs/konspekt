// konspekt implementation_zero — Electron always-on-top shell
//
// The shell over the zero-dependency core (server.mjs, see ../docs/DESIGN.md).
// It spawns the core server as a child, waits for it to listen, and loads the
// localhost view in a small always-on-top window. The core does not depend on
// this file — `node server.mjs` plus a browser is the same view without Electron.
//
// Run: npm install && npm run shell

import { app, BrowserWindow } from "electron";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.KONSPEKT_PORT || 4319);
const URL = `http://127.0.0.1:${PORT}`;

let server;

function startServer() {
  // process.execPath is the Electron binary; ELECTRON_RUN_AS_NODE runs it as node.
  server = spawn(process.execPath, [join(__dirname, "server.mjs")], {
    stdio: "inherit",
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", KONSPEKT_PORT: String(PORT) },
  });
  server.on("exit", (code) => { if (code) console.error(`server exited: ${code}`); });
}

// Kill the spawned server once, whatever the quit path. Guarded so the
// before-quit and window-all-closed paths do not double-kill.
function stopServer() { if (server) { server.kill(); server = null; } }

async function waitForServer(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(URL, { method: "HEAD" }); if (r.ok || r.status === 404) return true; }
    catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 480, height: 760, minWidth: 360, minHeight: 420,
    alwaysOnTop: true, title: "konspekt",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  await waitForServer();
  win.loadURL(URL);
}

app.whenReady().then(() => {
  startServer();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

// before-quit covers every quit path — File > Exit, the menu Quit role, Cmd+Q,
// and the app.quit() below — so the server never outlives the window.
app.on("before-quit", stopServer);
app.on("window-all-closed", () => { stopServer(); app.quit(); });
