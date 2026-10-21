import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3100";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  expect: { timeout: 30_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});