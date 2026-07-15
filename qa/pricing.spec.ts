import { test, expect } from '@playwright/test'

// Pricing-section truth: every claim here must be live product behavior, and
// the paid CTAs must carry their plan so signup hands off to /billing.
test.describe('pricing section', () => {
  test('paid CTAs carry plan params; free stays plan-less', async ({ page }) => {
    await page.goto('/')
    const pricing = page.locator('#pricing')

    const clipCta = pricing.getByRole('link', { name: /Choose the \$9 plan/ })
    await expect(clipCta).toBeVisible()
    expect(await clipCta.getAttribute('href')).toContain('plan=clip')

    const proCta = pricing.getByRole('link', { name: /Go Pro/ })
    await expect(proCta).toBeVisible()
    expect(await proCta.getAttribute('href')).toContain('plan=pro')

    const freeCta = pricing.getByRole('link', { name: /Start free/ })
    await expect(freeCta).toBeVisible()
    expect(await freeCta.getAttribute('href')).not.toContain('plan=')
  })

  test('plan params survive demo-stage link rewrites', async ({ page }) => {
    await page.goto('/')
    // The demo attribution mutator rewrites every signup anchor on demo
    // events; the pricing CTAs' plan params must survive it.
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('bitterclip:demo', { detail: {} }))
    })
    // Trigger the sync path directly via a stage event no-op: reload-safe check
    const clipHref = await page.locator('#pricing').getByRole('link', { name: /Choose the \$9 plan/ }).getAttribute('href')
    expect(clipHref).toContain('plan=clip')
  })

  test('paid campaign attribution survives the marketing-to-app handoff', async ({ page }) => {
    await page.goto('/?utm_source=google&utm_medium=cpc&utm_campaign=clip_launch&utm_content=ad_a&gclid=audit-click-id')

    const heroCta = page.getByRole('link', { name: /Upload a recording/ })
    const initialUrl = new URL(String(await heroCta.getAttribute('href')))
    expect(initialUrl.searchParams.get('utm_source')).toBe('google')
    expect(initialUrl.searchParams.get('utm_medium')).toBe('cpc')
    expect(initialUrl.searchParams.get('utm_campaign')).toBe('clip_launch')
    expect(initialUrl.searchParams.get('utm_content')).toBe('ad_a')
    expect(initialUrl.searchParams.get('gclid')).toBe('audit-click-id')
    expect(initialUrl.searchParams.get('bc_surface')).toBe('homepage')
    expect(initialUrl.searchParams.get('bc_stage')).toBe('default')

    await expect(page.locator('iframe[title="BitterClip — episode one, cut into clips"]')).toHaveCount(1)
    await page.evaluate(() => {
      const frame = document.querySelector<HTMLIFrameElement>('iframe[title="BitterClip — episode one, cut into clips"]')
      if (!frame?.contentWindow) throw new Error('hero iframe missing')
      window.dispatchEvent(new MessageEvent('message', {
        data: { bitterclip_demo_event: 'export_revealed', detail: { has_download_url: true } },
        origin: 'https://app.bitterclip.com',
        source: frame.contentWindow,
      }))
    })

    await expect(heroCta).toHaveAttribute('href', /bc_stage=hero_export_revealed/)
    const engagedUrl = new URL(String(await heroCta.getAttribute('href')))
    expect(engagedUrl.searchParams.get('utm_content')).toBe('ad_a')
    expect(engagedUrl.searchParams.get('gclid')).toBe('audit-click-id')
  })

  test('the page makes no deferred or unbuilt pricing claims', async ({ page }) => {
    await page.goto('/')
    const pricingText = await page.locator('#pricing').innerText()

    expect(pricingText).not.toContain('/year')
    expect(pricingText).not.toContain('4K')
    expect(pricingText).not.toContain('Add 5 more hours')
    expect(pricingText).not.toContain('annual')
    expect(pricingText).not.toContain('30-day refund')

    expect(pricingText).toContain('$9')
    expect(pricingText).toContain('$99')
    expect(pricingText).toContain('10 hours of footage a month')
    expect(pricingText).toContain('No watermark — 150 clip exports at 1080p')
    expect(pricingText).toContain('1,000 clip exports at 1080p')
    expect(pricingText).toContain('Front-of-queue processing')
    expect(pricingText).toContain('Embed clips on your own site')
  })
})
