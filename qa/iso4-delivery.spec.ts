import { expect, test, type Page } from '@playwright/test'
import { resolve } from 'node:path'
import {
  iso4Release,
  iso4ReleaseReady,
  iso4ManifestIsReady,
  ISO4_RELEASE_VARIANT_CONTRACTS,
  type Iso4ReleaseVariant,
} from '../app/lib/hero-iso4/release'

const TEST_ORIGIN = 'http://127.0.0.1:4179/'
const VIDEO_FIXTURE = resolve(process.cwd(), 'public/clips/ep1-loop.mp4')
const POSTER_FIXTURE = resolve(process.cwd(), 'public/images/hero/iso4-prepaint-wide.webp')
const SCENE_SENTINELS = [
  'prepareRelease must complete before renderFrame',
  '/clips/ep1-loop.mp4',
]
const RESPONSIVE_BOUNDARY_CASES = [
  { width: 1600, height: 1200, expectedKey: 'tall', label: '4:3' },
  { width: 1601, height: 1200, expectedKey: 'classic', label: 'above 4:3' },
  { width: 1500, height: 1000, expectedKey: 'classic', label: '3:2' },
  { width: 1501, height: 1000, expectedKey: 'standard', label: 'above 3:2' },
  { width: 1700, height: 1000, expectedKey: 'standard', label: '17:10' },
  { width: 1701, height: 1000, expectedKey: 'wide-band', label: 'above 17:10' },
] as const

const artifactUrl = (url: string) => new URL(url, TEST_ORIGIN).href

interface ArtifactHarness {
  releaseVideo(): void
  openingPosterRequests: string[]
  terminalPosterRequests: string[]
  videoRequests: string[]
}

async function routeArtifactFixtures(
  page: Page,
  gateVideo = false,
  options: { failTerminal?: boolean } = {},
): Promise<ArtifactHarness> {
  const videoUrls = new Set(iso4Release.variants.map((variant) => artifactUrl(variant.mp4Url)))
  const openingPosterUrls = new Set(iso4Release.variants.map((variant) => (
    artifactUrl(variant.openingPosterUrl)
  )))
  const terminalPosterUrls = new Set(iso4Release.variants.map((variant) => (
    artifactUrl(variant.terminalPosterUrl)
  )))
  const posterUrls = new Set([...openingPosterUrls, ...terminalPosterUrls])
  const allUrls = new Set([...videoUrls, ...posterUrls])
  const openingPosterRequests: string[] = []
  const terminalPosterRequests: string[] = []
  const videoRequests: string[] = []
  let openGate = () => {}
  const videoGate = gateVideo
    ? new Promise<void>((resolveGate) => { openGate = resolveGate })
    : Promise.resolve()

  await page.route((url) => allUrls.has(url.href), async (route) => {
    const url = route.request().url()
    if (videoUrls.has(url)) {
      videoRequests.push(url)
      await videoGate
      await route.fulfill({
        status: 200,
        contentType: 'video/mp4',
        path: VIDEO_FIXTURE,
      })
      return
    }
    if (options.failTerminal && terminalPosterUrls.has(url)) {
      terminalPosterRequests.push(url)
      await route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing terminal poster' })
      return
    }
    if (openingPosterUrls.has(url)) openingPosterRequests.push(url)
    if (terminalPosterUrls.has(url)) terminalPosterRequests.push(url)
    await route.fulfill({
      status: 200,
      contentType: 'image/webp',
      path: POSTER_FIXTURE,
    })
  })

  return {
    releaseVideo: openGate,
    openingPosterRequests,
    terminalPosterRequests,
    videoRequests,
  }
}

