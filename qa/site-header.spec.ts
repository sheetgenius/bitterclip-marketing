import { expect, test } from '@playwright/test'

// components/SiteHeader.vue is the one header for the marketing pages and the
// docs shell. These guard the two things that consolidation can quietly break:
// the link set drifting apart again, and the docs-only sidebar toggle.
const NAV_LINKS = [
  ['Demo', '/#demo'],
  ['Assistants', '/docs/assistants/overview'],
  ['Docs', '/docs'],
  ['Compare', '/compare'],
  ['Blog', '/blog'],
  ['Pricing', '/#pricing'],
] as const

for (const path of ['/', '/compare', '/blog', '/privacy', '/docs', '/docs/assistants/overview']) {
  test(`serves the one nav link set on ${path}`, async ({ page }) => {
    await page.goto(path)

    // Pages carry their own section <header>s, so match the site bar by its nav.
    const siteHeader = page.locator('header:has(nav[aria-label="Primary"])')
    await expect(siteHeader).toHaveCount(1)
    for (const [name, href] of NAV_LINKS) {
      await expect(siteHeader.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
    }
    // Sign-in is not a signup CTA: it must stay attribution-free so
    // plugins/analytics.client.ts never counts it as a signup_click.
    await expect(siteHeader.locator('a[href="https://app.bitterclip.com/sign_in"]')).toHaveCount(1)
    await expect(siteHeader.locator('a[href*="/sign_up"]')).toHaveCount(0)
  })
}

test('renders the same bar on the marketing pages and the docs shell', async ({ page }) => {
  // Twelve full page loads, six of them booting the homepage's WebGL machine —
  // under headless software rendering each of those costs seconds, so this
  // loop needs more than the default 30s. The height invariant is unchanged.
  test.setTimeout(120_000)
  for (const width of [1280, 900, 821, 820, 768, 390]) {
    const heights: number[] = []
    for (const path of ['/', '/docs']) {
      await page.setViewportSize({ width, height: 700 })
      await page.goto(path)
      const nav = page.locator('nav[aria-label="Primary"]')
      const box = await nav.boundingBox()
      heights.push(box!.height)
      // The docs bar carries a badge and a toggle the marketing bar does not;
      // if the row ever outgrows the pill it wraps and the bar grows.
      const overflows = await nav.evaluate((el) => el.scrollWidth > el.clientWidth)
      expect(overflows, `${path} @${width} overflows`).toBe(false)
    }
    // Sub-pixel tolerance only: a real divergence moves this by whole pixels.
    expect(Math.abs(heights[1]! - heights[0]!), `bar height differs @${width}`).toBeLessThan(1)
  }
})

test('marks the current docs section active', async ({ page }) => {
  await page.goto('/docs/assistants/overview')

  const nav = page.locator('nav[aria-label="Primary"]')
  await expect(nav.getByRole('link', { name: 'Docs', exact: true })).toHaveClass(/text-\[#f28f84\]/)
  await expect(nav.getByRole('link', { name: 'Assistants', exact: true })).toHaveClass(/text-\[#f28f84\]/)
  await expect(nav.getByRole('link', { name: 'Blog', exact: true })).not.toHaveClass(/text-\[#f28f84\]/)
})

test('opens and closes the docs sidebar drawer from the header toggle', async ({ page }) => {
  // The toggle appears exactly where docs.vue turns the sidebar into a drawer
  // (<= 820px), which is also where the inline nav links collapse.
  await page.setViewportSize({ width: 800, height: 800 })
  await page.goto('/docs/getting-started/your-first-clip')

  const toggle = page.getByRole('button', { name: 'Toggle navigation' })
  await expect(toggle).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-controls', 'docs-sidebar-drawer')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('nav[aria-label="Primary"]').getByRole('link', { name: 'Compare' })).toBeHidden()

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const drawerLink = page.locator('#docs-sidebar-drawer a[href="/docs/assistants/overview"]').first()
  await expect(drawerLink).toBeVisible()

  await page.locator('.docs-scrim').click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  // The drawer sits above its own scrim, so its links are clickable.
  await toggle.click()
  await drawerLink.click()
  await page.waitForURL('**/docs/assistants/overview')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

test('shows the sidebar toggle only where there is a sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 800 })
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Toggle navigation' })).toHaveCount(0)
})

test('closes every docs page with the company colophon', async ({ page }) => {
  // The marketing footer does not mount in the docs shell, so this line is the
  // only place a docs reader sees who publishes BitterClip.
  await page.goto('/docs/help/faq')

  const colophon = page.locator('.docs-colophon')
  await expect(colophon.getByRole('link', { name: 'SheetGenius, Inc.' })).toHaveAttribute(
    'href',
    'https://company.sheetgenius.com',
  )
  await expect(colophon.getByRole('link', { name: 'Privacy' })).toBeVisible()
  await expect(colophon.getByRole('link', { name: 'Terms' })).toBeVisible()
})

test('floats the homepage bar over the hero instead of a band above it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const header = page.locator('header:has(nav[aria-label="Primary"])')
  const stage = page.locator('.iso4-stage')
  const headerBox = await header.boundingBox()
  const stageBox = await stage.boundingBox()

  expect(headerBox, 'site bar missing').toBeTruthy()
  expect(stageBox, 'hero stage missing').toBeTruthy()
  // The 100svh canvas starts at the top of the viewport. A body-colored band
  // was the header occupying flow (~54px) above the stage.
  expect(stageBox!.y, 'stage starts below a header band').toBeLessThanOrEqual(1)
  expect(headerBox!.y).toBeGreaterThan(stageBox!.y)
  expect(headerBox!.y + headerBox!.height).toBeLessThan(stageBox!.y + stageBox!.height)

  await page.evaluate(() => window.scrollTo(0, 1200))
  const stuck = await header.boundingBox()
  expect(stuck!.y).toBeGreaterThan(8)
  expect(stuck!.y).toBeLessThan(24)
})
