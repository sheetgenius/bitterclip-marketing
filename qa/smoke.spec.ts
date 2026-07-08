import { expect, test } from '@playwright/test'

test('renders the speaker-aware clipping hero', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/index.md"]')).toHaveCount(1)
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(jsonLd).toContain('SoftwareApplication')
  await expect(page.getByRole('heading', { level: 1, name: /Cut your clips/ })).toBeVisible()
  await expect(page.getByText('opens a real editor right in the chat')).toBeVisible()
  await expect(page.locator('a[href^="https://app.bitterclip.com/sign_up"]').filter({ hasText: 'Start free' }).first()).toBeVisible()
  const navCta = page.locator('header a[href="https://app.bitterclip.com/sign_in"]').filter({ hasText: 'Sign in' })
  await expect(navCta).toBeVisible()
  await expect(navCta).toHaveClass(/bg-\[#f28f84\]/)
  await expect(page.locator('header a[href^="https://app.bitterclip.com/sign_up"]')).toHaveCount(0)
  await expect(page.getByTestId('hero-phone-screen')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  await expect(page.locator('iframe[title="BitterClip — episode one, cut into clips"]')).toHaveAttribute('src', /theme=dark/)
  await expect(page.locator('iframe[title="BitterClip — episode one, cut into clips"]')).not.toHaveAttribute('src', /editor=1/)
  await expect(page.locator('iframe[title="BitterClip — episode one, cut into clips"]')).toHaveAttribute('src', /day-1-opening-watermarked\.mp4/)
  await expect(page.getByRole('heading', { name: 'Other clippers guess. Yours knows the whole conversation.' })).toBeVisible()
  await expect(page.getByText('72%')).toBeVisible()
  await expect(page.getByText('28%')).toBeVisible()
  await expect(page.getByRole('link', { name: /Strength & Positions/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Frontier Studio' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Finished clips — out the door, your way.' })).toBeVisible()
  await expect(page.locator('#pricing').getByRole('link', { name: 'Start free' })).toBeVisible()
  await expect(page.locator('#pricing').getByRole('link', { name: 'Start clipping' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go Pro' })).toBeVisible()
  await expect(page.locator('footer a[href="/llms.txt"]')).toBeVisible()
  await expect(page.locator('footer a[href="/llms-full.txt"]')).toBeVisible()
  await expect(page.locator('footer a[href="https://github.com/sheetgenius/bitterclip-marketing"]')).toBeVisible()
})

test('attributes signup links after hero demo engagement', async ({ page }) => {
  await page.goto('/')

  const hero = page.locator('iframe[title="BitterClip — episode one, cut into clips"]')
  await expect(hero).toHaveAttribute('src', /embed\/recording/)

  await page.evaluate(() => {
    const frame = document.querySelector<HTMLIFrameElement>('iframe[title="BitterClip — episode one, cut into clips"]')
    if (!frame?.contentWindow) throw new Error('hero iframe missing')
    window.dispatchEvent(new MessageEvent('message', {
      data: { bitterclip_demo_event: 'export_revealed', detail: { has_download_url: true } },
      source: frame.contentWindow,
    }))
  })

  await expect(page.getByRole('link', { name: /Clip your first recording/ })).toHaveAttribute('href', /utm_content=hero_export_revealed/)
})

test('attributes signup links after mid-page editor engagement', async ({ page }) => {
  await page.goto('/')

  const editor = page.locator('iframe[title="BitterClip — the live transcript editor"]')
  await expect(editor).toHaveAttribute('src', /embed\/clip-demo/)

  await page.evaluate(() => {
    const frame = document.querySelector<HTMLIFrameElement>('iframe[title="BitterClip — the live transcript editor"]')
    if (!frame?.contentWindow) throw new Error('editor iframe missing')
    window.dispatchEvent(new MessageEvent('message', {
      data: { bitterclip_demo_event: 'export_revealed', detail: { has_download_url: true } },
      source: frame.contentWindow,
    }))
  })

  await expect(page.getByRole('link', { name: /Clip your first recording/ })).toHaveAttribute('href', /utm_content=editor_export_revealed/)
})

test('previews the light hero phone and forwards the theme to the embed', async ({ page }) => {
  await page.goto('/?heroTheme=light')

  await expect(page.getByTestId('hero-phone-screen')).toHaveCSS('background-color', 'rgb(253, 253, 252)')
  await expect(page.locator('iframe[title="BitterClip — episode one, cut into clips"]')).toHaveAttribute('src', /theme=light/)
})

test('defers the mobile hero recording iframe until the phone is in view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 })
  await page.goto('/')
  await page.waitForTimeout(1500)

  await expect(page.locator('header a[href="https://app.bitterclip.com/sign_in"]').filter({ hasText: 'Sign in' })).toBeVisible()
  await expect(page.locator('header a[href^="https://app.bitterclip.com/sign_up"]')).toHaveCount(0)

  const hero = page.locator('iframe[title="BitterClip — episode one, cut into clips"]')
  await expect(hero).toHaveCount(0)

  await page.getByTestId('hero-phone-screen').scrollIntoViewIfNeeded()
  await expect(hero).not.toHaveAttribute('src', /editor=1/)
  await expect(hero).toHaveAttribute('src', /day-1-opening-watermarked\.mp4/)
})

test('renders the developer documentation page and navigation', async ({ page }) => {
  await page.goto('/docs')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="/docs.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1, name: 'BitterClip docs' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Start here' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Use it from your AI assistant' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Your first clip' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Connect ChatGPT' }).first()).toBeVisible()
})

test('renders the assistant documentation page and live editor', async ({ page }) => {
  await page.goto('/docs/assistants/overview')

  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="/docs/assistants/overview.md"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1, name: 'Use BitterClip from your AI assistant' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Try the editor right here' })).toBeVisible()
  await expect(page.locator('iframe[title="BitterClip — the live transcript editor"]')).toHaveAttribute('src', /embed\/clip-demo/)
  await expect(page.getByText('app.bitterclip.com/mcp')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What you can ask for' })).toBeVisible()
  await expect(page.getByText('not the full list')).toBeVisible()
})

test('renders the blog index and Identity Studio launch post', async ({ page }) => {
  await page.goto('/blog')

  await expect(page.locator('link[rel="canonical"][href="https://bitterclip.com/blog"]')).toHaveCount(1)
  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/blog.md"]')).toHaveCount(1)
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"][href="https://bitterclip.com/blog/rss.xml"]')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1, name: 'BitterClip Blog' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Your show has a signature now/ })).toBeVisible()

  await page.getByRole('link', { name: /Your show has a signature now/ }).click()
  await page.waitForURL('**/blog/your-show-has-a-signature-now')

  await expect(page.locator('link[rel="canonical"][href="https://bitterclip.com/blog/your-show-has-a-signature-now"]')).toHaveCount(1)
  await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/blog/your-show-has-a-signature-now.md"]')).toHaveCount(1)
  await expect(page.locator('meta[property="og:type"][content="article"]')).toHaveCount(1)
  await expect(page.locator('meta[property="og:image"][content="https://bitterclip.com/images/blog/identity-studio/your-show-has-a-signature-now-og.jpg"]')).toHaveCount(1)
  await expect(page.locator('meta[name="twitter:card"][content="summary_large_image"]')).toHaveCount(1)
  await expect(page.locator('meta[property="article:published_time"][content="2026-07-08T00:00:00Z"]')).toHaveCount(1)
  await expect(page.locator('meta[property="article:author"][content="Michael Ruescher"]')).toHaveCount(1)
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(jsonLd).toContain('BlogPosting')
  expect(jsonLd).toContain('Michael Ruescher')
  expect(jsonLd).toContain('BitterClip')

  await expect(page.getByRole('heading', { level: 1, name: 'Your show has a signature now' })).toBeVisible()
  await expect(page.getByText('Introducing Identity Studio: branded openers, outros, and a signature look')).toBeVisible()
  await expect(page.getByAltText('Signature Studio full-screen lab showing a BitterClip wordmark opener mid-animation on a dark stage.')).toBeVisible()
  await expect(page.getByAltText('Project FX tab showing the signature shelf with saved opener and outro effects.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Founder-Led Podcast' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Strength & Positions' })).toBeVisible()
  await expect(page.getByText('Read my mind. MVP for a podcast: 30-sec sizzle intro hook')).toBeVisible()
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
  await expect(page.getByRole('link', { name: 'hello@bitterclip.com' }).first()).toBeVisible()
})

test('serves crawlable markdown alternates and discovery files', async ({ request }) => {
  const markdownPages = [
    { path: '/index.md', text: 'Cut clips where your context lives.' },
    { path: '/docs.md', text: 'Use it from your AI assistant' },
    { path: '/docs/assistants/overview.md', text: 'Use BitterClip from your AI assistant' },
    { path: '/blog.md', text: 'Your show has a signature now' },
    { path: '/blog/your-show-has-a-signature-now.md', text: 'Know what mattered in the recording' },
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
  expect(sitemapText).toContain('https://bitterclip.com/')
  expect(sitemapText).toContain('https://bitterclip.com/docs')
  expect(sitemapText).toContain('https://bitterclip.com/docs/assistants/overview')
  expect(sitemapText).toContain('https://bitterclip.com/blog')
  expect(sitemapText).toContain('https://bitterclip.com/blog/your-show-has-a-signature-now')
  expect(sitemapText).toContain('https://bitterclip.com/privacy')
  expect(sitemapText).toContain('https://bitterclip.com/terms')
  expect(sitemapText).toContain('https://bitterclip.com/docs/help/troubleshooting')

  const rss = await request.get('/blog/rss.xml')
  expect(rss.ok()).toBeTruthy()
  const rssText = await rss.text()
  expect(rssText).toContain('<rss version="2.0"')
  expect(rssText).toContain('<title>Your show has a signature now</title>')
  expect(rssText).toContain('https://bitterclip.com/blog/your-show-has-a-signature-now')

  const llms = await request.get('/llms.txt')
  expect(llms.ok()).toBeTruthy()
  const llmsText = await llms.text()
  expect(llmsText).toContain('Recording → Episode → Clip')
  expect(llmsText).toContain('Use it from your AI assistant')
  expect(llmsText).toContain('Your show has a signature now')

  const llmsFull = await request.get('/llms-full.txt')
  expect(llmsFull.ok()).toBeTruthy()
  const llmsFullText = await llmsFull.text()
  expect(llmsFullText).toContain('Recording → Episode → Clip')
  expect(llmsFullText).toContain('Use BitterClip from your AI assistant')
  expect(llmsFullText).toContain('Connect ChatGPT')
  expect(llmsFullText).toContain('Troubleshooting')
  expect(llmsFullText).toContain('Your show has a signature now')
  expect(llmsFullText).toContain('Know what mattered in the recording')
})
