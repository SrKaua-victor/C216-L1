import { defineConfig, devices } from "@playwright/test";
import { FRONTEND_URL } from "./tests/e2e/ambiente.js";

const NO_CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: NO_CI,
  retries: NO_CI ? 2 : 0,
  reporter: NO_CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