async function instrumentMedia(
  page: Page,
  options: { denyPlay?: boolean, visibilityShim?: boolean, disableFrameCallback?: boolean } = {},
) {
  await page.addInitScript(({ denyPlay, visibilityShim, disableFrameCallback }) => {
    const state = globalThis as typeof globalThis & {
      __isoMediaEvents?: Array<Record<string, unknown>>
      __isoTestHidden?: boolean | null
      __setIsoTestHidden?: (hidden: boolean) => void
    }
    const events: Array<Record<string, unknown>> = []
    state.__isoMediaEvents = events
    const originalLoad = HTMLMediaElement.prototype.load
    const originalPause = HTMLMediaElement.prototype.pause
    const originalPlay = HTMLMediaElement.prototype.play
    const originalFrameCallback = HTMLVideoElement.prototype.requestVideoFrameCallback
    if (disableFrameCallback) {
      Object.defineProperty(HTMLVideoElement.prototype, 'requestVideoFrameCallback', {
        configurable: true,
        value: undefined,
      })
    }

    HTMLMediaElement.prototype.load = function load() {
      events.push({
        type: 'load',
        hasSrc: this.hasAttribute('src'),
        src: this.getAttribute('src'),
      })
      return originalLoad.call(this)
    }
    HTMLMediaElement.prototype.pause = function pause() {
      events.push({ type: 'pause', currentTime: this.currentTime })
      return originalPause.call(this)
    }
    HTMLMediaElement.prototype.play = function play() {
      if (denyPlay) {
        events.push({ type: 'play-denied', currentTime: this.currentTime })
        return Promise.reject(new DOMException('test autoplay denial', 'NotAllowedError'))
      }
      events.push({ type: 'play', currentTime: this.currentTime })
      return originalPlay.call(this)
    }
    if (originalFrameCallback && !disableFrameCallback) {
      HTMLVideoElement.prototype.requestVideoFrameCallback = function requestVideoFrameCallback(callback) {
        return originalFrameCallback.call(this, (now, metadata) => {
          events.push({
            type: 'presented-frame',
            currentTime: this.currentTime,
            mediaTime: metadata.mediaTime,
          })
          callback(now, metadata)
        })
      }
    }

    if (visibilityShim) {
      const nativeHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')?.get
      state.__isoTestHidden = null
      Object.defineProperty(Document.prototype, 'hidden', {
        configurable: true,
        get() {
          return state.__isoTestHidden ?? nativeHidden?.call(this) ?? false
        },
      })
      state.__setIsoTestHidden = (hidden: boolean) => {
        state.__isoTestHidden = hidden
        document.dispatchEvent(new Event('visibilitychange'))
      }
    }
  }, options)
}

async function selectedVariant(page: Page): Promise<Iso4ReleaseVariant> {
  return await page.evaluate((variants) => (
    variants.find((variant) => window.matchMedia(variant.media).matches)
    ?? variants.at(-1)!
  ), iso4Release.variants)
}

async function beginPhaseRecording(page: Page) {
  await page.evaluate(() => {
    const state = globalThis as typeof globalThis & {
      __isoDeliveryPhases?: string[]
      __isoDeliveryObserver?: MutationObserver
    }
    const host = document.querySelector<HTMLElement>('.iso4')
    if (!host) throw new Error('ISO4 host is unavailable')
    state.__isoDeliveryPhases = [host.dataset.iso4Phase ?? 'missing']
    state.__isoDeliveryObserver = new MutationObserver(() => {
      const phase = host.dataset.iso4Phase ?? 'missing'
      if (state.__isoDeliveryPhases?.at(-1) !== phase) state.__isoDeliveryPhases?.push(phase)
    })
    state.__isoDeliveryObserver.observe(host, {
      attributes: true,
      attributeFilter: ['data-iso4-phase'],
    })
  })
}

async function mediaEvents(page: Page) {
  return await page.evaluate(() => (
    (globalThis as typeof globalThis & { __isoMediaEvents?: Array<Record<string, unknown>> })
      .__isoMediaEvents ?? []
  ))
}

function unique(values: string[]) {
  return [...new Set(values)]
}

