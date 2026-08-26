import { test, expect } from '@playwright/test'

// Pricing-section truth: every claim here must be live product behavior, and
// both public-plan CTAs must carry their durable key into signup and Billing.
test.describe('pricing section', () => {
  test('Creator and Producer CTAs carry their plan params', async ({ page }) => {
    await page.goto('/')
    const pricing = page.locator('#pricing')

    const creatorCta = pricing.getByRole('link', { name: /Start my 7-day trial/ })
    await expect(creatorCta).toBeVisible()
    expect(await creatorCta.getAttribute('href')).toContain('plan=clip')

    const producerCta = pricing.getByRole('link', { name: /Choose Producer/ })
    await expect(producerCta).toBeVisible()
    expect(await producerCta.getAttribute('href')).toContain('plan=pro')

    await expect(pricing.getByRole('link', { name: /Start free/ })).toHaveCount(0)
  })

  test('paid campaign attribution survives the marketing-to-app handoff', async ({ page }) => {
    await page.goto('/?utm_source=google&utm_medium=cpc&utm_campaign=clip_launch&utm_content=ad_a&gclid=audit-click-id')

    const heroCta = page.getByRole('link', { name: /Start my 7-day trial/ }).first()
    // The static HTML intentionally carries the unattributed fallback. Wait for
    // Nuxt to own the route query before asserting the client-side handoff.
    await expect(heroCta).toHaveAttribute('href', /utm_source=google/)
    const initialUrl = new URL(String(await heroCta.getAttribute('href')))
    expect(initialUrl.searchParams.get('utm_source')).toBe('google')
    expect(initialUrl.searchParams.get('utm_medium')).toBe('cpc')
    expect(initialUrl.searchParams.get('utm_campaign')).toBe('clip_launch')
    expect(initialUrl.searchParams.get('utm_content')).toBe('ad_a')
    expect(initialUrl.searchParams.get('gclid')).toBe('audit-click-id')
    expect(initialUrl.searchParams.get('plan')).toBe('clip')
    expect(initialUrl.searchParams.get('bc_surface')).toBe('homepage')
    expect(initialUrl.searchParams.get('bc_stage')).toBe('hero')
  })

  test('the page makes no deferred or unbuilt pricing claims', async ({ page }) => {
    await page.goto('/')
    const pricingText = await page.locator('#pricing').innerText()

    expect(pricingText).not.toContain('/year')
    expect(pricingText).not.toContain('4K')
    expect(pricingText).not.toContain('Add 5 more hours')
    expect(pricingText).not.toContain('annual')
    expect(pricingText).not.toContain('30-day refund')

    expect(pricingText).not.toContain('$9/month')
    expect(pricingText).not.toContain('Free')
    expect(pricingText).toContain('7 days')
    expect(pricingText).toContain('$24/month')
    expect(pricingText).toContain('$99')
    expect(pricingText).toContain('Card required; $0 due today')
    expect(pricingText).toContain('One recording up to 2 hours')
    expect(pricingText).toContain('$5 of agent work for analysis, First Cut, and direction')
    expect(pricingText).toContain('Keep asking and revising while balance remains')
    expect(pricingText).toContain('Watermarked exports during the trial')
    expect(pricingText).toContain('10 source-footage hours · $10 included agent work')
    expect(pricingText).toContain('Clean exports · files up to 4 GB')
    expect(pricingText).toContain('Top up exactly $20, $50, or $100 of agent work while active')
    expect(pricingText).toContain('40 source-footage hours per billing period')
    expect(pricingText).toContain('$40 included agent work')
    expect(pricingText).toContain('Clean exports · files up to 20 GB')
    expect(pricingText).toContain('Priority rendering · exact $20/$50/$100 top-ups')
    expect(pricingText).toContain('Once your payment method is accepted and the trial starts, Billing shows your exact cancel-before time')
    // The buyer never meets the internal payments layer: the redirect is Stripe-hosted.
    expect(pricingText).not.toContain('Bitter Checkout')
    expect(pricingText).toContain('Top-ups are available during an active trial or paid plan and never auto-activate paid Creator')
    expect(pricingText).toContain('early activation requires a separate explicit $24 authorization')
    expect(pricingText).not.toContain('one revised cut')
    expect(pricingText).not.toContain('proof export')
    expect(pricingText).not.toContain('agent balance')
    expect(pricingText).not.toContain('your exact charge date')
    expect(pricingText).not.toContain('displayed trial end')
    expect(pricingText).not.toContain('30%')
    expect(pricingText).not.toContain('service fee')
  })

  test('keeps both public plans usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/#pricing')

    const pricing = page.locator('#pricing')
    await expect(pricing.getByRole('link', { name: /Start my 7-day trial/ })).toBeVisible()
    await pricing.getByRole('link', { name: /Choose Producer/ }).scrollIntoViewIfNeeded()
    await expect(pricing.getByRole('link', { name: /Choose Producer/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test('keeps the pricing anchor stable while deferred media loads', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const editorImage = page.locator('#how img')
    const reservedBox = await editorImage.boundingBox()
    expect(reservedBox).not.toBeNull()
    expect(reservedBox!.width / reservedBox!.height).toBeCloseTo(2720 / 1480, 2)

    await page.getByLabel('Primary').getByRole('link', { name: 'Pricing' }).click()
    await expect(editorImage).toHaveAttribute('src', /sizzle-editor-2\.webp/)
    await expect.poll(async () => {
      const top = await page.locator('#pricing').evaluate((element) => element.getBoundingClientRect().top)
      return Math.round(top)
    }).toBe(112)

    const loadedBox = await editorImage.boundingBox()
    expect(loadedBox).not.toBeNull()
    expect(Math.abs(loadedBox!.height - reservedBox!.height)).toBeLessThanOrEqual(1)
  })
})
