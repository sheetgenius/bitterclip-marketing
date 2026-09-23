import { expect, test, type Page } from '@playwright/test'

// /connect is static; the app's /viewer upgrades it with live status. These
// checks mock /viewer so every state renders deterministically.

const VIEWER_URL = 'https://app.bitterclip.com/viewer'
const SIGNED_OUT = { signed_in: false }

async function mockViewer(page: Page, bodies: object[]) {
  let call = 0
  await page.route(VIEWER_URL, (route) => {
    const body = bodies[Math.min(call, bodies.length - 1)]
    call += 1
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': route.request().headers().origin ?? '',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify(body),
    })
  })
}

test('connect page leads with Claude and routes installs through the app', async ({ page }) => {
  await mockViewer(page, [SIGNED_OUT])
  await page.goto('/connect')

  await expect(page.getByRole('heading', { level: 1, name: 'Edit your videos from Claude or ChatGPT.' })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://bitterclip.com/connect')
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute('href', 'https://bitterclip.com/connect.md')
  await expect(page.getByRole('tab', { name: 'Claude', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('link', { name: 'Add to Claude' })).toHaveAttribute('href', 'https://app.bitterclip.com/go/claude?from=connect_page')
  await expect(page.getByRole('link', { name: 'Start in Claude' })).toHaveAttribute('href', 'https://app.bitterclip.com/go/claude/start?from=connect_page')
  await expect(page.getByText('to see what\'s connected')).toBeVisible()
  await expect(page.locator('header').getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', 'https://app.bitterclip.com/sign_in')
  await expect(page.getByRole('link', { name: 'Add to Claude' })).toHaveClass(/bg-\[#f28f84\]/)
  await expect(page.getByTestId('connect-status')).toHaveCount(0)
})

test('ChatGPT ad traffic opens the ChatGPT tab and ?client= picks a tab', async ({ page }) => {
  await mockViewer(page, [SIGNED_OUT])
  await page.goto('/connect?utm_source=chatgpt_ads')
  await expect(page.getByRole('tab', { name: 'ChatGPT' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('link', { name: 'Open ChatGPT Plugins' })).toHaveAttribute('href', 'https://app.bitterclip.com/go/chatgpt?from=connect_page')

  await page.goto('/connect?client=claude_code')
  await expect(page.getByRole('tab', { name: 'Claude Code' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#connect-panel-claude_code code').first()).toContainText('claude plugin install bitterclip@bitterclip')
})

test('install links carry where the visit started', async ({ page }) => {
  await mockViewer(page, [SIGNED_OUT])
  await page.goto('/connect?from=app_menu')
  await expect(page.getByRole('link', { name: 'Add to Claude' })).toHaveAttribute('href', 'https://app.bitterclip.com/go/claude?from=app_menu')

  await page.goto('/connect?from=somewhere_else')
  await expect(page.getByRole('link', { name: 'Add to Claude' })).toHaveAttribute('href', 'https://app.bitterclip.com/go/claude?from=connect_page')
})

test('a signed-in visitor sees live connection status', async ({ page }) => {
  const usedAt = new Date(Date.now() - 2 * 60_000).toISOString()
  await mockViewer(page, [{
    signed_in: true,
    assistants: {
      claude: { state: 'connected', last_used_at: usedAt },
      chatgpt: { state: 'reconnect' },
      claude_code: { state: 'not_connected' },
      codex: { state: 'not_connected' },
    },
  }])
  await page.goto('/connect?client=claude')

  await expect(page.getByTestId('connect-status')).toHaveText(/Connected · used 2 minutes ago/)
  await expect(page.getByText('Signed in to BitterClip.')).toBeVisible()
  await expect(page.locator('header').getByRole('link', { name: 'Open BitterClip' })).toHaveAttribute('href', 'https://app.bitterclip.com/')
  // Connected, so starting to edit is the primary action.
  await expect(page.getByRole('link', { name: 'Start in Claude' })).toHaveClass(/bg-\[#f28f84\]/)
  await expect(page.getByRole('link', { name: 'Add to Claude' })).not.toHaveClass(/bg-\[#f28f84\]/)
  await page.getByRole('tab', { name: 'ChatGPT' }).click()
  await expect(page.getByTestId('connect-status')).toHaveText(/Reconnect needed/)
})

test('an unavailable status check leaves the page usable', async ({ page }) => {
  await page.route(VIEWER_URL, (route) => route.abort())
  await page.goto('/connect')

  await expect(page.getByRole('link', { name: 'Add to Claude' })).toBeVisible()
  await expect(page.getByTestId('connect-status')).toHaveCount(0)
})

test('the page notices a new connection after an Add click', async ({ page, context }) => {
  await context.route('https://app.bitterclip.com/go/**', (route) => route.fulfill({ status: 204, body: '' }))
  await mockViewer(page, [
    { signed_in: true, assistants: { claude: { state: 'not_connected' } } },
    { signed_in: true, assistants: { claude: { state: 'connected', last_used_at: null } } },
  ])
  await page.goto('/connect?client=claude')
  await expect(page.getByTestId('connect-status')).toHaveText(/Not connected yet/)

  // A synthetic click runs the page's handler; whether a new tab opens is the
  // browser's business, not this check's.
  await page.getByRole('link', { name: 'Add to Claude' }).dispatchEvent('click')

  await expect(page.getByTestId('connect-status')).toHaveText(/Waiting for you to allow BitterClip|Connected/)
  await expect(page.getByTestId('connect-status')).toHaveText(/^✓\s*Connected$/, { timeout: 8000 })
})

test('connect has a Markdown twin and a sitemap entry', async ({ request }) => {
  const markdown = await request.get('/connect.md')
  expect(markdown.status()).toBe(200)
  expect(await markdown.text()).toContain('# Connect BitterClip to Claude, ChatGPT, Claude Code or Codex')

  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('https://bitterclip.com/connect')
})

test('Codex installs through the desktop app, and says so when it cannot open', async ({ page }) => {
  await mockViewer(page, [SIGNED_OUT])
  await page.goto('/connect?client=codex')

  await expect(page.getByRole('tab', { name: 'Codex' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#connect-panel-codex')).toContainText('codex plugin add bitterclip@bitterclip')
  await page.getByRole('button', { name: 'Install in Codex' }).click()
  await expect(page.getByTestId('codex-missing')).toBeVisible({ timeout: 5000 })
})

test('agents are pointed at the install instructions', async ({ page, request }) => {
  await mockViewer(page, [SIGNED_OUT])
  await page.goto('/connect')
  await expect(page.locator('main p.sr-only').first()).toHaveText(/read and follow https:\/\/bitterclip\.com\/docs\/assistants\/install/)

  const install = await request.get('/docs/assistants/install')
  expect(install.status()).toBe(200)
  const llms = await (await request.get('/llms.txt')).text()
  expect(llms).toContain('## Install')
  expect(llms).toContain('https://bitterclip.com/docs/assistants/install')
})
