import { defineConfig, devices } from "@playwright/test"
import path from "node:path"

// e2e runs against the fixture tests, not the user's data/reading.
process.env.READING_DATA_DIR = path.resolve(__dirname, "test/fixtures/reading")

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3100" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: { command: "npm run build && npm run start -- -p 3100", url: "http://localhost:3100", reuseExistingServer: true },
})
