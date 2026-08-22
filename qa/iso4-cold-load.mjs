// Cold-navigation evidence harness for the canonical homepage ISO4 takeover.
// Records the real viewport while sampling the server-rendered prepaint,
// WebGL canvas, layout shifts, long tasks, and scene clock at roughly 60Hz.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const output = resolve(args[0] || 'tmp/iso4-homepage-workshop/cold-load/homepage.webm')
let viewport = { width: 1600, height: 900 }
let dpr = 2
let durationMs = 2400
let hardware = false
let url = process.env.ISO_URL || 'http://localhost:4180/'
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--viewport') {
    const [width, height] = args[++i].split('x').map(Number)
    viewport = { width, height }
  } else if (args[i] === '--dpr') dpr = Number(args[++i])
  else if (args[i] === '--duration') durationMs = Number(args[++i])
  else if (args[i] === '--hardware') hardware = true
  else if (args[i] === '--url') url = args[++i]
}

await mkdir(dirname(output), { recursive: true })
const browser = await chromium.launch(hardware
  ? { headless: false, channel: 'chrome', args: ['--use-angle=metal'] }
  : { headless: true })
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: dpr,
  recordVideo: { dir: dirname(output), size: viewport },
})
const page = await context.newPage()
await page.addInitScript(() => {
  const evidence = {
    layoutShifts: [],
    longTasks: [],
    paints: [],
  }
  globalThis.__isoColdEvidence = evidence
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          evidence.layoutShifts.push({
            at: entry.startTime,
            value: entry.value,
            sources: entry.sources?.map((source) => source.node?.className || source.node?.nodeName || '') ?? [],
          })
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        evidence.longTasks.push({ at: entry.startTime, duration: entry.duration })
      }
    }).observe({ type: 'longtask', buffered: true })
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        evidence.paints.push({ name: entry.name, at: entry.startTime })
      }
    }).observe({ type: 'paint', buffered: true })
  } catch {}
})

await page.goto('data:text/html,<style>html{background:%2308090a}</style>')
const navigationStarted = performance.now()
await page.goto(url, { waitUntil: 'commit' })
const committedAtMs = performance.now() - navigationStarted
const samples = []
while (performance.now() - navigationStarted < durationMs) {
  const hostAtMs = performance.now() - navigationStarted
  const state = await page.evaluate(() => {
    const host = document.querySelector('.iso4')
    const prepaint = document.querySelector('.iso4__prepaint')
    const image = prepaint?.querySelector('img')
    const canvas = document.querySelector('.iso4__gl')
    const stage = document.querySelector('.iso4-stage')
    const box = (element) => {
      if (!element) return null
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        opacity: Number(style.opacity),
        display: style.display,
        visibility: style.visibility,
      }
    }
    return {
      performanceNowMs: performance.now(),
      readyState: document.readyState,
      hostClass: host?.className ?? '',
      host: box(host),
      stage: box(stage),
      prepaint: box(prepaint),
      image: {
        box: box(image),
        complete: image?.complete ?? false,
        currentSrc: image?.currentSrc ?? '',
        naturalWidth: image?.naturalWidth ?? 0,
        naturalHeight: image?.naturalHeight ?? 0,
      },
      canvas: {
        box: box(canvas),
        width: canvas?.width ?? 0,
        height: canvas?.height ?? 0,
      },
      sceneReady: Boolean(globalThis.__iso),
      timelineSeconds: globalThis.__iso?.temporal?.().timelineSeconds ?? null,
    }
  }).catch(() => null)
  samples.push({ hostAtMs, state })
  await page.waitForTimeout(16)
}

const browserEvidence = await page.evaluate(() => ({
  observers: globalThis.__isoColdEvidence,
  navigation: performance.getEntriesByType('navigation').map((entry) => ({
    startTime: entry.startTime,
    responseStart: entry.responseStart,
    responseEnd: entry.responseEnd,
    domInteractive: entry.domInteractive,
    domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
    loadEventEnd: entry.loadEventEnd,
  })),
  largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint').map((entry) => ({
    at: entry.startTime,
    size: entry.size,
    element: entry.element?.className || entry.element?.nodeName || '',
  })),
  measures: performance.getEntriesByType('measure')
    .filter((entry) => entry.name.startsWith('iso4:'))
    .map((entry) => ({ name: entry.name, startTime: entry.startTime, duration: entry.duration })),
}))
await page.screenshot({ path: `${output}.png` })
const video = page.video()
await page.close()
if (video) await video.saveAs(output)
await context.close()
await browser.close()
await writeFile(`${output}.json`, `${JSON.stringify({
  url,
  viewport,
  dpr,
  hardware,
  durationMs,
  committedAtMs,
  samples,
  browserEvidence,
}, null, 2)}\n`)
console.log(output)