test.describe('ISO4 production delivery shell', () => {
  test.skip(
    !iso4ReleaseReady,
    'requires a published ISO4 release manifest and a freshly generated production fixture',
  )
  test.use({ viewport: { width: 1600, height: 900 } })

  test('manifest describes the accepted terminal hold and immutable variants', () => {
    expect(iso4Release.fps).toBe(60)
    expect(iso4Release.sceneDurationMs).toBe(14_008)
    expect(iso4Release.frameCount).toBe(862)
    expect(iso4Release.terminalFrame).toBe(841)
    expect(iso4Release.durationMs).toBe(14_367)
    expect(iso4ManifestIsReady(iso4Release)).toBe(true)
    expect(iso4Release.variants.length).toBe(ISO4_RELEASE_VARIANT_CONTRACTS.length)
    const urls: string[] = []
    for (let index = 0; index < iso4Release.variants.length; index++) {
      const variant = iso4Release.variants[index]!
      const expected = ISO4_RELEASE_VARIANT_CONTRACTS[index]!
      expect({
        key: variant.key,
        media: variant.media,
        width: variant.width,
        height: variant.height,
      }).toEqual(expected)
      expect(variant.mp4Bytes).toBeGreaterThan(0)
      expect(variant.mp4Sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(variant.openingPosterSha256).toMatch(/^[a-f0-9]{64}$/)
      expect(variant.terminalPosterSha256).toMatch(/^[a-f0-9]{64}$/)
      for (const value of [variant.mp4Url, variant.openingPosterUrl, variant.terminalPosterUrl]) {
        const url = new URL(value)
        expect(url.protocol).toBe('https:')
        expect(url.search).toBe('')
        expect(url.hash).toBe('')
        expect(url.pathname.split('/')).toContain(iso4Release.definitionFingerprint)
        expect(url.pathname.toLowerCase()).not.toContain('/latest')
        urls.push(value)
      }
    }
    expect(unique(urls)).toHaveLength(urls.length)
  })

  test('reduced-motion SSR paints the terminal source before hydration', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      reducedMotion: 'reduce',
      viewport: { width: 1600, height: 900 },
    })
    const page = await context.newPage()
    try {
      const artifacts = await routeArtifactFixtures(page)
      const expected = iso4Release.variants.find((variant) => variant.key === 'wide-band')!
      await page.goto(TEST_ORIGIN, { waitUntil: 'load' })

      await expect(page.locator('.iso4')).toHaveAttribute('data-iso4-phase', 'opening')
      await expect(page.locator(
        `picture.iso4__prepaint source[media*="prefers-reduced-motion: reduce"][srcset="${expected.terminalPosterUrl}"]`,
      )).toHaveCount(1)
      expect(await page.locator('picture.iso4__prepaint img').evaluate((image) => image.currentSrc)).toBe(
        artifactUrl(expected.terminalPosterUrl),
      )
      expect(artifacts.openingPosterRequests).toEqual([])
      expect(unique(artifacts.terminalPosterRequests)).toEqual([
        artifactUrl(expected.terminalPosterUrl),
      ])
      expect(artifacts.videoRequests).toEqual([])
    } finally {
      await context.close()
    }
  })

  for (const targetPhase of ['handoff', 'playing'] as const) {
    test(`a reduced-motion change during ${targetPhase} settles on the terminal poster`, async ({ page }) => {
      await instrumentMedia(page)
      const artifacts = await routeArtifactFixtures(page, true)
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      const host = page.locator('.iso4')
      await beginPhaseRecording(page)
      artifacts.releaseVideo()
      await expect(host).toHaveAttribute('data-iso4-phase', 'handoff')
      if (targetPhase === 'playing') {
        await expect(host).toHaveAttribute('data-iso4-phase', 'playing')
      }

      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(host).toHaveAttribute('data-iso4-phase', 'terminal')
      await expect(page.locator('picture.iso4__poster--terminal img')).toBeVisible()
      await expect(page.locator('video.iso4__video')).toHaveCount(0, { timeout: 2_000 })

      const expected = await selectedVariant(page)
      expect(unique(artifacts.terminalPosterRequests)).toEqual([
        artifactUrl(expected.terminalPosterUrl),
      ])
      expect(await page.evaluate(() => (
        (globalThis as typeof globalThis & { __isoDeliveryPhases?: string[] })
          .__isoDeliveryPhases ?? []
      ))).not.toContain('terminal-video')
    })
  }

  for (const boundary of RESPONSIVE_BOUNDARY_CASES) {
    test(`preloads one poster and selects one video at ${boundary.label}`, async ({ page }) => {
      await page.setViewportSize({ width: boundary.width, height: boundary.height })
      const artifacts = await routeArtifactFixtures(page, true)
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      const expected = iso4Release.variants.find((variant) => variant.key === boundary.expectedKey)!
      const video = page.locator('video.iso4__video')

      await expect(video).toHaveAttribute('src', expected.mp4Url)
      await expect.poll(() => unique(artifacts.openingPosterRequests)).toEqual([
        artifactUrl(expected.openingPosterUrl),
      ])
      await expect.poll(() => unique(artifacts.videoRequests)).toEqual([
        artifactUrl(expected.mp4Url),
      ])
      expect(artifacts.terminalPosterRequests).toEqual([])
      expect(await page.locator('link[rel="preload"][as="image"]').evaluateAll((links) => (
        links
          .filter((link) => window.matchMedia((link as HTMLLinkElement).media).matches)
          .map((link) => (link as HTMLLinkElement).href)
      ))).toEqual([artifactUrl(expected.openingPosterUrl)])

      artifacts.releaseVideo()
      await expect.poll(() => video.evaluate((element) => element.readyState)).toBeGreaterThanOrEqual(2)
    })
  }

  test('hands opening poster to one non-looping video, then to the terminal poster and releases the decoder', async ({ page }) => {
    test.setTimeout(25_000)
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    await instrumentMedia(page)
    const artifacts = await routeArtifactFixtures(page, true)
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const host = page.locator('.iso4')
    const opening = page.locator('.iso4__poster--opening')
    const video = page.locator('video.iso4__video')
    await expect(host).toHaveAttribute('data-iso4-mode', 'video')
    await expect(host).toHaveAttribute('data-iso4-phase', 'opening')
    await expect(opening).toHaveCSS('opacity', '1')
    await expect(video).toHaveCount(1)
    await expect(video).toHaveCSS('opacity', '0')
    await expect(page.locator('.iso4__poster--terminal')).toHaveCount(0)
    await expect(page.locator('canvas.iso4__gl')).toHaveCount(0)
    expect(await page.evaluate(() => Boolean((globalThis as { __iso?: unknown }).__iso))).toBe(false)

    const expected = await selectedVariant(page)
    await expect.poll(() => unique(artifacts.openingPosterRequests)).toEqual([
      artifactUrl(expected.openingPosterUrl),
    ])
    expect(artifacts.terminalPosterRequests).toEqual([])
    await beginPhaseRecording(page)
    await page.evaluate(() => {
      const state = globalThis as typeof globalThis & {
        __isoHandoffMediaTime?: number
        __isoHandoffPresentedMediaTime?: number
        __isoMediaEvents?: Array<Record<string, unknown>>
      }
      const host = document.querySelector<HTMLElement>('.iso4')
      const observer = new MutationObserver(() => {
        if (host?.dataset.iso4Phase !== 'handoff') return
        state.__isoHandoffMediaTime = document.querySelector<HTMLVideoElement>('video.iso4__video')?.currentTime
        const lastPresented = state.__isoMediaEvents
          ?.filter((event) => event.type === 'presented-frame')
          .at(-1)
        state.__isoHandoffPresentedMediaTime = Number(lastPresented?.mediaTime)
        observer.disconnect()
      })
      if (host) observer.observe(host, { attributes: true, attributeFilter: ['data-iso4-phase'] })
    })
    artifacts.releaseVideo()
    await expect(host).toHaveAttribute('data-iso4-phase', 'playing', { timeout: 5_000 })
    expect(await page.evaluate(() => (
      (globalThis as typeof globalThis & { __isoHandoffMediaTime?: number }).__isoHandoffMediaTime
    ))).toBeLessThanOrEqual(1 / 120)
    expect(await page.evaluate(() => (
      (globalThis as typeof globalThis & { __isoHandoffPresentedMediaTime?: number })
        .__isoHandoffPresentedMediaTime
    ))).toBeLessThanOrEqual(1 / 120)
    await expect(opening).toHaveCSS('opacity', '0')
    await expect(video).toHaveCSS('opacity', '1')
    expect(await video.evaluate((element) => ({
      currentSrc: element.currentSrc,
      loop: element.loop,
      muted: element.muted,
      playsInline: element.playsInline,
    }))).toEqual({
      currentSrc: artifactUrl(expected.mp4Url),
      loop: false,
      muted: true,
      playsInline: true,
    })
    expect(artifacts.terminalPosterRequests).toEqual([])

    await page.evaluate(() => {
      const state = globalThis as typeof globalThis & { __isoVideoFadeEndOpacity?: string }
      const deliveryVideo = document.querySelector<HTMLVideoElement>('video.iso4__video')
      deliveryVideo?.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'opacity') {
          state.__isoVideoFadeEndOpacity = getComputedStyle(deliveryVideo).opacity
        }
      }, { once: true })
    })
    await video.evaluate((element) => { element.playbackRate = 16 })
    await expect(host).toHaveAttribute('data-iso4-phase', 'terminal', { timeout: 5_000 })
    const terminal = page.locator('.iso4__poster--terminal')
    await expect(terminal).toHaveCSS('opacity', '1')
    await expect.poll(() => page.evaluate(() => (
      (globalThis as typeof globalThis & { __isoVideoFadeEndOpacity?: string })
        .__isoVideoFadeEndOpacity
    ))).toBe('0')
    expect(await terminal.locator('img').evaluate((image) => image.currentSrc)).toBe(
      artifactUrl(expected.terminalPosterUrl),
    )
    expect(await page.evaluate(() => (
      (globalThis as typeof globalThis & { __isoDeliveryPhases?: string[] }).__isoDeliveryPhases
    ))).toEqual(['opening', 'handoff', 'playing', 'terminal'])

    await expect(video).toHaveCount(0, { timeout: 2_000 })
    expect((await mediaEvents(page)).some((event) => (
      event.type === 'load' && event.hasSrc === false
    ))).toBe(true)
    expect(unique(artifacts.terminalPosterRequests)).toEqual([
      artifactUrl(expected.terminalPosterUrl),
    ])
    expect(unique(artifacts.videoRequests)).toEqual([artifactUrl(expected.mp4Url)])
  })

  test('older Safari without video-frame callbacks still hands off from encoded frame zero', async ({ page }) => {
    await instrumentMedia(page, { disableFrameCallback: true })
    const artifacts = await routeArtifactFixtures(page, true)
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const host = page.locator('.iso4')
    const video = page.locator('video.iso4__video')
    await expect(host).toHaveAttribute('data-iso4-phase', 'opening')
    await page.evaluate(() => {
      const state = globalThis as typeof globalThis & { __isoFallbackHandoffMediaTime?: number }
      const hero = document.querySelector<HTMLElement>('.iso4')
      const observer = new MutationObserver(() => {
        if (hero?.dataset.iso4Phase !== 'handoff') return
        state.__isoFallbackHandoffMediaTime = document.querySelector<HTMLVideoElement>('video.iso4__video')?.currentTime
        observer.disconnect()
      })
      if (hero) observer.observe(hero, { attributes: true, attributeFilter: ['data-iso4-phase'] })
    })
    artifacts.releaseVideo()
    await expect.poll(() => video.evaluate((element) => element.readyState)).toBeGreaterThanOrEqual(2)
    await video.dispatchEvent('loadeddata')
    await expect(host).toHaveAttribute('data-iso4-phase', 'playing', { timeout: 5_000 })
    expect(await page.evaluate(() => (
      (globalThis as typeof globalThis & { __isoFallbackHandoffMediaTime?: number })
        .__isoFallbackHandoffMediaTime
    ))).toBeLessThanOrEqual(1 / 120)
    expect((await mediaEvents(page)).some((event) => event.type === 'presented-frame')).toBe(false)
  })

  test('the ended video retains pixel ownership until the mounted terminal layer decodes', async ({ page }) => {
    test.setTimeout(15_000)
    await page.addInitScript(() => {
      const state = globalThis as typeof globalThis & {
        __terminalDecodeReached?: boolean
        __releaseTerminalDecode?: () => void
      }
      const originalDecode = HTMLImageElement.prototype.decode
      let releaseGate = () => {}
      const gate = new Promise<void>((resolve) => { releaseGate = resolve })
      state.__releaseTerminalDecode = releaseGate
      HTMLImageElement.prototype.decode = async function decode() {
        if (this.closest('.iso4__poster--terminal')) {
          state.__terminalDecodeReached = true
          await gate
        }
        return await originalDecode.call(this)
      }
    })
    const artifacts = await routeArtifactFixtures(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const host = page.locator('.iso4')
    const video = page.locator('video.iso4__video')
    await expect(host).toHaveAttribute('data-iso4-phase', 'playing')

    await video.evaluate(async (element) => {
      const ended = new Promise<void>((resolve) => (
        element.addEventListener('ended', () => resolve(), { once: true })
      ))
      element.playbackRate = 16
      await ended
    })
    await expect.poll(() => page.evaluate(() => Boolean(
      (globalThis as typeof globalThis & { __terminalDecodeReached?: boolean })
        .__terminalDecodeReached,
    ))).toBe(true)
    await expect(host).toHaveAttribute('data-iso4-phase', 'playing')
    await expect(video).toHaveCount(1)

    await page.evaluate(() => (
      globalThis as typeof globalThis & { __releaseTerminalDecode?: () => void }
    ).__releaseTerminalDecode?.())
    await expect(host).toHaveAttribute('data-iso4-phase', 'terminal')
    await expect(page.locator('picture.iso4__poster--terminal img')).toBeVisible()
    await expect(video).toHaveCount(0, { timeout: 2_000 })
    expect(unique(artifacts.videoRequests)).toHaveLength(1)
  })

  test('terminal poster failure holds the ended video frame without restarting or releasing its decoder', async ({ page }) => {
    test.setTimeout(15_000)
    await instrumentMedia(page)
    const artifacts = await routeArtifactFixtures(page, false, { failTerminal: true })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const host = page.locator('.iso4')
    const opening = page.locator('.iso4__poster--opening')
    const video = page.locator('video.iso4__video')
    await expect(host).toHaveAttribute('data-iso4-phase', 'playing', { timeout: 5_000 })
    await beginPhaseRecording(page)
    await video.evaluate((element) => { element.playbackRate = 16 })

    await expect(host).toHaveAttribute('data-iso4-phase', 'terminal-video', { timeout: 5_000 })
    await expect(opening).toHaveCSS('opacity', '0')
    await expect(video).toHaveCSS('opacity', '1')
    await expect(page.locator('.iso4__poster--terminal')).toHaveCount(0)
    expect(await video.evaluate((element) => ({
      ended: element.ended,
      paused: element.paused,
    }))).toEqual({ ended: true, paused: true })

    const retainedSrc = await video.evaluate((element) => element.currentSrc)
    await page.waitForTimeout(600)
    await expect(video).toHaveCount(1)
    expect(await video.evaluate((element) => element.currentSrc)).toBe(retainedSrc)
    expect((await mediaEvents(page)).some((event) => (
      event.type === 'load' && event.hasSrc === false
    ))).toBe(false)
    expect(await page.evaluate(() => (
      (globalThis as typeof globalThis & { __isoDeliveryPhases?: string[] }).__isoDeliveryPhases
    ))).toEqual(['playing', 'terminal-video'])
    expect(unique(artifacts.videoRequests)).toHaveLength(1)
  })

  test('reduced motion resolves directly to the terminal poster without requesting video', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const artifacts = await routeArtifactFixtures(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const expected = await selectedVariant(page)
    const host = page.locator('.iso4')

    await expect(host).toHaveAttribute('data-iso4-mode', 'video')
    await expect(host).toHaveAttribute('data-iso4-phase', 'terminal')
    await expect(page.locator('.iso4__poster--terminal')).toHaveCSS('opacity', '1')
    expect(await page.locator('.iso4__poster--terminal img').evaluate((image) => image.currentSrc)).toBe(
      artifactUrl(expected.terminalPosterUrl),
    )
    await expect(page.locator('video.iso4__video')).toHaveCount(0)
    await expect(page.locator('canvas.iso4__gl')).toHaveCount(0)
    expect(artifacts.openingPosterRequests).toEqual([])
    expect(unique(artifacts.terminalPosterRequests)).toEqual([
      artifactUrl(expected.terminalPosterUrl),
    ])
    expect(artifacts.videoRequests).toEqual([])
    expect(await page.evaluate(() => Boolean((globalThis as { __iso?: unknown }).__iso))).toBe(false)
  })

  test('data saver preserves the immediate opening poster without requesting video', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'connection', {
        configurable: true,
        get: () => ({ saveData: true }),
      })
    })
    const artifacts = await routeArtifactFixtures(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const host = page.locator('.iso4')
    await expect(host).toHaveAttribute('data-iso4-mode', 'video')
    await expect(host).toHaveAttribute('data-iso4-phase', 'opening')
    await expect(page.locator('.iso4__poster--opening')).toHaveCSS('opacity', '1')
    await expect(page.locator('video.iso4__video')).toHaveCount(0)
    await expect(page.locator('canvas.iso4__gl')).toHaveCount(0)
    expect(artifacts.videoRequests).toEqual([])
  })

  test('autoplay denial keeps the opening poster and releases the unused decoder', async ({ page }) => {
    await instrumentMedia(page, { denyPlay: true })
    const artifacts = await routeArtifactFixtures(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const expected = await selectedVariant(page)
    const host = page.locator('.iso4')

    await expect.poll(async () => (
      (await mediaEvents(page)).some((event) => event.type === 'play-denied')
    )).toBe(true)
    await expect(host).toHaveAttribute('data-iso4-phase', 'opening')
    await expect(page.locator('.iso4__poster--opening')).toHaveCSS('opacity', '1')
    await expect(page.locator('.iso4__poster--terminal')).toHaveCount(0)
    await expect(page.locator('canvas.iso4__gl')).toHaveCount(0)
    await expect(page.locator('video.iso4__video')).toHaveCount(0, { timeout: 2_000 })
    expect((await mediaEvents(page)).some((event) => (
      event.type === 'load' && event.hasSrc === false
    ))).toBe(true)
    expect(unique(artifacts.videoRequests)).toEqual([artifactUrl(expected.mp4Url)])
  })

  test('offscreen and hidden playback pauses and resumes the same selected source', async ({ page }) => {
    test.setTimeout(15_000)
    await instrumentMedia(page, { visibilityShim: true })
    const artifacts = await routeArtifactFixtures(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const expected = await selectedVariant(page)
    const host = page.locator('.iso4')
    const video = page.locator('video.iso4__video')
    await expect(host).toHaveAttribute('data-iso4-phase', 'playing', { timeout: 5_000 })
    await video.evaluate((element) => { element.playbackRate = 0.5 })

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true)
    const offscreenTime = await video.evaluate((element) => element.currentTime)
    await page.waitForTimeout(250)
    expect(Math.abs(await video.evaluate((element) => element.currentTime) - offscreenTime)).toBeLessThan(0.04)

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false)
    await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(offscreenTime + 0.04)

    await page.evaluate(() => {
      (globalThis as typeof globalThis & { __setIsoTestHidden?: (hidden: boolean) => void })
        .__setIsoTestHidden?.(true)
    })
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true)
    const hiddenTime = await video.evaluate((element) => element.currentTime)
    await page.waitForTimeout(250)
    expect(Math.abs(await video.evaluate((element) => element.currentTime) - hiddenTime)).toBeLessThan(0.04)

    await page.evaluate(() => {
      (globalThis as typeof globalThis & { __setIsoTestHidden?: (hidden: boolean) => void })
        .__setIsoTestHidden?.(false)
    })
    await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false)
    await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(hiddenTime + 0.04)
    await expect(host).toHaveAttribute('data-iso4-phase', 'playing')
    expect(await video.evaluate((element) => element.currentSrc)).toBe(artifactUrl(expected.mp4Url))
    expect(unique(artifacts.videoRequests)).toEqual([artifactUrl(expected.mp4Url)])
  })

  test('development keeps local authoring prepaints while its video diagnostic uses the release', async ({ page }) => {
    const developmentOrigin = process.env.ISO4_DEV_ORIGIN
    test.skip(!developmentOrigin, 'set ISO4_DEV_ORIGIN to exercise the existing development server')
    if (!developmentOrigin) return

    const artifacts = await routeArtifactFixtures(page, true)
    await page.goto(new URL('/', developmentOrigin).href, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.iso4')).toHaveAttribute('data-iso4-mode', 'live')
    expect(await page.locator('picture.iso4__prepaint img').evaluate((image) => image.currentSrc)).toContain(
      '/images/hero/iso4-prepaint-wide.webp',
    )

    await page.goto(new URL('/?iso4Delivery=video', developmentOrigin).href, { waitUntil: 'domcontentloaded' })
    const expected = iso4Release.variants.find((variant) => variant.key === 'wide-band')!
    await expect(page.locator('.iso4')).toHaveAttribute('data-iso4-mode', 'video')
    await expect(page.locator('picture.iso4__prepaint img')).toHaveAttribute(
      'src',
      expected.openingPosterUrl,
    )
    await expect.poll(() => unique(artifacts.videoRequests)).toEqual([
      artifactUrl(expected.mp4Url),
    ])
    artifacts.releaseVideo()
  })

  test('production cannot request or activate the live Three.js scene', async ({ page }) => {
    const scriptBodies: Array<Promise<{ url: string, body: string } | null>> = []
    page.on('response', (response) => {
      if (response.request().resourceType() !== 'script') return
      scriptBodies.push(response.body()
        .then((body) => ({ url: response.url(), body: body.toString('utf8') }))
        .catch(() => null))
    })
    await routeArtifactFixtures(page)
    await page.goto('/?iso4Delivery=live', { waitUntil: 'load' })
    await page.waitForTimeout(300)

    const host = page.locator('.iso4')
    await expect(host).toHaveAttribute('data-iso4-mode', 'video')
    await expect(page.locator('canvas.iso4__gl')).toHaveCount(0)
    expect(await page.evaluate(() => Boolean((globalThis as { __iso?: unknown }).__iso))).toBe(false)
    const loadedScripts = (await Promise.all(scriptBodies)).filter((entry) => entry !== null)
    const sceneScripts = loadedScripts.filter((entry) => (
      SCENE_SENTINELS.some((sentinel) => entry.body.includes(sentinel))
    ))
    expect(sceneScripts.map((entry) => entry.url)).toEqual([])
  })
})
