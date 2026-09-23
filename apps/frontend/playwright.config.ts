import { defineConfig, devices } from "@playwright/test";

/**
 * X1 — POSITION PERSISTENCE harness.
 *
 * Requires the local stack already running (backend :2001, vite :5173).
 * Both servers are reused when present (reuseExistingServer).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});