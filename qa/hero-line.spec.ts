import { expect, test } from '@playwright/test'

/**
 * The hero line's invariants, asserted.
 *
 * Every serious defect in this illustration has been a geometry or direction
 * error that a still could not show and a person could not see — the film
 * running backwards in time, every frame inverted, the title landing from
 * below, the ribbon folding through itself at one viewport and not another.
 * `window.__lineProbe` has recorded the numbers that would have caught them for
 * a while; this is the part that makes a regression fail rather than merely be
 * recorded.
 *
 * The prototype lives at `/lab/line` and is deliberately unlinked, so these
 * tests address it directly.
 */

type Probe = {
  t: number
  zMargin: number
  zAmp: number
  amp: number
  rollAmp: number
  headingZ: number
  cards: { key: string; x: number; y: number; p: number; e: number }[]
}

const readProbe = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __lineProbe: Probe }).__lineProbe)

/** Widths that have historically produced different geometry decisions. */
const VIEWPORTS = [
  { width: 1800, height: 1000 },
  { width: 1440, height: 900 },
  { width: 1200, height: 760 },
  { width: 1000, height: 780 },
  { width: 760, height: 900 },
]

test.describe('hero line', () => {
  for (const viewport of VIEWPORTS) {
    test(`ribbon never folds through itself at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))

      await page.goto('/lab/line')
      await expect(page.locator('canvas')).toHaveCount(1)
      await page.waitForFunction(() => Boolean((window as any).__lineProbe?.zAmp))

      const probe = await readProbe(page)

      // The signed area of every sliver keeps one sign, normalised by the
      // ribbon's width. Below zero the film is passing through itself.
      expect(probe.zMargin, 'sliver area margin').toBeGreaterThan(0)
      // The guard is allowed to reduce these, but never to nothing — that would
      // mean the geometry has been solved by deleting the picture.
      expect(probe.amp, 'wave amplitude survived the guard').toBeGreaterThan(0)
      expect(probe.zAmp, 'depth sweep survived the guard').toBeGreaterThan(0)
      expect(probe.rollAmp, 'roll survived the guard').toBeGreaterThan(0)

      // ELASTICITY. Two foreshortenings act on the ribbon: across it (the
      // roll), which reads as a twist and is wanted, and along it (the
      // heading), which compresses frames while leaving the width alone and
      // reads as rubber. Measured before this bound existed, the tangent
      // reached 0.838 of the view direction and the frame-to-width ratio swung
      // 2.05x along one piece of film.
      expect(probe.headingZ, 'line heads away from the picture plane').toBeLessThanOrEqual(0.35)

      expect(errors, 'console errors').toEqual([])
    })
  }

  test('files fall into the hopper, and the belt advances', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 760 })
    await page.clock.install({ time: 0 })
    await page.goto('/lab/line')
    await page.waitForFunction(() => Boolean((window as any).__lineProbe?.zAmp))

    const samples: Probe[] = []
    for (let i = 0; i < 4; i++) {
      await page.clock.runFor(300)
      samples.push(await readProbe(page))
    }

    // Time advances under the mocked clock at all.
    expect(samples[3].t).toBeGreaterThan(samples[0].t)

    // A file DESCENDS into the hopper. The intake used to fly in horizontally
    // and this assertion checked x; the machine now pours from above, so the
    // invariant is that y increases. Direction bugs in this drawing have always
    // been sign errors, and a still cannot show a sign.
    const track = (key: string) =>
      samples.map((s) => s.cards.find((c) => c.key === key)).filter(Boolean) as Probe['cards']
    const f0 = track('f0')
    expect(f0.length, 'card telemetry present').toBeGreaterThan(1)
    let descended = 0
    for (let i = 1; i < f0.length; i++) {
      // Ignore the wrap, where the card restarts its run above the mouth.
      if (f0[i].p < f0[i - 1].p) continue
      expect(f0[i].y, 'file falls toward the hopper').toBeGreaterThanOrEqual(f0[i - 1].y - 0.5)
      descended++
    }
    expect(descended, 'at least one non-wrapping step observed').toBeGreaterThan(0)
  })

  test('stays out of the sitemap and the generated surfaces', async ({ page }) => {
    const sitemap = await page.request.get('/sitemap.xml')
    expect(sitemap.ok()).toBeTruthy()
    expect(await sitemap.text()).not.toContain('/lab/line')

    await page.goto('/lab/line')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})
