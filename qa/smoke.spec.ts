import { expect, test } from '@playwright/test'

test('renders the speaker-aware clipping hero', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/index.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1, name: 'BitterClip' })).toBeVisible()
  await expect(page.getByText('Agent-operable media studio')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Cut clips where/ })).toBeVisible()
  await expect(page.getByText('BitterClip turns podcasts, interviews, founder calls')).toBeVisible()
  await expect(page.getByText('$99/month').first()).toBeVisible()
  await expect(page.locator('a[href="https://app.bitterclip.com/sign_up"]').filter({ hasText: 'Start with one recording' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'This is the editor your agent opens.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Not another pile of generic suggestions.' })).toBeVisible()
})

test('renders the developer documentation page and navigation', async ({ page }) => {
  await page.goto('/docs')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/docs.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'How a clip gets made.' })).toBeVisible()
  await expect(page.locator('strong').filter({ hasText: /Recording.*Moment.*Clip/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recording', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Moment', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Clip', exact: true })).toBeVisible()
})

test('renders the MCP specification page and handles tab switches', async ({ page }) => {
  await page.goto('/mcp')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/mcp.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'How ChatGPT and Claude open the editor.' })).toBeVisible()
  await expect(page.locator('a[href="https://app.bitterclip.com/sign_up"]').filter({ hasText: 'Start with one recording' }).first()).toBeVisible()
  
  // Verify tabs are available
  await expect(page.getByRole('button', { name: 'Endpoint & methods' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tools' })).toBeVisible()

  // Switch to catalog tab
  await page.getByRole('button', { name: 'Tools' }).click()
  await expect(page.getByRole('cell', { name: 'clips_render_candidate_editor' })).toBeVisible()

  // Switch to bridge tab
  await page.getByRole('button', { name: 'The bridge' }).click()
  await expect(page.getByText('One contract')).toBeVisible()
})

test('serves crawlable markdown alternates and discovery files', async ({ request }) => {
  const markdownPages = [
    { path: '/index.md', text: 'Cut clips where your context lives.' },
    { path: '/docs.md', text: 'Recording -> Moment -> Clip' },
    { path: '/mcp.md', text: 'How ChatGPT And Claude Open The Editor' },
  ]

  for (const markdownPage of markdownPages) {
    const response = await request.get(markdownPage.path)
    expect(response.ok()).toBeTruthy()
    expect(await response.text()).toContain(markdownPage.text)
  }

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  const sitemapText = await sitemap.text()
  expect(sitemapText).toContain('https://bitterclip.com/index.md')
  expect(sitemapText).toContain('https://bitterclip.com/docs.md')
  expect(sitemapText).toContain('https://bitterclip.com/mcp.md')
  expect(sitemapText).toContain('https://bitterclip.com/llms.txt')

  const llms = await request.get('/llms.txt')
  expect(llms.ok()).toBeTruthy()
  expect(await llms.text()).toContain('Markdown Alternates')
})
