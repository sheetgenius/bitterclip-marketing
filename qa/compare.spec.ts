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
      const jobs = page.getByRole('table', { name: /job by job/ })
      await expect(jobs).toBeVisible()
      await expect(jobs.getByRole('columnheader', { name: 'BitterClip' })).toBeVisible()
      // Every row declares a verdict, and the running tally is stated up front.
      await expect(page.getByText(/^(Tie|.+ better)$/).first()).toBeVisible()
      await expect(page.getByText(/BitterClip better on \d/)).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Job by job' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Questions', exact: true })).toBeVisible()
      // The method states this page's own score and check date.
      await expect(page.getByRole('heading', { name: 'How we compared' })).toBeVisible()
      await expect(page.getByText(/Here: BitterClip \d+, .+ \d+, tie \d+\./)).toBeVisible()
      // Corrections go through the public repository, straight to this page's file.
      await expect(page.getByRole('link', { name: /Edit this page on GitHub/ })).toHaveAttribute('href', `https://github.com/sheetgenius/bitterclip-marketing/blob/main/content/compare/${slug}.md`)
      await expect(page.getByRole('link', { name: 'Try it on one recording' }).first()).toHaveAttribute('href', /app\.bitterclip\.com\/sign_up/)
      await expect(page.locator('script[type="application/ld+json"]').first()).toHaveCount(1)
      await expect(page.getByRole('link', { name: '← All comparisons' })).toHaveAttribute('href', '/compare')
      // The difference that matters most to someone with their own AI plan:
      // every page states it, with the live tool count, never a raw token.
      const agentRow = jobs.getByRole('row', { name: /Editing from your own ChatGPT or Claude/ })
      await expect(agentRow).toContainText(/The whole editor, \d+ tools\./)
      await expect(page.locator('main')).not.toContainText('{tools}')
      // Each cell names its product in real text, so flattened tables keep attribution.
      await expect(page.getByRole('table', { name: /at a glance/ }).locator('tbody td').first()).toContainText('BitterClip:')
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
    await expect(page.getByRole('table', { name: /at a glance/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Try it on one recording' }).first()).toBeVisible()
  })

  // Most readers are crawlers and other people's agents: they read the text in
  // order and quote the first facts they find. So the answer, who each product
  // is for and both prices come first, as text and a table, never a picture.
  for (const slug of ['zoom', 'veed', 'opus-clip']) {
    test(`/compare/${slug} leads with the answer and the facts`, async ({ page, request }) => {
      await page.goto(`/compare/${slug}`)

      const glance = page.getByRole('table', { name: /at a glance/ })
      await expect(glance.getByRole('rowheader', { name: 'Choose it if' })).toBeVisible()
      await expect(glance.getByRole('rowheader', { name: 'Price' })).toBeVisible()
      await expect(glance).toContainText('$24/month')
      const order = await page.locator('main').evaluate((main) => {
        const text = main.textContent ?? ''
        const firstMedia = main.querySelector('img, video, figure')
        return {
          glance: text.indexOf('at a glance'),
          differs: text.indexOf('What differs'),
          jobs: text.indexOf('Job by job'),
          mediaAfterJobs: !!firstMedia && !!main.querySelector('#comparison')
            && (main.querySelector('#comparison')!.compareDocumentPosition(firstMedia) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
        }
      })
      expect(order.glance).toBeGreaterThan(-1)
      expect(order.glance).toBeLessThan(order.differs)
      expect(order.differs).toBeLessThan(order.jobs)
      expect(order.mediaAfterJobs).toBe(true)

      const graph = await page.locator('script[type="application/ld+json"]').allTextContents()
      const webPage = graph.map((json) => JSON.parse(json)).find((entry) => entry['@type'] === 'WebPage')
      expect(webPage?.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(webPage?.about?.[0]?.offers?.map((offer: { price: string }) => offer.price)).toEqual(['24', '99'])

      const twin = await (await request.get(`/compare/${slug}.md`)).text()
      expect(twin).not.toContain('{tools}')
      expect(twin).toMatch(/\| Editing from your own ChatGPT or Claude \| \*\*The whole editor, \d+ tools\.\*\*/)
      const at = (needle: string) => twin.indexOf(needle)
      expect(at('## Short answer')).toBeGreaterThan(-1)
      expect(at('## Short answer')).toBeLessThan(at('| Price |'))
      expect(at('| Price |')).toBeLessThan(at('## What differs'))
      expect(at('## What differs')).toBeLessThan(at('## Job by job'))
    })
  }
})
