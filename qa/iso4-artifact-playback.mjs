#!/usr/bin/env node

/**
 * Cold-load and play-once acceptance harness for the production ISO4 Artifact.
 *
 * This script never starts a server and never substitutes fixture media. It
 * navigates an explicit homepage URL, records the poster -> video -> terminal
 * handoff, and writes all evidence below an explicit ignored tmp directory.
 *
 *   node qa/iso4-artifact-playback.mjs \
 *     --url https://bitterclip.com/ \
 *     --output tmp/iso4-homepage-workshop/artifact-delivery/playback-wide \
 *     --viewport 1600x900 --dpr 1
 *
 * Static fixture servers that cannot return byte ranges may opt out of that
 * one production assertion with `--range-policy allow-full`. Production and
 * immutable Artifact hosts should always use the default `require` policy.
 */

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium, webkit } from '@playwright/test'

const { values } = parseArgs({
  options: {
    url: { type: 'string', short: 'u' },
    output: { type: 'string', short: 'o' },
    viewport: { type: 'string', default: '1600x900' },
    dpr: { type: 'string', default: '1' },
    browser: { type: 'string', default: 'chromium' },
    'cpu-throttle': { type: 'string', default: '1' },
    'timeout-ms': { type: 'string', default: '45000' },
    'geometry-tolerance': { type: 'string', default: '0.5' },
    'max-handoff-media-time': { type: 'string', default: String(1 / 120) },
    'max-dropped-frames': { type: 'string', default: '0' },
    'max-long-task-ms': { type: 'string', default: '50' },
    'expected-duration': { type: 'string', default: '14.3666666667' },
    'duration-tolerance': { type: 'string', default: '0.02' },
    scenario: { type: 'string', default: 'normal' },
    'range-policy': { type: 'string', default: 'require' },
    headed: { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

const usage = `Usage:
  node qa/iso4-artifact-playback.mjs --url <homepage-url> --output <tmp-dir> [options]

Options:
  --viewport <width>x<height>     CSS viewport (default: 1600x900)
  --dpr <n>                      Device pixel ratio (default: 1)
  --browser chromium|webkit      Playback engine (default: chromium)
  --cpu-throttle <n>             Chromium CPU slowdown rate, 1-20 (default: 1)
  --timeout-ms <ms>              Whole cinematic timeout (default: 45000)
  --geometry-tolerance <px>      Maximum layer/host rect delta (default: 0.5)
  --max-handoff-media-time <s>   Latest permitted first handoff time (default: 1/120)
  --max-dropped-frames <n>       Decoded-frame drop ceiling (default: 0)
  --max-long-task-ms <ms>        Main-thread long-task ceiling (default: 50)
  --expected-duration <s>        Expected encoded duration (default: 14.3666666667)
  --duration-tolerance <s>       Duration tolerance (default: 0.02)
  --scenario <name>              normal (default), reduced-motion,
                                 autoplay-denied, visibility-resume, or
                                 offscreen-resume
  --range-policy require|allow-full
                                 Require Range + HTTP 206 by default. Use
                                 allow-full only for a known fixture server.
  --headed                       Run the selected browser visibly
  --force                        Replace this harness's prior evidence files
`

if (values.help) {
  console.log(usage)
  process.exit(0)
}
if (!values.url || !values.output) throw new Error(`--url and --output are required.\n\n${usage}`)

const target = new URL(values.url)
if (!['http:', 'https:'].includes(target.protocol)) throw new Error('--url must use http or https')

const viewportMatch = /^(\d+)x(\d+)$/.exec(values.viewport)
if (!viewportMatch) throw new Error('--viewport must be formatted as <width>x<height>')
const viewport = { width: Number(viewportMatch[1]), height: Number(viewportMatch[2]) }
if (viewport.width < 240 || viewport.height < 320 || viewport.width > 7680 || viewport.height > 4320) {
  throw new Error('--viewport dimensions are outside the supported 240x320 to 7680x4320 range')
}

const numberOption = (name, value, { min = 0, max = Number.POSITIVE_INFINITY } = {}) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`--${name} must be a finite number from ${min} to ${max}`)
  }
  return parsed
}

const dpr = numberOption('dpr', values.dpr, { min: 0.5, max: 4 })
const browserName = values.browser
if (!['chromium', 'webkit'].includes(browserName)) {
  throw new Error('--browser must be chromium or webkit')
}
const cpuThrottle = numberOption('cpu-throttle', values['cpu-throttle'], { min: 1, max: 20 })
if (browserName !== 'chromium' && cpuThrottle !== 1) {
  throw new Error('--cpu-throttle is available only with --browser chromium')
}
const timeoutMs = numberOption('timeout-ms', values['timeout-ms'], { min: 5_000, max: 180_000 })
const geometryTolerance = numberOption('geometry-tolerance', values['geometry-tolerance'], { min: 0, max: 8 })
const maxHandoffMediaTime = numberOption('max-handoff-media-time', values['max-handoff-media-time'], { min: 0, max: 1 })
const maxDroppedFrames = numberOption('max-dropped-frames', values['max-dropped-frames'], { min: 0, max: 10_000 })
const maxLongTaskMs = numberOption('max-long-task-ms', values['max-long-task-ms'], { min: 1, max: 10_000 })
const expectedDuration = numberOption('expected-duration', values['expected-duration'], { min: 0.1, max: 600 })
const durationTolerance = numberOption('duration-tolerance', values['duration-tolerance'], { min: 0, max: 1 })
const scenarios = ['normal', 'reduced-motion', 'autoplay-denied', 'visibility-resume', 'offscreen-resume']
const scenario = values.scenario
if (!scenarios.includes(scenario)) throw new Error(`--scenario must be one of: ${scenarios.join(', ')}`)
const scenarioMechanisms = {
  normal: `Unmodified ${browserName} playback against the supplied host.`,
  'reduced-motion': `Native Playwright/${browserName} prefers-reduced-motion emulation; no asset routing.`,
  'autoplay-denied': 'Pre-hydration HTMLMediaElement.play rejection shim; real host and media requests remain unmocked.',
  'visibility-resume': 'Deterministic Document.hidden shim because headless tab visibility is not portable; real host and media remain unmocked.',
  'offscreen-resume': 'Actual page scroll and IntersectionObserver behavior against the real host.',
}
if (!['require', 'allow-full'].includes(values['range-policy'])) {
  throw new Error('--range-policy must be require or allow-full')
}

const cwd = process.cwd()
const outputDir = resolve(values.output)
const outputRelative = relative(cwd, outputDir)
if (!(outputRelative === 'tmp' || outputRelative.startsWith('tmp/'))) {
  throw new Error(`--output must be below ${resolve(cwd, 'tmp')}: ${outputDir}`)
}
const reportPath = resolve(outputDir, 'playback-report.json')
if (existsSync(reportPath) && !values.force) {
  throw new Error(`Refusing to overwrite ${reportPath}; pass --force to replace this harness's evidence`)
}
await mkdir(outputDir, { recursive: true })

const SCENE_SENTINELS = [
  'prepareRelease must complete before renderFrame',
  'createIso4(cv)',
  'SOURCE_FOLDER_BOTTOM',
]
const screenshotRecords = []
const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const failures = []
const warnings = []
const network = []
const requestIds = new WeakMap()
const scriptBodies = []
let nextRequestId = 1
let browser
let browserVersion = null
let browserUserAgent = null
let context
let page
let cdp
let finalEvidence = null
let explicitSamples = []
let geometry = null
let playback = null
let isoAssetNetwork = []
let selectedCurrentSrc = ''
let fatalError = null
let scenarioActionAtMs = null

const elapsed = (() => {
  const started = performance.now()
  return () => Number((performance.now() - started).toFixed(3))
})()

const addFailure = (code, message, evidence = null) => {
  failures.push({ code, message, evidence })
}

const capture = async (name, { hostOnly = false } = {}) => {
  const path = resolve(outputDir, `${name}.png`)
  const buffer = hostOnly
    ? await page.locator('.iso4').screenshot({ path })
    : await page.screenshot({ path, fullPage: false })
  const record = {
    name,
    path,
    bytes: buffer.byteLength,
    sha256: sha256(buffer),
    atMs: elapsed(),
  }
  screenshotRecords.push(record)
  return record
}

const snapshot = async (label) => {
  const value = await page.evaluate((snapshotLabel) => (
    globalThis.__isoPlaybackSnapshot?.(snapshotLabel) ?? null
  ), label)
  if (value) explicitSamples.push(value)
  return value
}

const waitForRecordedPhase = async (phase, phaseTimeout = timeoutMs) => {
  await page.waitForFunction((expected) => (
    globalThis.__isoPlaybackEvidence?.phases?.some((entry) => entry.phase === expected)
  ), phase, { timeout: phaseTimeout })
}

const rectDelta = (left, right) => {
  if (!left || !right) return null
  const delta = {
    x: left.x - right.x,
    y: left.y - right.y,
    width: left.width - right.width,
    height: left.height - right.height,
  }
  delta.maxAbs = Math.max(...Object.values(delta).map(Math.abs))
  return delta
}

const earliestRedirectId = (record, recordsById) => {
  let cursor = record
  const visited = new Set()
  while (cursor?.redirectedFromId && !visited.has(cursor.id)) {
    visited.add(cursor.id)
    cursor = recordsById.get(cursor.redirectedFromId) ?? cursor
    if (cursor.id === record.id && visited.size > 1) break
  }
  return cursor?.id ?? record.id
}

try {
  const browserType = browserName === 'webkit' ? webkit : chromium
  browser = await browserType.launch({ headless: !values.headed })
  browserVersion = browser.version()
  context = await browser.newContext({
    viewport,
    deviceScaleFactor: dpr,
    serviceWorkers: 'block',
    reducedMotion: scenario === 'reduced-motion' ? 'reduce' : 'no-preference',
  })
  page = await context.newPage()
  browserUserAgent = await page.evaluate(() => navigator.userAgent)
  cdp = browserName === 'chromium' ? await context.newCDPSession(page) : null
  if (cpuThrottle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle })

  await page.addInitScript(({ playbackScenario }) => {
    const state = {
      schema: 'bitterclip.iso4-artifact-playback-browser.v1',
      scenario: playbackScenario,
      timeOrigin: performance.timeOrigin,
      phases: [],
      mediaEvents: [],
      scenarioEvents: [],
      firstPresentedFrame: null,
      presentedFrames: [],
      longTasks: [],
      layoutShifts: [],
      paints: [],
      assetCandidates: {
        openingPosters: [],
        terminalPosters: [],
        videos: [],
        preloadImages: [],
        preloadVideos: [],
      },
    }
    globalThis.__isoPlaybackEvidence = state

    const now = () => Number(performance.now().toFixed(3))
    const absoluteUrl = (value) => {
      if (!value) return ''
      try { return new URL(value, document.baseURI).href } catch { return String(value) }
    }
    const srcsetUrls = (value) => String(value || '')
      .split(',')
      .map((candidate) => absoluteUrl(candidate.trim().split(/\s+/)[0]))
      .filter(Boolean)
    const unique = (items) => [...new Set(items.filter(Boolean))]
    const rect = (element) => {
      if (!element) return null
      const box = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        opacity: Number(style.opacity),
        display: style.display,
        visibility: style.visibility,
      }
    }
    const videoState = (video) => {
      if (!video) return null
      let quality = null
      try {
        const value = video.getVideoPlaybackQuality?.()
        if (value) {
          quality = {
            creationTime: value.creationTime,
            totalVideoFrames: value.totalVideoFrames,
            droppedVideoFrames: value.droppedVideoFrames,
            corruptedVideoFrames: value.corruptedVideoFrames,
          }
        }
      } catch {}
      return {
        srcAttribute: absoluteUrl(video.getAttribute('src')),
        currentSrc: video.currentSrc,
        currentTime: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : null,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState,
        paused: video.paused,
        ended: video.ended,
        loop: video.loop,
        controls: video.controls,
        muted: video.muted,
        playsInline: video.playsInline,
        playbackRate: video.playbackRate,
        webkitDecodedFrameCount: video.webkitDecodedFrameCount ?? null,
        webkitDroppedFrameCount: video.webkitDroppedFrameCount ?? null,
        quality,
      }
    }
    const imageState = (image) => image ? {
      srcAttribute: absoluteUrl(image.getAttribute('src')),
      currentSrc: image.currentSrc,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    } : null
    const collectCandidates = () => {
      const openingPicture = document.querySelector('.iso4__poster--opening')
      const openingImage = openingPicture?.querySelector('img')
      const declaredOpening = []
      const declaredTerminal = []
      for (const source of openingPicture?.querySelectorAll('source') ?? []) {
        const target = source.media.includes('prefers-reduced-motion: reduce')
          ? declaredTerminal
          : declaredOpening
        target.push(...srcsetUrls(source.srcset))
      }
      declaredOpening.push(absoluteUrl(openingImage?.getAttribute('src')))
      const openingCurrent = absoluteUrl(openingImage?.currentSrc)
      if (playbackScenario === 'reduced-motion') declaredTerminal.push(openingCurrent)
      else declaredOpening.push(openingCurrent)
      state.assetCandidates.openingPosters = unique([
        ...state.assetCandidates.openingPosters,
        ...declaredOpening,
      ])
      state.assetCandidates.terminalPosters = unique([
        ...state.assetCandidates.terminalPosters,
        ...declaredTerminal,
        ...[...document.querySelectorAll('.iso4__poster--terminal source')]
          .flatMap((source) => srcsetUrls(source.srcset)),
        absoluteUrl(document.querySelector('.iso4__poster--terminal img')?.getAttribute('src')),
        absoluteUrl(document.querySelector('.iso4__poster--terminal img')?.currentSrc),
      ])
      state.assetCandidates.videos = unique([
        ...state.assetCandidates.videos,
        ...[...document.querySelectorAll('.iso4 video')].flatMap((video) => [
          absoluteUrl(video.getAttribute('src')),
          absoluteUrl(video.currentSrc),
        ]),
      ])
      for (const link of document.querySelectorAll('link[rel="preload"][as="image"]')) {
        const urls = [
          absoluteUrl(link.getAttribute('href')),
          ...srcsetUrls(link.getAttribute('imagesrcset')),
        ]
        state.assetCandidates.preloadImages = unique([
          ...state.assetCandidates.preloadImages,
          ...urls,
        ])
        const target = link.media.includes('prefers-reduced-motion: reduce')
          ? 'terminalPosters'
          : 'openingPosters'
        state.assetCandidates[target] = unique([
          ...state.assetCandidates[target],
          ...urls,
        ])
      }
      state.assetCandidates.preloadVideos = unique([
        ...state.assetCandidates.preloadVideos,
        ...[...document.querySelectorAll('link[rel="preload"][as="video"]')].map((link) => (
          absoluteUrl(link.getAttribute('href'))
        )),
      ])
    }
    const makeSnapshot = (label) => {
      collectCandidates()
      const host = document.querySelector('.iso4')
      const openingPoster = document.querySelector('.iso4__poster--opening')
      const openingImage = openingPoster?.querySelector('img') ?? null
      const terminalPoster = document.querySelector('.iso4__poster--terminal')
      const terminalImage = terminalPoster?.querySelector('img') ?? null
      const video = document.querySelector('.iso4__video')
      return {
        label,
        atMs: now(),
        readyState: document.readyState,
        phase: host?.dataset.iso4Phase ?? 'missing',
        mode: host?.dataset.iso4Mode ?? 'missing',
        generation: host?.dataset.iso4Generation ?? 'missing',
        hidden: document.hidden,
        rects: {
          host: rect(host),
          openingPoster: rect(openingPoster),
          openingImage: rect(openingImage),
          video: rect(video),
          terminalPoster: rect(terminalPoster),
          terminalImage: rect(terminalImage),
        },
        images: {
          opening: imageState(openingImage),
          terminal: imageState(terminalImage),
        },
        elementCounts: {
          openingPictures: document.querySelectorAll('.iso4__poster--opening').length,
          openingImages: document.querySelectorAll('.iso4__poster--opening img').length,
          videos: document.querySelectorAll('.iso4__video').length,
          terminalPictures: document.querySelectorAll('.iso4__poster--terminal').length,
          terminalImages: document.querySelectorAll('.iso4__poster--terminal img').length,
          controls: document.querySelectorAll('.iso4__video[controls]').length,
        },
        video: videoState(video),
        canvasCount: document.querySelectorAll('canvas.iso4__gl').length,
        sceneGlobal: Boolean(globalThis.__iso),
      }
    }
    globalThis.__isoPlaybackSnapshot = makeSnapshot

    if (playbackScenario === 'visibility-resume') {
      const nativeHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')?.get
      let hiddenOverride = null
      Object.defineProperty(Document.prototype, 'hidden', {
        configurable: true,
        get() { return hiddenOverride ?? nativeHidden?.call(this) ?? false },
      })
      globalThis.__setIsoPlaybackHidden = (hidden) => {
        hiddenOverride = Boolean(hidden)
        state.scenarioEvents.push({ type: hidden ? 'hide' : 'show', atMs: now() })
        document.dispatchEvent(new Event('visibilitychange'))
      }
    }

    let observedHost = null
    let hostObserver = null
    let observedVideo = null
    const recordPhase = (label) => {
      const entry = makeSnapshot(label)
      if (state.phases.at(-1)?.phase !== entry.phase) state.phases.push(entry)
    }
    const recordMedia = (type, video, details = {}) => {
      state.mediaEvents.push({
        type,
        atMs: now(),
        currentTime: video?.currentTime ?? null,
        currentSrc: video?.currentSrc ?? '',
        paused: video?.paused ?? null,
        ended: video?.ended ?? null,
        ...details,
      })
      collectCandidates()
    }
    const attachVideo = (video) => {
      if (!video || video === observedVideo) return
      observedVideo = video
      for (const type of [
        'loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'play', 'playing',
        'pause', 'seeking', 'seeked', 'timeupdate', 'ended', 'emptied', 'error',
      ]) {
        video.addEventListener(type, () => recordMedia(type, video), { capture: true })
      }
      if (video.requestVideoFrameCallback) {
        const recordPresentedFrame = (callbackNow, metadata) => {
          const frame = {
            atMs: now(),
            callbackNow,
            currentTime: video.currentTime,
            currentSrc: video.currentSrc,
            mediaTime: metadata.mediaTime,
            presentedFrames: metadata.presentedFrames,
            expectedDisplayTime: metadata.expectedDisplayTime,
            width: metadata.width,
            height: metadata.height,
          }
          state.presentedFrames.push(frame)
          state.firstPresentedFrame ??= frame
          if (video.isConnected && video.currentSrc) {
            video.requestVideoFrameCallback(recordPresentedFrame)
          }
        }
        video.requestVideoFrameCallback(recordPresentedFrame)
      }
      recordMedia('video-attached', video)
    }
    const attachHost = () => {
      const host = document.querySelector('.iso4')
      if (!host || host === observedHost) return
      observedHost = host
      hostObserver?.disconnect()
      hostObserver = new MutationObserver(() => {
        attachVideo(document.querySelector('.iso4__video'))
        collectCandidates()
        recordPhase('phase-mutation')
      })
      hostObserver.observe(host, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-iso4-phase', 'src', 'srcset'],
      })
      attachVideo(document.querySelector('.iso4__video'))
      recordPhase('host-attached')
    }
    const documentObserver = new MutationObserver(() => {
      attachHost()
      attachVideo(document.querySelector('.iso4__video'))
      collectCandidates()
    })
    documentObserver.observe(document, { subtree: true, childList: true })
    if (document.readyState !== 'loading') attachHost()
    document.addEventListener('DOMContentLoaded', attachHost, { once: true })

    const nativeLoad = HTMLMediaElement.prototype.load
    const nativePlay = HTMLMediaElement.prototype.play
    const nativePause = HTMLMediaElement.prototype.pause
    HTMLMediaElement.prototype.load = function playbackHarnessLoad() {
      if (this.matches?.('.iso4__video')) recordMedia('load-call', this, { hasSrc: this.hasAttribute('src') })
      return nativeLoad.call(this)
    }
    HTMLMediaElement.prototype.play = function playbackHarnessPlay() {
      if (this.matches?.('.iso4__video')) recordMedia('play-call', this)
      if (this.matches?.('.iso4__video') && playbackScenario === 'autoplay-denied') {
        const error = new DOMException('ISO4 playback harness autoplay denial', 'NotAllowedError')
        recordMedia('play-rejected', this, { error: String(error), synthetic: true })
        return Promise.reject(error)
      }
      const result = nativePlay.call(this)
      if (this.matches?.('.iso4__video')) {
        result.then(
          () => recordMedia('play-resolved', this),
          (error) => recordMedia('play-rejected', this, { error: String(error) }),
        )
      }
      return result
    }
    HTMLMediaElement.prototype.pause = function playbackHarnessPause() {
      if (this.matches?.('.iso4__video')) recordMedia('pause-call', this)
      return nativePause.call(this)
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.longTasks.push({
            atMs: entry.startTime,
            durationMs: entry.duration,
            phase: document.querySelector('.iso4')?.dataset.iso4Phase ?? null,
            attribution: entry.attribution?.map((item) => ({
              name: item.name || null,
              containerType: item.containerType || null,
              containerName: item.containerName || null,
              containerSrc: item.containerSrc || null,
              containerId: item.containerId || null,
            })) ?? [],
          })
        }
      }).observe({ type: 'longtask', buffered: true })
    } catch {}
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            state.layoutShifts.push({
              atMs: entry.startTime,
              value: entry.value,
              sources: entry.sources?.map((source) => (
                source.node?.className || source.node?.nodeName || ''
              )) ?? [],
            })
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })
    } catch {}
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.paints.push({ name: entry.name, atMs: entry.startTime })
        }
      }).observe({ type: 'paint', buffered: true })
    } catch {}
  }, { playbackScenario: scenario })

  page.on('request', (request) => {
    const id = nextRequestId++
    requestIds.set(request, id)
    const redirectedFrom = request.redirectedFrom()
    const headers = request.headers()
    network.push({
      id,
      redirectedFromId: redirectedFrom ? requestIds.get(redirectedFrom) ?? null : null,
      atMs: elapsed(),
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      requestHeaders: {
        range: headers.range ?? null,
        accept: headers.accept ?? null,
        referer: headers.referer ?? null,
      },
      response: null,
      failure: null,
    })
  })
  page.on('response', (response) => {
    const request = response.request()
    const id = requestIds.get(request)
    const record = network.find((entry) => entry.id === id)
    if (!record) return
    const headers = response.headers()
    record.response = {
      atMs: elapsed(),
      url: response.url(),
      status: response.status(),
      contentType: headers['content-type'] ?? null,
      contentLength: headers['content-length'] ?? null,
      contentRange: headers['content-range'] ?? null,
      acceptRanges: headers['accept-ranges'] ?? null,
      cacheControl: headers['cache-control'] ?? null,
      etag: headers.etag ?? null,
    }
    if (request.resourceType() === 'script') {
      scriptBodies.push(response.body()
        .then((body) => ({ url: response.url(), body: body.toString('utf8') }))
        .catch((error) => ({ url: response.url(), body: '', error: String(error) })))
    }
  })
  page.on('requestfailed', (request) => {
    const id = requestIds.get(request)
    const record = network.find((entry) => entry.id === id)
    if (record) record.failure = request.failure()?.errorText ?? 'unknown request failure'
  })

  await page.goto(target.href, { waitUntil: 'commit', timeout: timeoutMs })
  await page.locator('.iso4').waitFor({ state: 'attached', timeout: timeoutMs })
  await page.waitForFunction(async () => {
    const host = document.querySelector('.iso4')
    const image = document.querySelector('.iso4__poster--opening img')
    if (!host || !image) return false
    const hostRect = host.getBoundingClientRect()
    const imageRect = image.getBoundingClientRect()
    if (!(hostRect.width > 0 && hostRect.height > 0
      && imageRect.width > 0 && imageRect.height > 0
      && image.currentSrc && image.complete
      && image.naturalWidth > 0 && image.naturalHeight > 0)) return false

    const selectedSrc = image.currentSrc
    try {
      await image.decode()
    } catch {
      return false
    }

    // A successful decode makes pixels available, but it does not prove the
    // selected responsive candidate has reached the compositor. Give it two
    // paint opportunities and retry if hydration changed the candidate while
    // we were waiting.
    await new Promise((resolve) => requestAnimationFrame(() => (
      requestAnimationFrame(resolve)
    )))
    return image.isConnected
      && image.currentSrc === selectedSrc
      && image.complete
      && image.naturalWidth > 0
      && image.naturalHeight > 0
  }, null, { timeout: Math.min(timeoutMs, 5_000) })
  const openingState = await snapshot('opening-checkpoint')
  await capture('opening-homepage')

  await page.waitForLoadState('domcontentloaded', { timeout: timeoutMs })
  let handoffState = null
  let playingState = null
  let midplayState = null
  let terminalTransitionState = null
  let terminalState = null
  let heldTerminalState = null
  let releasedState = null
  let firstTerminalHost = null
  let secondTerminalHost = null
  let scenarioResult = null

  if (scenario === 'autoplay-denied') {
    await page.waitForFunction(() => (
      globalThis.__isoPlaybackEvidence?.mediaEvents?.some((entry) => entry.type === 'play-rejected')
      && document.querySelector('.iso4')?.dataset.iso4Phase === 'opening'
      && !document.querySelector('.iso4__video')
    ), null, { timeout: timeoutMs })
    releasedState = await snapshot('autoplay-denied-settled')
    await capture('autoplay-denied-homepage')
    scenarioResult = {
      denied: true,
      openingPreserved: releasedState?.phase === 'opening',
      decoderReleased: releasedState?.video === null,
    }
  } else {
    if (scenario === 'reduced-motion') {
      await waitForRecordedPhase('terminal')
      terminalTransitionState = await snapshot('terminal-transition-checkpoint')
    } else {
      await waitForRecordedPhase('handoff')
      handoffState = await snapshot('handoff-checkpoint')
      if (handoffState?.phase === 'handoff') await capture('handoff-homepage')

      await waitForRecordedPhase('playing')
      playingState = await snapshot('playing-checkpoint')
      selectedCurrentSrc = playingState?.video?.currentSrc ?? ''
      await capture('playing-homepage')

      if (scenario === 'visibility-resume') {
        await page.waitForFunction(() => (
          (document.querySelector('.iso4__video')?.currentTime ?? 0) > 0.3
        ), null, { timeout: timeoutMs })
        const before = await snapshot('visibility-before-hide')
        scenarioActionAtMs = elapsed()
        await page.evaluate(() => globalThis.__setIsoPlaybackHidden?.(true))
        await page.waitForFunction(() => document.querySelector('.iso4__video')?.paused === true)
        const paused = await snapshot('visibility-hidden')
        await page.waitForTimeout(300)
        const held = await snapshot('visibility-hidden-held')
        await page.evaluate(() => globalThis.__setIsoPlaybackHidden?.(false))
        await page.waitForFunction((minimumTime) => {
          const video = document.querySelector('.iso4__video')
          return Boolean(video && !video.paused && video.currentTime > minimumTime + 0.04)
        }, held?.video?.currentTime ?? 0, { timeout: timeoutMs })
        const resumed = await snapshot('visibility-resumed')
        scenarioResult = {
          before,
          paused,
          held,
          resumed,
          stableWhileHiddenSeconds: Math.abs((held?.video?.currentTime ?? 0) - (paused?.video?.currentTime ?? 0)),
          sameSource: before?.video?.currentSrc === resumed?.video?.currentSrc,
        }
      } else if (scenario === 'offscreen-resume') {
        await page.waitForFunction(() => (
          (document.querySelector('.iso4__video')?.currentTime ?? 0) > 0.3
        ), null, { timeout: timeoutMs })
        const before = await snapshot('offscreen-before-scroll')
        scenarioActionAtMs = elapsed()
        await page.evaluate(() => {
          const host = document.querySelector('.iso4')
          const stage = host?.parentElement
          const targetY = (stage?.getBoundingClientRect().bottom ?? innerHeight) + scrollY + 2
          scrollTo(0, targetY)
        })
        await page.waitForFunction(() => document.querySelector('.iso4__video')?.paused === true)
        const paused = await snapshot('offscreen-paused')
        await page.waitForTimeout(300)
        const held = await snapshot('offscreen-held')
        await page.evaluate(() => scrollTo(0, 0))
        await page.waitForFunction((minimumTime) => {
          const video = document.querySelector('.iso4__video')
          return Boolean(video && !video.paused && video.currentTime > minimumTime + 0.04)
        }, held?.video?.currentTime ?? 0, { timeout: timeoutMs })
        const resumed = await snapshot('offscreen-resumed')
        scenarioResult = {
          before,
          paused,
          held,
          resumed,
          stableWhileOffscreenSeconds: Math.abs((held?.video?.currentTime ?? 0) - (paused?.video?.currentTime ?? 0)),
          sameSource: before?.video?.currentSrc === resumed?.video?.currentSrc,
        }
      }

      // Preserve one homepage-native visual witness from the body of the
      // cinematic. The early `playing-homepage` capture proves takeover, not
      // subtitle, particle, film, or projection quality; waiting on media time
      // keeps this checkpoint deterministic across fast and throttled hosts.
      await page.waitForFunction(() => {
        const host = document.querySelector('.iso4')
        const video = document.querySelector('.iso4__video')
        return Boolean(host?.dataset.iso4Phase === 'playing'
          && video && video.currentTime >= 5)
      }, null, { timeout: timeoutMs })
      midplayState = await snapshot('midplay-checkpoint')
      await capture('midplay-homepage')

      const playbackDeadline = performance.now() + timeoutMs
      let terminalRecorded = false
      while (performance.now() < playbackDeadline) {
        const sample = await snapshot('playback-sample')
        if (sample?.phase === 'terminal' || sample?.phase === 'terminal-video') {
          terminalRecorded = true
          break
        }
        await page.waitForTimeout(100)
      }
      if (!terminalRecorded) throw new Error(`ISO4 did not reach a terminal phase within ${timeoutMs}ms`)
      terminalTransitionState = await snapshot('terminal-transition-checkpoint')
    }

    // The shell intentionally crossfades for 180ms. Judge the terminal still
    // only after that handoff and the bounded decoder-release timer have both
    // completed; otherwise two correct frames can differ solely by opacity.
    await page.waitForTimeout(350)
    terminalState = await snapshot('terminal-settled-checkpoint')
    await capture('terminal-homepage')
    firstTerminalHost = await capture('terminal-host-a', { hostOnly: true })
    await page.waitForTimeout(700)
    heldTerminalState = await snapshot('terminal-held-checkpoint')
    secondTerminalHost = await capture('terminal-host-b', { hostOnly: true })
    await page.waitForTimeout(400)
    releasedState = await snapshot('decoder-released-checkpoint')
  }

  finalEvidence = await page.evaluate(() => ({
    ...globalThis.__isoPlaybackEvidence,
    final: globalThis.__isoPlaybackSnapshot?.('final-browser-evidence') ?? null,
    navigation: performance.getEntriesByType('navigation').map((entry) => ({
      responseStart: entry.responseStart,
      responseEnd: entry.responseEnd,
      domInteractive: entry.domInteractive,
      domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
      loadEventEnd: entry.loadEventEnd,
    })),
    resourceTimings: performance.getEntriesByType('resource')
      .filter((entry) => entry.initiatorType === 'video' || entry.initiatorType === 'img')
      .map((entry) => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        startTime: entry.startTime,
        responseStart: entry.responseStart,
        responseEnd: entry.responseEnd,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
      })),
  }))

  const scripts = await Promise.all(scriptBodies)
  const sceneScripts = scripts.filter((entry) => (
    SCENE_SENTINELS.some((sentinel) => entry.body.includes(sentinel))
  )).map((entry) => entry.url)

  const phases = finalEvidence.phases.map((entry) => entry.phase)
  const firstPhase = (phase) => finalEvidence.phases.find((entry) => entry.phase === phase) ?? null
  selectedCurrentSrc ||= finalEvidence.mediaEvents.find((entry) => entry.currentSrc)?.currentSrc ?? ''
  const phaseStates = {
    // Parser-time phase records can precede stylesheet application. Use the
    // explicit painted checkpoint for geometry while retaining those early
    // records for transition chronology.
    opening: openingState ?? firstPhase('opening'),
  }
  if (!['reduced-motion', 'autoplay-denied'].includes(scenario)) {
    phaseStates.handoff = firstPhase('handoff') ?? handoffState
    phaseStates.playing = playingState ?? firstPhase('playing')
  }
  if (scenario !== 'autoplay-denied') {
    phaseStates.terminal = terminalState ?? firstPhase('terminal') ?? firstPhase('terminal-video')
  }
  const baselineHost = phaseStates.opening?.rects?.host ?? openingState?.rects?.host
  const geometryChecks = []
  const checkRect = (name, left, right) => {
    const delta = rectDelta(left, right)
    geometryChecks.push({ name, left, right, delta, pass: Boolean(delta && delta.maxAbs <= geometryTolerance) })
  }
  for (const [phase, state] of Object.entries(phaseStates)) {
    checkRect(`${phase}:host-vs-opening-host`, state?.rects?.host, baselineHost)
    checkRect(`${phase}:opening-poster-vs-host`, state?.rects?.openingPoster, state?.rects?.host)
    checkRect(`${phase}:opening-image-vs-host`, state?.rects?.openingImage, state?.rects?.host)
    if (phase === 'handoff' || phase === 'playing') {
      checkRect(`${phase}:video-vs-host`, state?.rects?.video, state?.rects?.host)
    }
    if (phase === 'terminal') {
      checkRect(`${phase}:terminal-poster-vs-host`, state?.rects?.terminalPoster, state?.rects?.host)
      checkRect(`${phase}:terminal-image-vs-host`, state?.rects?.terminalImage, state?.rects?.host)
    }
  }
  geometry = {
    toleranceCssPx: geometryTolerance,
    checks: geometryChecks,
    maxAbsDeltaCssPx: Math.max(0, ...geometryChecks.map((entry) => entry.delta?.maxAbs ?? Number.POSITIVE_INFINITY)),
  }
  for (const check of geometryChecks.filter((entry) => !entry.pass)) {
    addFailure('geometry_delta', `${check.name} exceeded ${geometryTolerance}px or lacked a measurable layer`, check)
  }

  const candidateGroups = finalEvidence.assetCandidates
  const candidateUrls = new Set([
    ...candidateGroups.openingPosters,
    ...candidateGroups.terminalPosters,
    ...candidateGroups.videos,
    ...candidateGroups.preloadImages,
    ...candidateGroups.preloadVideos,
    selectedCurrentSrc,
  ].filter(Boolean))
  const recordsById = new Map(network.map((entry) => [entry.id, entry]))
  const recordChain = (record) => {
    const chain = []
    let cursor = record
    const visited = new Set()
    while (cursor && !visited.has(cursor.id)) {
      visited.add(cursor.id)
      chain.push(cursor)
      cursor = cursor.redirectedFromId ? recordsById.get(cursor.redirectedFromId) : null
    }
    return chain
  }
  const chainTouches = (record, urls) => recordChain(record).some((entry) => (
    urls.has(entry.url) || urls.has(entry.response?.url)
  ))
  const recordSource = (record) => {
    const root = recordsById.get(earliestRedirectId(record, recordsById))
    return root?.url ?? record.url
  }
  const isMp4 = (record) => {
    const candidates = [record.url, record.response?.url].filter(Boolean)
    return candidates.some((value) => {
      try { return /\.mp4$/i.test(new URL(value).pathname) } catch { return /\.mp4(?:$|[?#])/i.test(value) }
    }) || /^video\/mp4(?:;|$)/i.test(record.response?.contentType ?? '')
  }
  const knownVideoCandidates = new Set([
    ...candidateGroups.videos,
    ...candidateGroups.preloadVideos,
    selectedCurrentSrc,
  ].filter(Boolean))
  // Before an offscreen scenario scrolls into later homepage sections, every
  // MP4 request is part of the cold above-fold census. After that deliberate
  // scroll, retain only chains that touch an ISO4 candidate so an unrelated
  // below-fold demo does not masquerade as a responsive-master duplicate.
  const allMp4CandidateNetwork = network.filter((record) => (
    isMp4(record)
    && (
      scenario !== 'offscreen-resume'
      || scenarioActionAtMs === null
      || record.atMs < scenarioActionAtMs
      || chainTouches(record, knownVideoCandidates)
    )
  ))
  const matchingChainRoots = new Set()
  for (const record of network) {
    if (chainTouches(record, candidateUrls) || allMp4CandidateNetwork.includes(record)) {
      matchingChainRoots.add(earliestRedirectId(record, recordsById))
    }
  }
  isoAssetNetwork = network.filter((record) => (
    matchingChainRoots.has(earliestRedirectId(record, recordsById))
  ))
  const isoVideoNetwork = isoAssetNetwork.filter((record) => (
    isMp4(record) || chainTouches(record, knownVideoCandidates)
  ))
  const uniqueVideoSources = [...new Set(isoVideoNetwork.map(recordSource))]

  const openingPosterCandidates = new Set(candidateGroups.openingPosters.filter(Boolean))
  const terminalPosterCandidates = new Set(candidateGroups.terminalPosters.filter(Boolean))
  const openingPosterNetwork = network.filter((record) => chainTouches(record, openingPosterCandidates))
  const terminalPosterNetwork = network.filter((record) => chainTouches(record, terminalPosterCandidates))
  const uniqueOpeningPosterSources = [...new Set(openingPosterNetwork.map(recordSource))]
  const uniqueTerminalPosterSources = [...new Set(terminalPosterNetwork.map(recordSource))]
  const openingPosterRequestChains = [...new Set(openingPosterNetwork.map((record) => (
    earliestRedirectId(record, recordsById)
  )))]
  const terminalPosterRequestChains = [...new Set(terminalPosterNetwork.map((record) => (
    earliestRedirectId(record, recordsById)
  )))]

  const videoWithRange = isoVideoNetwork.some((record) => Boolean(record.requestHeaders.range))
  const videoWith206 = isoVideoNetwork.some((record) => (
    record.response?.status === 206 && Boolean(record.response.contentRange)
  ))
  const successfulVideoResponse = isoVideoNetwork.some((record) => (
    record.response && [200, 206].includes(record.response.status)
  ))
  const firstHandoff = phaseStates.handoff ?? null
  const handoffPresentedFrame = finalEvidence.presentedFrames
    .filter((frame) => firstHandoff && frame.atMs <= firstHandoff.atMs + 2)
    .at(-1) ?? null
  const mediaTimeSamples = explicitSamples
    .filter((entry) => entry.phase === 'playing' && Number.isFinite(entry.video?.currentTime))
    .map((entry) => ({ atMs: entry.atMs, currentTime: entry.video.currentTime }))
  const backwardSteps = []
  for (let index = 1; index < mediaTimeSamples.length; index++) {
    const previous = mediaTimeSamples[index - 1]
    const current = mediaTimeSamples[index]
    if (current.currentTime < previous.currentTime - 0.05) backwardSteps.push({ previous, current })
  }
  const endedEvents = finalEvidence.mediaEvents.filter((entry) => entry.type === 'ended')
  const endedAt = endedEvents.at(-1)?.atMs ?? Number.POSITIVE_INFINITY
  const postEndedPlayEvents = finalEvidence.mediaEvents.filter((entry) => (
    entry.atMs > endedAt && ['play', 'playing', 'play-call', 'play-resolved'].includes(entry.type)
  ))
  const qualitySamples = explicitSamples
    .map((entry) => entry.video)
    .filter(Boolean)
    .map((video) => video.quality ?? {
      totalVideoFrames: video.webkitDecodedFrameCount,
      droppedVideoFrames: video.webkitDroppedFrameCount,
      corruptedVideoFrames: null,
    })
    .filter((quality) => Number.isFinite(quality?.totalVideoFrames))
  const finalQuality = qualitySamples.at(-1) ?? null
  const droppedFrames = finalQuality?.droppedVideoFrames ?? null
  const terminalStillPixelsMatch = Boolean(
    firstTerminalHost && secondTerminalHost && firstTerminalHost.sha256 === secondTerminalHost.sha256,
  )
  const decoderReleased = releasedState?.video === null
  const masterState = phaseStates.playing?.video ?? firstHandoff?.video ?? null
  // The immediate opening checkpoint can precede image decode on a genuinely
  // cold connection. Its DOM/rect remains the opening-phase authority, while
  // the same persistent image's later state supplies currentSrc/intrinsics.
  const openingImage = phaseStates.playing?.images?.opening
    ?? phaseStates.terminal?.images?.opening
    ?? releasedState?.images?.opening
    ?? phaseStates.opening?.images?.opening
    ?? null
  const terminalImage = phaseStates.terminal?.images?.terminal ?? null
  const expectedMaster = openingImage ? {
    width: openingImage.naturalWidth,
    height: openingImage.naturalHeight,
  } : null
  const longTaskViolations = finalEvidence.longTasks.filter((entry) => entry.durationMs > maxLongTaskMs)

  playback = {
    selectedCurrentSrc,
    uniqueVideoSources,
    allMp4CandidateNetwork,
    openingPosterNetwork,
    terminalPosterNetwork,
    uniqueOpeningPosterSources,
    uniqueTerminalPosterSources,
    openingPosterRequestChains,
    terminalPosterRequestChains,
    selectedOpeningPosterSrc: openingImage?.currentSrc ?? '',
    selectedTerminalPosterSrc: terminalImage?.currentSrc ?? '',
    rangePolicy: values['range-policy'],
    videoWithRange,
    videoWith206,
    successfulVideoResponse,
    firstPresentedFrame: finalEvidence.firstPresentedFrame,
    handoffPresentedFrame,
    handoffCurrentTime: firstHandoff?.video?.currentTime ?? null,
    handoffCurrentSrc: firstHandoff?.video?.currentSrc ?? '',
    midplayMediaTime: midplayState?.video?.currentTime ?? null,
    flags: firstHandoff?.video ? {
      loop: firstHandoff.video.loop,
      controls: firstHandoff.video.controls,
      muted: firstHandoff.video.muted,
      playsInline: firstHandoff.video.playsInline,
      playbackRate: firstHandoff.video.playbackRate,
    } : null,
    expectedMaster,
    decodedMaster: masterState ? {
      width: masterState.videoWidth,
      height: masterState.videoHeight,
      duration: masterState.duration,
    } : null,
    longTaskViolations,
    scenario,
    scenarioResult,
    phases,
    endedEventCount: endedEvents.length,
    postEndedPlayEvents,
    backwardSteps,
    finalQuality,
    droppedFrames,
    terminalPhase: terminalTransitionState?.phase,
    terminalStillPixelsMatch,
    decoderReleased,
    heldTerminalState,
    releasedState,
  }

  if (phaseStates.opening?.mode !== 'video') {
    addFailure('not_video_mode', `ISO4 reported mode ${phaseStates.opening?.mode ?? 'missing'}, expected video`)
  }
  if (phaseStates.opening?.generation === 'unpublished') {
    addFailure('unpublished_generation', 'ISO4 production shell reported an unpublished generation')
  }
  if (phaseStates.opening?.canvasCount || phaseStates.handoff?.canvasCount || phaseStates.playing?.canvasCount) {
    addFailure('live_canvas', 'A live ISO4 WebGL canvas was present during production delivery')
  }
  if (phaseStates.opening?.sceneGlobal || phaseStates.handoff?.sceneGlobal || phaseStates.playing?.sceneGlobal) {
    addFailure('live_scene_global', 'window.__iso was present during production delivery')
  }
  if (sceneScripts.length) addFailure('live_scene_chunk', 'A script containing live ISO4 scene code was loaded', sceneScripts)
  if (longTaskViolations.length) {
    addFailure('long_task', `${longTaskViolations.length} main-thread task(s) exceeded ${maxLongTaskMs}ms`, longTaskViolations)
  }

  if (phaseStates.opening?.elementCounts?.openingPictures !== 1
    || phaseStates.opening?.elementCounts?.openingImages !== 1) {
    addFailure('opening_poster_dom_count', 'Opening phase must contain exactly one opening picture and one image', phaseStates.opening?.elementCounts)
  }
  if (!openingImage?.currentSrc || !openingImage.complete || openingImage.naturalWidth < 1 || openingImage.naturalHeight < 1) {
    addFailure('opening_poster_selection', 'Opening poster did not resolve one decoded currentSrc with intrinsic dimensions', openingImage)
  }
  if (scenario === 'reduced-motion') {
    if (uniqueOpeningPosterSources.length !== 0 || openingPosterRequestChains.length !== 0) {
      addFailure('reduced_motion_opening_request', 'Reduced motion must request the terminal poster directly, not the opening poster', {
        urls: uniqueOpeningPosterSources,
        chains: openingPosterRequestChains,
      })
    }
  } else if (uniqueOpeningPosterSources.length !== 1 || openingPosterRequestChains.length !== 1) {
      addFailure('opening_poster_request_count', `Expected one responsive opening-poster request, observed ${uniqueOpeningPosterSources.length} URL(s) across ${openingPosterRequestChains.length} request chain(s)`, {
        urls: uniqueOpeningPosterSources,
        chains: openingPosterRequestChains,
      })
  } else if (openingImage?.currentSrc !== uniqueOpeningPosterSources[0]) {
      addFailure('opening_poster_request_mismatch', 'Selected opening poster does not match the sole requested opening candidate', {
        selected: openingImage?.currentSrc,
        requested: uniqueOpeningPosterSources,
      })
  }

  const expectsVideo = scenario !== 'reduced-motion'
  const expectsFullPlayback = !['reduced-motion', 'autoplay-denied'].includes(scenario)
  const expectsTerminal = scenario !== 'autoplay-denied'
  if (expectsVideo) {
    if (uniqueVideoSources.length !== 1) {
      addFailure('video_source_count', `Expected exactly one cold-load MP4 URL, observed ${uniqueVideoSources.length}`, uniqueVideoSources)
    }
    if (!selectedCurrentSrc) addFailure('missing_current_src', 'The ISO4 delivery attempt had no selected currentSrc')
    if (!successfulVideoResponse) addFailure('missing_video_response', 'No successful ISO4 MP4 response was observed')
    if (values['range-policy'] === 'require' && (!videoWithRange || !videoWith206)) {
      addFailure('range_delivery', 'Production Artifact delivery requires a Range request and HTTP 206 Content-Range response', {
        videoWithRange,
        videoWith206,
      })
    }
  } else {
    if (uniqueVideoSources.length !== 0) {
      addFailure('reduced_motion_video_request', 'Reduced motion must not request an MP4', uniqueVideoSources)
    }
    if (finalEvidence.firstPresentedFrame) {
      addFailure('reduced_motion_presented_frame', 'Reduced motion unexpectedly presented a video frame', finalEvidence.firstPresentedFrame)
    }
  }

  if (expectsFullPlayback) {
    if (firstHandoff?.elementCounts?.videos !== 1) {
      addFailure('video_dom_count', `Handoff must contain exactly one selected video element, observed ${firstHandoff?.elementCounts?.videos ?? 'missing'}`)
    }
    if (firstHandoff?.video?.currentTime === null || firstHandoff?.video?.currentTime === undefined) {
      addFailure('missing_handoff_time', 'No handoff video currentTime was recorded')
    } else if (firstHandoff.video.currentTime > maxHandoffMediaTime) {
      addFailure('late_handoff', `First handoff occurred at ${firstHandoff.video.currentTime}s, later than ${maxHandoffMediaTime}s`)
    }
    if (!firstHandoff?.video?.currentSrc) addFailure('missing_handoff_src', 'No handoff video currentSrc was recorded')
    if (firstHandoff?.video?.loop) addFailure('loop_attribute', 'ISO4 delivery video has loop enabled')
    if (firstHandoff?.video?.controls || firstHandoff?.elementCounts?.controls) {
      addFailure('video_controls', 'ISO4 production video exposes browser controls')
    }
    if (!firstHandoff?.video?.muted) addFailure('video_not_muted', 'ISO4 production video is not muted')
    if (!firstHandoff?.video?.playsInline) addFailure('video_not_inline', 'ISO4 production video is not playsinline')
    if (firstHandoff?.video?.playbackRate !== 1) {
      addFailure('playback_rate', `ISO4 production video playbackRate was ${firstHandoff?.video?.playbackRate ?? 'missing'}, expected 1`)
    }
    if (!expectedMaster || expectedMaster.width < 1 || expectedMaster.height < 1) {
      addFailure('missing_expected_master', 'Opening poster did not expose intrinsic master dimensions', expectedMaster)
    } else if (masterState?.videoWidth !== expectedMaster.width || masterState?.videoHeight !== expectedMaster.height) {
      addFailure('decoded_dimensions', 'Decoded video dimensions do not match the selected responsive poster master', {
        expected: expectedMaster,
        decoded: { width: masterState?.videoWidth, height: masterState?.videoHeight },
      })
    }
    if (!Number.isFinite(masterState?.duration)
      || Math.abs(masterState.duration - expectedDuration) > durationTolerance) {
      addFailure('decoded_duration', `Decoded duration must be ${expectedDuration}s ± ${durationTolerance}s`, masterState?.duration)
    }
    if (!handoffPresentedFrame) {
      addFailure('missing_presented_frame', 'requestVideoFrameCallback did not report the compositor frame that immediately preceded handoff')
    } else {
      const firstFrame = handoffPresentedFrame
      if (firstFrame.mediaTime < 0 || firstFrame.mediaTime > maxHandoffMediaTime) {
        addFailure('first_presented_media_time', `Handoff compositor mediaTime ${firstFrame.mediaTime}s exceeded ${maxHandoffMediaTime}s`, firstFrame)
      }
      if (firstFrame.currentTime < 0 || firstFrame.currentTime > maxHandoffMediaTime) {
        addFailure('first_presented_current_time', `Handoff compositor currentTime ${firstFrame.currentTime}s exceeded ${maxHandoffMediaTime}s`, firstFrame)
      }
      if (firstFrame.currentSrc !== selectedCurrentSrc) {
        addFailure('first_presented_source', 'First presented frame did not come from the selected currentSrc', {
          presented: firstFrame.currentSrc,
          selected: selectedCurrentSrc,
        })
      }
      if (expectedMaster && (firstFrame.width !== expectedMaster.width || firstFrame.height !== expectedMaster.height)) {
        addFailure('first_presented_dimensions', 'First presented frame dimensions do not match the responsive master', {
          expected: expectedMaster,
          presented: { width: firstFrame.width, height: firstFrame.height },
        })
      }
    }
    if (backwardSteps.length) addFailure('playback_restart', 'Video currentTime moved backward after playback began', backwardSteps)
    if (endedEvents.length !== 1) addFailure('ended_count', `Expected one ended event, observed ${endedEvents.length}`)
    if (postEndedPlayEvents.length) addFailure('post_ended_restart', 'Playback restarted after the ended event', postEndedPlayEvents)
    if (droppedFrames === null || droppedFrames > maxDroppedFrames) {
      addFailure('dropped_frames', `Dropped frames ${droppedFrames ?? 'unavailable'} exceeded ${maxDroppedFrames}`)
    }
  } else if (scenario === 'autoplay-denied') {
    if (endedEvents.length !== 0) addFailure('autoplay_denied_ended', 'Denied autoplay must not reach ended', endedEvents)
    if (!scenarioResult?.denied || !scenarioResult.openingPreserved || !scenarioResult.decoderReleased) {
      addFailure('autoplay_denial_fallback', 'Autoplay denial did not preserve opening pixels and release the decoder', scenarioResult)
    }
  }

  const expectedPhases = scenario === 'reduced-motion'
    ? ['opening', 'terminal']
    : scenario === 'autoplay-denied'
      ? ['opening']
      : ['opening', 'handoff', 'playing', 'terminal']
  const compressedPhases = phases.filter((phase, index) => index === 0 || phase !== phases[index - 1])
  if (JSON.stringify(compressedPhases) !== JSON.stringify(expectedPhases)) {
    addFailure('phase_sequence', `Expected ${expectedPhases.join(' -> ')}, observed ${compressedPhases.join(' -> ')}`)
  }
  if (expectsTerminal) {
    if (terminalTransitionState?.phase !== 'terminal') {
      addFailure('terminal_poster', `Expected terminal poster phase, observed ${terminalTransitionState?.phase ?? 'missing'}`)
    }
    if (phaseStates.terminal?.elementCounts?.terminalPictures !== 1
      || phaseStates.terminal?.elementCounts?.terminalImages !== 1) {
      addFailure('terminal_poster_dom_count', 'Terminal phase must contain exactly one terminal picture and one image', phaseStates.terminal?.elementCounts)
    }
    if (!terminalImage?.currentSrc || !terminalImage.complete || terminalImage.naturalWidth < 1 || terminalImage.naturalHeight < 1) {
      addFailure('terminal_poster_selection', 'Terminal poster did not resolve one decoded currentSrc with intrinsic dimensions', terminalImage)
    }
    if (uniqueTerminalPosterSources.length !== 1 || terminalPosterRequestChains.length !== 1) {
      addFailure('terminal_poster_request_count', `Expected one terminal-poster request, observed ${uniqueTerminalPosterSources.length} URL(s) across ${terminalPosterRequestChains.length} request chain(s)`, {
        urls: uniqueTerminalPosterSources,
        chains: terminalPosterRequestChains,
      })
    } else if (terminalImage?.currentSrc !== uniqueTerminalPosterSources[0]) {
      addFailure('terminal_poster_request_mismatch', 'Selected terminal poster does not match the sole requested terminal candidate', {
        selected: terminalImage?.currentSrc,
        requested: uniqueTerminalPosterSources,
      })
    }
    if (expectedMaster && terminalImage
      && (terminalImage.naturalWidth !== expectedMaster.width || terminalImage.naturalHeight !== expectedMaster.height)) {
      addFailure('terminal_poster_dimensions', 'Terminal poster dimensions do not match the opening/video master', {
        expected: expectedMaster,
        terminal: { width: terminalImage.naturalWidth, height: terminalImage.naturalHeight },
      })
    }
    if (!decoderReleased) addFailure('decoder_release', 'Terminal poster did not own pixels with the video decoder released')
    if (!terminalStillPixelsMatch) {
      addFailure('terminal_motion', 'Terminal hero pixels changed during the 700ms motionless hold', {
        first: firstTerminalHost?.sha256 ?? null,
        second: secondTerminalHost?.sha256 ?? null,
      })
    }
  }

  if (scenario === 'visibility-resume') {
    if (!scenarioResult?.sameSource || scenarioResult.stableWhileHiddenSeconds > 0.04
      || scenarioResult.paused?.video?.paused !== true || scenarioResult.resumed?.video?.paused !== false) {
      addFailure('visibility_resume', 'Hide/show did not pause motionlessly and resume the same source/time', scenarioResult)
    }
  }
  if (scenario === 'offscreen-resume') {
    if (!scenarioResult?.sameSource || scenarioResult.stableWhileOffscreenSeconds > 0.04
      || scenarioResult.paused?.video?.paused !== true || scenarioResult.resumed?.video?.paused !== false) {
      addFailure('offscreen_resume', 'Offscreen/return did not pause motionlessly and resume the same source/time', scenarioResult)
    }
  }

  if (values['range-policy'] === 'allow-full') {
    warnings.push({
      code: 'range_not_enforced',
      message: 'HTTP Range/206 delivery was not required because --range-policy allow-full was supplied.',
    })
  }
  if (scenario === 'autoplay-denied' || scenario === 'visibility-resume') {
    warnings.push({
      code: 'scenario_browser_shim',
      message: scenarioMechanisms[scenario],
    })
  }
} catch (error) {
  fatalError = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { name: 'Error', message: String(error), stack: null }
  addFailure('harness_error', fatalError.message)
  if (page && !page.isClosed()) {
    try { await capture('failure-homepage') } catch {}
    try {
      finalEvidence = await page.evaluate(() => ({
        ...globalThis.__isoPlaybackEvidence,
        final: globalThis.__isoPlaybackSnapshot?.('failure-browser-evidence') ?? null,
      }))
    } catch {}
  }
} finally {
  try {
    if (cpuThrottle > 1 && cdp) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  } catch {}
  try { await context?.close() } catch {}
  try { await browser?.close() } catch {}
}

const report = {
  schema: 'bitterclip.iso4-artifact-playback.v1',
  pass: failures.length === 0,
  target: target.href,
  capturedAt: new Date().toISOString(),
  configuration: {
    viewport,
    dpr,
    browserName,
    browserVersion,
    browserUserAgent,
    cpuThrottle,
    timeoutMs,
    geometryToleranceCssPx: geometryTolerance,
    maxHandoffMediaTimeSeconds: maxHandoffMediaTime,
    maxDroppedFrames,
    maxLongTaskMs,
    expectedDurationSeconds: expectedDuration,
    durationToleranceSeconds: durationTolerance,
    scenario,
    scenarioMechanism: scenarioMechanisms[scenario],
    rangePolicy: values['range-policy'],
    headed: values.headed,
  },
  failures,
  warnings,
  fatalError,
  playback,
  geometry,
  screenshots: screenshotRecords,
  browserEvidence: finalEvidence,
  explicitSamples,
  isoAssetNetwork,
  allNetworkRequests: network,
}
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)

if (failures.length) {
  console.error(`ISO4 Artifact playback acceptance failed (${failures.length} finding${failures.length === 1 ? '' : 's'}).`)
  for (const failure of failures) console.error(`- ${failure.code}: ${failure.message}`)
  console.error(reportPath)
  process.exitCode = 1
} else {
  console.log(`ISO4 Artifact playback acceptance passed: ${reportPath}`)
}
