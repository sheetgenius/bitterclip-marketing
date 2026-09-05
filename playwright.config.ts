import { defineConfig } from '@playwright/test'

const qaPort = Number.parseInt(process.env.BITTERCLIP_QA_PORT || '4179', 10)
const qaUrl = `http://127.0.0.1:${qaPort}`

export default defineConfig({
  testDir: './qa',
  webServer: {
    command: `bunx serve .output/public -l ${qaPort}`,
    url: qaUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  use: {
    baseURL: qaUrl,
  },
})
