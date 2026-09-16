#!/usr/bin/env node

/**
 * Clean-room test for npm package
 * Tests the published package in a fresh environment
 */

import { spawn } from "child_process";
import { promisify } from "util";
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const exec = promisify(require("child_process").exec);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function runCommand(cmd, cwd, env = {}, timeoutMs = 600000) {
  return new Promise((resolve, reject) => {
    const proc = spawn("sh", ["-c", cmd], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      setTimeout(() => proc.kill("SIGKILL"), 5000);
    }, timeoutMs);

    proc.stdout.on("data", (data) => (stdout += data.toString()));
    proc.stderr.on("data", (data) => (stderr += data.toString()));

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(
          new Error(
            `Command timed out after ${timeoutMs / 1000}s: ${cmd}\n${stdout}\n${stderr}`,
          ),
        );
      } else if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed (${code}): ${cmd}\n${stderr}`));
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function main() {
  console.log("🧪 Starting clean-room npm package test...\n");

  const distDir = path.join(process.cwd(), "apps", "cli", "dist");
  const tempDir = path.join("/tmp", `haltest-test-${Date.now()}`);

  try {
    // 1. Pack the package
    console.log("📦 Packing npm package...");
    await runCommand("npm pack", distDir, {}, 600000);
    const pkgFiles = fs
      .readdirSync(distDir)
      .filter((f) => f.startsWith("haltest-") && f.endsWith(".tgz"));
    if (pkgFiles.length === 0) throw new Error("No package file found");
    const pkgFile = pkgFiles[0];
    console.log(`   Package: ${pkgFile}\n`);

    // 2. Create clean test directory
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`📁 Test directory: ${tempDir}\n`);

    // 3. Install package
    console.log("📥 Installing package...");
    await runCommand(
      `npm install "${distDir}/${pkgFile}"`,
      tempDir,
      {},
      600000,
    );
    console.log("   ✅ Package installed\n");

    // 4. Rebuild native modules (sqlite3, better-sqlite3)
    console.log("🔨 Rebuilding native modules...");
    await runCommand("npm rebuild", tempDir, {}, 600000);
    console.log("   ✅ Native modules rebuilt\n");

    // 4. Install Playwright Chromium (required for backend)
    console.log("🎭 Installing Playwright Chromium...");
    const isCI =
      process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
    const installCmd = isCI
      ? "npx playwright install chromium --with-deps"
      : "npx playwright install chromium";
    await runCommand(installCmd, tempDir, {}, 900000);
    console.log("   ✅ Playwright installed\n");

    // 5. Test CLI version
    console.log("🔍 Testing CLI --version...");
    const versionOutput = await runCommand(
      "npx haltest --version",
      tempDir,
      {},
      120000,
    );
    console.log(`   ${versionOutput.trim()}\n`);

    // 6. Test CLI info
    console.log("🔍 Testing CLI --info...");
    const infoOutput = await runCommand(
      "npx haltest --info",
      tempDir,
      {},
      120000,
    );
    console.log(`   ${infoOutput.trim()}\n`);

    // 7. Start backend in background and test health endpoint
    console.log("🚀 Starting backend server...");
    const backendProc = spawn("npx", ["haltest"], {
      cwd: tempDir,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: "2002",
        HALTEST_MODE: "local",
        AUTH_ENABLED: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });

    let backendReady = false;
    let backendOutput = "";

    backendProc.stdout.on("data", (data) => {
      const text = data.toString();
      backendOutput += text;
      if (text.includes("HaltTest Server is Up")) {
        backendReady = true;
      }
    });

    backendProc.stderr.on("data", (data) => {
      backendOutput += data.toString();
    });

    // Wait for server to be ready (max 60 seconds)
    let attempts = 0;
    while (!backendReady && attempts < 60) {
      await sleep(1000);
      attempts++;
    }

    if (!backendReady) {
      throw new Error(`Backend failed to start:\n${backendOutput}`);
    }

    console.log("   ✅ Backend started\n");

    // 8. Test health endpoint
    console.log("🏥 Testing health endpoint...");
    const healthOutput = await runCommand(
      "curl -s http://localhost:2002/api/status",
      tempDir,
      {},
      60000,
    );
    const health = JSON.parse(healthOutput);
    console.log(`   Version: ${health.version}`);
    console.log(`   Commit: ${health.git?.shortCommit}`);
    console.log(`   Build: ${health.buildId}`);
    console.log(`   ✅ Health check passed\n`);

    // 9. Test frontend loads
    console.log("🌐 Testing frontend...");
    const frontendOutput = await runCommand(
      'curl -s -o /dev/null -w "%{http_code}" http://localhost:2002/app/',
      tempDir,
      {},
      60000,
    );
    if (frontendOutput.trim() !== "200") {
      throw new Error(`Frontend returned ${frontendOutput}`);
    }
    console.log("   ✅ Frontend loads\n");

    // 10. Test Playwright can launch
    console.log("🎭 Testing Playwright Chromium launch...");
    const pwTest = `
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.goto('data:text/html,<html><body>OK</body></html>');
  const title = await page.title();
  await browser.close();
  console.log('Playwright test passed:', title);
})();
`;
    await runCommand(
      `node -e "${pwTest.replace(/\n/g, " ")}"`,
      tempDir,
      {},
      120000,
    );
    console.log("   ✅ Playwright works\n");

    // 11. Kill backend and any descendant processes
    console.log("🛑 Stopping backend...");
    try {
      process.kill(-backendProc.pid, "SIGTERM");
    } catch {
      backendProc.kill("SIGTERM");
    }
    await sleep(1500);
    try {
      process.kill(-backendProc.pid, "SIGKILL");
    } catch {
      /* already gone */
    }

    console.log("✅ All clean-room tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exitCode = 1;
  } finally {
    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
  process.exit(process.exitCode ?? 0);
}

main();
