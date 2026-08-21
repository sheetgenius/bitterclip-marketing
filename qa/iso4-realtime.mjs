// Real-time, cold-load evidence harness for the canonical homepage ISO4.
// Records the complete browser viewport and samples the scene's temporal
// diagnostics while the live media path runs at wall-clock speed.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const output = resolve(args[0] || 'tmp/iso4-homepage-workshop/realtime/homepage.webm')
let viewport = { width: 1600, height: 900 }
let dpr = 1
let durationSeconds = 12.5
let reducedMotion = false
let hardware = false
let recordVideo = true
let recordSize = null
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--viewport') {
    const [width, height] = args[++i].split('x').map(Number)
    viewport = { width, height }
  } else if (args[i] === '--dpr') dpr = Number(args[++i])
  else if (args[i] === '--duration') durationSeconds = Number(args[++i])
  else if (args[i] === '--reduced-motion') reducedMotion = true
  else if (args[i] === '--hardware') hardware = true
  else if (args[i] === '--no-video') recordVideo = false
  else if (args[i] === '--record-size') {
    const [width, height] = args[++i].split('x').map(Number)
    if (!(width > 0 && height > 0)) throw new Error('record-size must be WIDTHxHEIGHT')
    recordSize = { width, height }
  }
}

await mkdir(dirname(output), { recursive: true })
const browser = await chromium.launch(hardware
  ? { headless: false, channel: 'chrome', args: ['--use-angle=metal'] }
  : { headless: true })
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: dpr,
  reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  ...(recordVideo ? { recordVideo: { dir: dirname(output), size: recordSize ?? viewport } } : {}),
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
// Playwright starts recording at about:blank, whose browser-default white
// background is not a page cold-paint. Establish the product's void color
// before the measured navigation so the evidence begins on a neutral dark
// transport frame while every homepage module and media resource remains cold.
if (recordVideo) {
  await page.goto('data:text/html,<style>html{background:%2308090a}</style>')
}
const startedAt = performance.now()
await page.goto(process.env.ISO_URL || 'http://localhost:4180/', { waitUntil: 'load' })
await page.waitForFunction(() => !!window.__iso, null, { timeout: 15000 })
const sceneReadyAtMs = performance.now() - startedAt
const samples = []
const sampleStarted = performance.now()
while (performance.now() - sampleStarted < durationSeconds * 1000) {
  await page.waitForTimeout(500)
  samples.push(await page.evaluate(() => ({
    sourceReady: window.__iso.sourceReady?.() ?? true,
    temporal: window.__iso.temporal(),
  })))
}
const finalMotion = await page.evaluate(() => {
  const temporal = window.__iso.temporal()
  window.__iso.stop()
  return window.__iso.inspect(temporal.timelineSeconds)
})
const gpu = await page.evaluate(() => {
  const canvas = document.querySelector('.iso4__gl')
  const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl')
  if (!gl) return { renderer: 'unavailable', vendor: 'unavailable' }
  const debug = gl.getExtension('WEBGL_debug_renderer_info')
  return {
    renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
  }
})
await page.screenshot({ path: `${output}.png` })
const video = page.video()
await page.close()
if (video) await video.saveAs(output)
await context.close()
await browser.close()
await writeFile(`${output}.json`, `${JSON.stringify({
  url: process.env.ISO_URL || 'http://localhost:4180/',
  viewport,
  dpr,
  hardware,
  recordVideo,
  recordSize: recordSize ?? (recordVideo ? viewport : null),
  reducedMotion,
  durationSeconds,
  sceneReadyAtMs,
  gpu,
  errors,
  samples,
  finalMotion,
}, null, 2)}\n`)
console.log(output)
