import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './qa',
  webServer: {
    command: 'bunx serve .output/public -l 4179',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4179',
  },
})
