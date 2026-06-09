import { expect, test } from '@playwright/test'

test('renders the speaker-aware clipping hero', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/index.md"]')).toHaveCount(1)
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(jsonLd).toContain('SoftwareApplication')
  await expect(page.getByRole('heading', { level: 1, name: /Cut your clips/ })).toBeVisible()
  await expect(page.getByText('opens a real editor right in the chat')).toBeVisible()
  await expect(page.locator('a[href="https://app.bitterclip.com/sign_up"]').filter({ hasText: 'Start with one' }).first()).toBeVisible()
  const navCta = page.locator('header a[href="https://app.bitterclip.com/sign_up"]').filter({ hasText: 'Start with one' })
  await expect(navCta).toHaveClass(/bg-\[#f28f84\]/)
  await expect(navCta).not.toHaveClass(/bg-purple-300/)
  await expect(navCta).not.toHaveClass(/bg-amber-400/)
  await expect(page.getByRole('heading', { name: 'Upload a recording. It does the boring part.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Other clippers guess. Yours knows the whole conversation.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Finished clips — out the door, your way.' })).toBeVisible()
  await expect(page.locator('footer a[href="/llms.txt"]')).toBeVisible()
  await expect(page.locator('footer a[href="/llms-full.txt"]')).toBeVisible()
  await expect(page.locator('footer a[href="https://github.com/sheetgenius/bitterclip-marketing"]')).toBeVisible()
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

test('renders the privacy policy page', async ({ page }) => {
  await page.goto('/privacy')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/privacy.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'Privacy policy.' })).toBeVisible()
  await expect(page.getByText('Effective date:')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Information We Collect' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AI, Media, And Provider Processing' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'hello@bitterclip.com' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'YouTube API Services' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'YouTube Terms of Service' })).toBeVisible()
})

test('renders the terms of service page', async ({ page }) => {
  await page.goto('/terms')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/terms.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'Terms of service.' })).toBeVisible()
  await expect(page.getByText('Effective date:')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Using BitterClip' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Publishing Integrations' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'hello@bitterclip.com' })).toBeVisible()
})

test('serves crawlable markdown alternates and discovery files', async ({ request }) => {
  const markdownPages = [
    { path: '/index.md', text: 'Cut clips where your context lives.' },
    { path: '/docs.md', text: 'Recording -> Moment -> Clip' },
    { path: '/mcp.md', text: 'How ChatGPT And Claude Open The Editor' },
    { path: '/privacy.md', text: 'BitterClip does not sell your recordings' },
    { path: '/terms.md', text: 'You retain your rights in recordings' },
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
  expect(sitemapText).toContain('https://bitterclip.com/privacy')
  expect(sitemapText).toContain('https://bitterclip.com/privacy.md')
  expect(sitemapText).toContain('https://bitterclip.com/terms')
  expect(sitemapText).toContain('https://bitterclip.com/terms.md')
  expect(sitemapText).toContain('https://bitterclip.com/llms.txt')
  expect(sitemapText).toContain('https://bitterclip.com/llms-full.txt')

  const llms = await request.get('/llms.txt')
  expect(llms.ok()).toBeTruthy()
  const llmsText = await llms.text()
  expect(llmsText).toContain('Markdown Alternates')
  expect(llmsText).toContain('Contributing')

  const llmsFull = await request.get('/llms-full.txt')
  expect(llmsFull.ok()).toBeTruthy()
  const llmsFullText = await llmsFull.text()
  expect(llmsFullText).toContain('Recording -> Transcript -> Speakers -> Moments -> Clips -> Exports -> Publishing')
  expect(llmsFullText).toContain('Terms Of Service')
  expect(llmsFullText).toContain('Repository Boundary')
})
