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
    await expect(page.getByRole('link', { name: 'Try BitterClip' })).toHaveAttribute('href', /app\.bitterclip\.com\/sign_up/)
  })

  test('links every head-to-head comparison page', async ({ page }) => {
    await page.goto('/compare')

    // Split across the featured cards and the denser directory below them.
    for (const slug of COMPARISON_SLUGS) {
      await expect(page.locator(`a[href="/compare/${slug}"]`)).toHaveCount(1)
    }
    // The most-searched matchups lead, rather than sitting in alphabetical order.
    await expect(page.getByRole('navigation', { name: 'Most compared' }).locator('a[href="/compare/descript"]')).toHaveCount(1)
  })

  test('keeps the hub usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/compare')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Try BitterClip' })).toBeVisible()
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
      await expect(page.getByText(/^(Tie|.+ wins)$/).first()).toBeVisible()
      await expect(page.getByText(/BitterClip better on \d/)).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Choose BitterClip when…' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Questions people actually ask.' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Try BitterClip', exact: true })).toHaveAttribute('href', /app\.bitterclip\.com\/sign_up/)
      await expect(page.locator('script[type="application/ld+json"]').first()).toHaveCount(1)
      await expect(page.getByRole('link', { name: '← All comparisons' })).toHaveAttribute('href', '/compare')
    })
  }

  test('keeps a head-to-head page usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/compare/${COMPARISON_SLUGS[0]}`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Try BitterClip' })).toBeVisible()
  })
})
