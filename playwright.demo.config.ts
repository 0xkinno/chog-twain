// Records the real flows as video for the demo film. Runs on the seeded LOCAL chain (node scripts/e2e.mjs -c playwright.demo.config.ts ...).
// Output: docs/playwright_outputs_for_demo/videos/<test>/video.webm (1280x800), plus a copy of the specs it ran.
import { defineConfig, devices } from "@playwright/test";

process.env.RECORD_DEMO = "1"; // flows create their own browser contexts per wallet: record those too
const port = process.env.E2E_PORT ?? "3100";
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["02-flows.spec.ts", "03-demo.spec.ts"],
  timeout: 240_000,
  expect: { timeout: 30_000 },
  workers: 1,
  retries: 0,
  outputDir: "docs/playwright_outputs_for_demo/videos",
  reporter: [["list"], ["json", { outputFile: "docs/playwright_outputs_for_demo/results.json" }]],
  use: { baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${port}`, video: { mode: "on", size: { width: 1280, height: 800 } }, launchOptions: { slowMo: 250 }, ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});