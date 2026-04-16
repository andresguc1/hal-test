#!/usr/bin/env node

/**
 * HalTest CLI Launcher — bin/haltest.js
 *
 * Starts the HalTest backend server, runs pre-requisite checks,
 * auto-opens the browser, and handles graceful shutdown.
 */

import { spawn } from "child_process";
import net from "net";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ── Resolve paths ──────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let _serverRef = null;

/**
 * Resolve the backend entry-point, supporting multiple run contexts:
 *  1. Bundled inside the CLI package (future: backend/app.js sibling to bin/)
 *  2. Monorepo dev mode:  bin/ → apps/cli/ → apps/ → monorepo root
 *  3. CWD-relative: user ran npx haltest from a directory that contains apps/backend
 */
function resolveBackendEntry() {
  const candidates = [
    // 1. Future: bundled backend shipped with the NPM package
    path.resolve(__dirname, "..", "backend", "app.js"),
    // 2. Monorepo dev mode
    path.resolve(__dirname, "..", "..", "..", "apps", "backend", "app.js"),
    // 3. CWD-relative
    path.resolve(process.cwd(), "apps", "backend", "app.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const BACKEND_ENTRY = resolveBackendEntry();
const PORT = parseInt(process.env.PORT || "2001", 10);
const APP_URL = `http://localhost:${PORT}/app/`;
const OLLAMA_PORT = 11434;

// ── ANSI helpers ───────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[97m",
};
const style = (color, text) => `${color}${text}${c.reset}`;

// ── Banner ─────────────────────────────────────────────────────────────────
function printBanner() {
  console.log("");
  console.log(
    style(
      c.cyan + c.bold,
      "  ██╗  ██╗ █████╗ ██╗  ████████╗███████╗███████╗████████╗",
    ),
  );
  console.log(
    style(
      c.cyan + c.bold,
      "  ██║  ██║██╔══██╗██║  ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝",
    ),
  );
  console.log(
    style(
      c.cyan + c.bold,
      "  ███████║███████║██║     ██║   █████╗  ███████╗   ██║   ",
    ),
  );
  console.log(
    style(
      c.cyan + c.bold,
      "  ██╔══██║██╔══██║██║     ██║   ██╔══╝  ╚════██║   ██║   ",
    ),
  );
  console.log(
    style(
      c.cyan + c.bold,
      "  ██║  ██║██║  ██║███████╗██║   ███████╗███████║   ██║   ",
    ),
  );
  console.log(
    style(
      c.cyan + c.bold,
      "  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝   ╚══════╝╚══════╝   ╚═╝   ",
    ),
  );
  console.log("");
  console.log(
    style(c.white + c.bold, "  Browser Automation & Orchestration Platform"),
  );
  console.log(
    style(
      c.dim + c.white,
      "  ─────────────────────────────────────────────────────────",
    ),
  );
  console.log("");
}

// ── Port check helper ──────────────────────────────────────────────────────
function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// ── Pre-requisite checks ───────────────────────────────────────────────────
async function runPreRequisiteChecks() {
  console.log(style(c.bold, "  🔍 Running pre-requisite checks...\n"));

  // Check Ollama — NON-BLOCKING: app works fine without it
  const ollamaOk = await isPortListening(OLLAMA_PORT);
  if (ollamaOk) {
    console.log(
      style(
        c.green,
        `  ✅ Ollama      — detected on port ${OLLAMA_PORT}. Local AI is active.`,
      ),
    );
  } else {
    console.log(
      style(
        c.yellow,
        `  ⚠️  Ollama      — not detected on port ${OLLAMA_PORT}.`,
      ) + style(c.dim, " Local AI features disabled."),
    );
  }

  // Check Playwright — NON-BLOCKING
  try {
    const { chromium } = await import("playwright");
    chromium.executablePath();
    console.log(style(c.green, "  ✅ Playwright  — Chromium browser found."));
  } catch {
    console.log(
      style(c.red + c.bold, "  ❌ Playwright  — Chromium browser is missing!"),
    );
    console.log(
      style(c.white, "     Automation flows require Chromium. Please run:") +
        style(c.cyan + c.bold, "\n     npx playwright install chromium\n"),
    );
  }

  console.log("");
}

// ── Open browser (dynamic import for ESM compatibility) ────────────────────
async function openBrowser(url) {
  try {
    const { default: open } = await import("open");
    await open(url);
  } catch {
    console.log(
      style(c.dim, `  ℹ️  Could not auto-open browser. Navigate to: ${url}`),
    );
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const cliPkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);

// Handle --version / -v
if (args.includes("--version") || args.includes("-v") || args.includes("-V")) {
  console.log(`haltest v${cliPkg.version}`);
  process.exit(0);
}

// Handle --help / -h
if (args.includes("--help") || args.includes("-h")) {
  printBanner();
  console.log(style(c.bold, "  Usage: npx haltest [options] [command]"));
  console.log("");
  console.log(
    style(
      c.white,
      "  By default (no arguments), this launcher starts the HAL-TEST backend server,",
    ),
  );
  console.log(
    style(
      c.white,
      "  runs pre-requisite checks, and opens the visual studio in your browser.",
    ),
  );
  console.log("");
  console.log(style(c.bold, "  Options:"));
  console.log(
    style(c.cyan, "    -V, --version           ") + "Output the version number",
  );
  console.log(
    style(c.cyan, "    -h, --help              ") + "Display help for command",
  );
  console.log("");
  console.log(style(c.bold, "  Advanced Commands (CLI Client):"));
  console.log(
    style(
      c.white,
      '    If you want to run headless flows or check CI status, use the "cli" subcommand:',
    ),
  );
  console.log(
    style(c.cyan, "    npx haltest cli status                  ") +
      "Check the status of the local server",
  );
  console.log(
    style(c.cyan, "    npx haltest cli list                    ") +
      "List all available flows",
  );
  console.log(
    style(c.cyan, "    npx haltest cli run [options] <flowId>  ") +
      "Execute a flow and stream real-time logs",
  );
  console.log("");
  process.exit(0);
}

// If they passed 'cli', that means they want the advanced client.
// Give them a helpful error because they should have run the CLI client directly
// (though in the standalone bundle, the cli client is located at src/index.js relative to bin/)
if (args[0] === "cli") {
  const cliClientPath = path.resolve(__dirname, "..", "src", "index.js");
  if (fs.existsSync(cliClientPath)) {
    // Forward to the actual CLI client
    spawn("node", [cliClientPath, ...args.slice(1)], { stdio: "inherit" }).on(
      "exit",
      (code) => process.exit(code ?? 0),
    );
    await new Promise(() => {}); // Wait indefinitely
  } else {
    console.error(
      style(c.red, "  ❌ CLI client not found at " + cliClientPath),
    );
    process.exit(1);
  }
}

printBanner();

// 🚀 Port detection with small retry to avoid race during turbo startup
let isAlreadyRunning = await isPortListening(PORT);
if (!isAlreadyRunning) {
  // Give the backend a small headstart if turbo launched them simultaneously
  await new Promise((r) => setTimeout(r, 800));
  isAlreadyRunning = await isPortListening(PORT);
}

if (isAlreadyRunning) {
  console.log(
    style(
      c.green,
      `  ✅ HalTest Backend — discovered on port ${PORT}. Connecting to existing instance...`,
    ),
  );
  console.log("");
  openBrowser(APP_URL).catch(() => {});
} else {
  // Guard: backend not found → print clear instructions and exit
  if (!BACKEND_ENTRY) {
    console.error(style(c.red + c.bold, "  ❌ HalTest backend not found.\n"));
    console.error(
      style(
        c.white,
        "  This launcher must be run from the HalTest monorepo root.",
      ),
    );
    console.error(
      style(
        c.white,
        "  Standalone bundle support is coming in a future release.\n",
      ),
    );
    console.error(style(c.dim, "  Quick fix:"));
    console.error(
      style(c.dim, "    git clone https://github.com/andresguc1/hal-test"),
    );
    console.error(style(c.dim, "    cd hal-test"));
    console.error(style(c.dim, "    pnpm install"));
    console.error(style(c.dim, "    pnpm cli\n"));
    process.exit(1);
  }

  // Derive CWD: The backend should run from where app.js is located or its parent.
  // In the standalone bundle: dist/backend/app.js -> CWD should be dist/backend
  // In monorepo: apps/backend/app.js -> CWD should be apps/backend
  const backendCwd = path.dirname(BACKEND_ENTRY);

  console.log(style(c.bold, `  🚀 Starting HalTest Server...`));
  console.log(style(c.dim, `     Entry: ${BACKEND_ENTRY}`));
  console.log("");

  // Spawn the backend server
  const serverProc = spawn("node", [BACKEND_ENTRY], {
    cwd: backendCwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "production",
      HALTEST_MODE: "local",
    },
  });

  let browserOpened = false;

  // Forward stdout — detect ready signal
  serverProc.stdout.on("data", (data) => {
    const text = data.toString();
    process.stdout.write(text);

    // Detect the backend "ready" line
    if (!browserOpened && text.includes("HaltTest Server is Up")) {
      browserOpened = true;
      console.log("");
      console.log(
        style(
          c.green + c.bold,
          `  ✅ Server is up! Opening browser at ${APP_URL}`,
        ),
      );
      console.log(style(c.dim, "     Press Ctrl+C to stop the server.\n"));
      openBrowser(APP_URL).catch(() => {});
    }
  });

  // Forward stderr
  serverProc.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  // Handle unexpected server exit
  serverProc.on("exit", async (code, signal) => {
    if (signal) return; // Killed by us during shutdown — silent
    if (code !== 0) {
      // Small check: was it an EADDRINUSE that happened after our check?
      const checkAgain = await isPortListening(PORT);
      if (checkAgain) {
        console.log(
          style(
            c.dim,
            `\n  ℹ️  Backend already active (handled port conflict).`,
          ),
        );
        if (!browserOpened) {
          browserOpened = true;
          openBrowser(APP_URL).catch(() => {});
        }
        return;
      }
      console.error(style(c.red, `\n  ❌ Server exited with code ${code}.`));
      process.exit(code ?? 1);
    }
  });

  serverProc.on("error", (err) => {
    console.error(
      style(c.red, `\n  ❌ Failed to start server: ${err.message}`),
    );
    process.exit(1);
  });

  // Attach to global shutdown
  _serverRef = serverProc;
}

// ── Graceful Shutdown ──────────────────────────────────────────────────────
function shutdown(signal) {
  console.log("");
  console.log(
    style(
      c.magenta + c.bold,
      `\n  👋 Received ${signal}. Shutting down HalTest gracefully...`,
    ),
  );

  if (_serverRef && !_serverRef.killed) {
    _serverRef.kill("SIGTERM");

    const forceKill = setTimeout(() => {
      if (!_serverRef.killed) _serverRef.kill("SIGKILL");
    }, 5000);

    _serverRef.on("exit", () => {
      clearTimeout(forceKill);
      console.log(style(c.green, "  ✅ Server stopped cleanly. Goodbye!\n"));
      process.exit(0);
    });
  } else {
    console.log(style(c.green, "  ✅ Server already stopped. Goodbye!\n"));
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
