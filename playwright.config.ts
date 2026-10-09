import { defineConfig, devices } from "@playwright/test";

/**
 * UI (browser) config: everything except e2e/api.spec.ts — the API-only specs
 * live under playwright.api.config.ts (`npm run test:e2e:api`) so they never
 * launch a browser.
 */
export default defineConfig({
  testDir: "./e2e",
  // The API-only suite runs with its own config (and no browser).
  testIgnore: "**/api.spec.ts",
  // The mock store is process-global on the test server (no per-test reset),
  // so tests run serially for deterministic state.
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    // Capture evidence on every run; video kept when tests fail.
    screenshot: "on",
    video: { mode: "retain-on-failure", size: { width: 1280, height: 720 } },
  },
  outputDir: "test-results/",
  // HTML report alongside the terminal list (view with `npx playwright show-report`).
  // In CI both configs run with the blob reporter and merge-reports produces
  // one combined HTML report for the GitHub Pages publish.
  reporter: process.env.CI
    ? [["list"], ["blob"]]
    : [["list"], ["html", { open: "never" }]],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      // iPhone 17 Pro Max viewport/touch emulation on the Chromium engine: real
      // iPhone descriptors force WebKit (Safari's engine; iOS devices can only
      // run WebKit), but the suite targets a single Chromium engine per user.
      name: "mobile",
      use: { ...devices["iPhone 17 Pro Max"], browserName: "chromium", defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    // Dedicated test server: MSW off, so browser fetches hit the real Next.js
    // API routes and API/UI tests share the same server-side mock store.
    // Port 3100 keeps it independent of a manually running dev server.
    command: "NEXT_PUBLIC_ENABLE_MSW=false npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});