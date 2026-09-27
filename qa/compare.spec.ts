import { expect, test } from '@playwright/test'

// One slug per published head-to-head page (content/compare/*.md). Keep in sync
// when a comparison is added or retired.
const COMPARISON_SLUGS = [
  'descript',
  'opus-clip',
  'riverside',
  'submagic',
  'capcut',
  'veed',
  'captions',
  'vizard',
  'kapwing',
  'podcastle',
  'klap',
  'munch',
  'zoom',
]

test.describe('comparison hub', () => {
  test('frames the comparisons and states the method', async ({ page }) => {
    await page.goto('/compare')

    await expect(page.locator('link[rel="canonical"][href="https://bitterclip.com/compare"]')).toHaveCount(1)
    await expect(page.locator('link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/compare.md"]')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1, name: /Which one should/ })).toBeVisible()
    // The method is the trust argument; it belongs above the fold.
    await expect(page.getByText('Every claim is sourced')).toBeVisible()
    await expect(page.getByText('We say where we lose')).toBeVisible()
    await expect(page.getByText('They carry a date')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Try it on one recording' }).first()).toHaveAttribute('href', /app\.bitterclip\.com\/sign_up/)
  })

  test('links every head-to-head comparison page', async ({ page }) => {
    await page.goto('/compare')

    // Split across the featured cards and the denser directory below them.
    for (const slug of COMPARISON_SLUGS) {
      await expect(page.locator(`a[href="/compare/${slug}"]`)).toHaveCount(1)
    }
    // Grouped by the kind of tool a reader is weighing.
    await expect(page.getByRole('navigation', { name: 'Recording tools' }).locator('a[href="/compare/riverside"]')).toHaveCount(1)
  })

  test('keeps the hub usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/compare')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Try it on one recording' }).first()).toBeVisible()
  })
})

test.describe('head-to-head comparison pages', () => {
  for (const slug of COMPARISON_SLUGS) {
    test(`/compare/${slug} renders the full comparison`, async ({ page }) => {
      await page.goto(`/compare/${slug}`)

      await expect(page.locator(`link[rel="canonical"][href="https://bitterclip.com/compare/${slug}"]`)).toHaveCount(1)
      await expect(page.locator(`link[rel="alternate"][type="text/markdown"][href="https://bitterclip.com/compare/${slug}.md"]`)).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1, name: /^BitterClip vs / })).toBeVisible()
      await expect(page.getByRole('table')).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'BitterClip' })).toBeVisible()
      // Every row declares a verdict, and the running tally is stated up front.
      await expect(page.getByText(/^(Tie|.+ better)$/).first()).toBeVisible()
      await expect(page.getByText(/BitterClip better on \d/)).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Job by job' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Questions', exact: true })).toBeVisible()
      // The method states this page's own score and check date.
      await expect(page.getByRole('heading', { name: 'How we compared' })).toBeVisible()
      await expect(page.getByText(/Here: BitterClip \d+, .+ \d+, tie \d+\./)).toBeVisible()
      await expect(page.getByRole('link', { name: 'Try it on one recording' }).first()).toHaveAttribute('href', /app\.bitterclip\.com\/sign_up/)
      await expect(page.locator('script[type="application/ld+json"]').first()).toHaveCount(1)
      await expect(page.getByRole('link', { name: '← All comparisons' })).toHaveAttribute('href', '/compare')
    })
  }

  // The pages argue with evidence, not tone. These phrases crept in before and
  // read as snark or hedging; keep them out of every page, folded text included.
  const BANNED = [
    'mystery score', 'roll the dice', 'rolling the dice', 'honestly', 'genuinely', 'to be fair',
    "credit where it's due", 'narrow lane', 'within limits', 'not a thing', 'warily',
  ]
  test('comparison pages stay free of snark and hedging', async ({ page }) => {
    for (const slug of COMPARISON_SLUGS) {
      await page.goto(`/compare/${slug}`)
      const text = (await page.locator('main').textContent())?.toLowerCase() ?? ''
      for (const phrase of BANNED) expect(text, `${slug}: "${phrase}"`).not.toContain(phrase)
    }
  })

  test('keeps a head-to-head page usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/compare/${COMPARISON_SLUGS[0]}`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Try it on one recording' }).first()).toBeVisible()
  })
})
