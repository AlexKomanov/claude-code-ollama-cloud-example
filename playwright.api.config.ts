import { defineConfig } from "@playwright/test";

/**
 * API-only config: runs just e2e/api.spec.ts with the `request` fixture, so no
 * browser is ever launched and no blank-browser evidence is captured.
 * Run with `npm run test:e2e:api`.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/api.spec.ts",
  // The mock store is process-global on the test server (no per-test reset),
  // so tests run serially for deterministic state.
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3100",
    // No browser in these tests: screenshots/video would only capture blanks.
    screenshot: "off",
    video: "off",
    trace: "retain-on-failure",
  },
  outputDir: "test-results/",
  // CI runs both configs with the blob reporter and merges them into the
  // single HTML report published to GitHub Pages.
  // Locally the API report goes to playwright-report/api so it doesn't
  // overwrite the UI report.
  reporter: process.env.CI
    ? [["list"], ["blob"]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report/api" }]],
  webServer: {
    // Dedicated test server: MSW off, so API requests hit the real Next.js
    // API routes with the same server-side mock store as the UI tests.
    // Port 3100 keeps it independent of a manually running dev server.
    command: "NEXT_PUBLIC_ENABLE_MSW=false npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});