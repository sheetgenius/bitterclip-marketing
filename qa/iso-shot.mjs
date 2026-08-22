// Deterministic screenshot harness for the homepage ISO4 acceptance surface.
//
// The renderer exposes itself as window.__iso (see HeroIso.client.vue), so a
// frame can be frozen at an exact animation time — two builds compared at the
// same t are actually comparable. Run from the repo root so @playwright/test
// resolves:
//
//   node qa/iso-shot.mjs tmp/iso/<name> 0.60 2.35 5.80
//   node qa/iso-shot.mjs tmp/iso/<name> --clip 790,150,350,320 2.35
//   node qa/iso-shot.mjs tmp/iso/<name> --viewport 440x956 --metrics 2.70 4.80 6.80
//
// Clip coords are viewport px (1600x900 unless --viewport overrides it); PNGs
// come out at 2x. Point ISO_URL
// at your server — default assumes `bun run dev --port 4180`. NOTE: the dev
// server binds IPv6-only on this machine, so the default uses `localhost`,
// not 127.0.0.1.
import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

const args = process.argv.slice(2)
const prefix = args[0]
let clip = null
let viewport = { width: 1600, height: 900 }
let metrics = false
let scrollY = 0
let dpr = 2
let reducedMotion = false
let hardware = false
let canvasOnly = false
const workshop = {}
const times = []
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--clip') {
    const [x, y, w, h] = args[++i].split(',').map(Number)
    clip = { x, y, width: w, height: h }
  } else if (args[i] === '--scroll') {
    scrollY = Number(args[++i])
  } else if (args[i] === '--viewport') {
    const [width, height] = args[++i].split('x').map(Number)
    if (!(width > 0 && height > 0)) throw new Error('viewport must be WIDTHxHEIGHT')
    viewport = { width, height }
  } else if (args[i] === '--metrics') {
    metrics = true
  } else if (args[i] === '--dpr') {
    dpr = Number(args[++i])
    if (!(dpr > 0 && dpr <= 2)) throw new Error('dpr must be greater than 0 and at most 2')
  } else if (args[i] === '--reduced-motion') {
    reducedMotion = true
  } else if (args[i] === '--hardware') {
    hardware = true
  } else if (args[i] === '--canvas') {
    canvasOnly = true
  } else if (args[i] === '--fragments') {
    workshop.fragmentsPerPacket = Number(args[++i])
    if (![3, 6, 9].includes(workshop.fragmentsPerPacket)) throw new Error('fragments must be 3, 6, or 9')
  } else if (args[i] === '--color') {
    workshop.colorScript = args[++i]
  } else if (args[i] === '--sampling') {
    workshop.samplingStrategy = args[++i]
    if (!['uniform', 'importance', 'hybrid', 'screen-grid'].includes(workshop.samplingStrategy)) {
      throw new Error('sampling must be uniform, importance, hybrid, or screen-grid')
    }
  } else if (args[i] === '--entrance') {
    workshop.entranceTrajectory = args[++i]
    if (!['shallow-toss', 'depth-swish', 'frontal-toss'].includes(workshop.entranceTrajectory)) {
      throw new Error('entrance must be shallow-toss, depth-swish, or frontal-toss')
    }
  } else if (args[i] === '--fracture') {
    workshop.fractureStyle = args[++i]
    if (!['planar', 'depth-forward', 'balanced'].includes(workshop.fractureStyle)) {
      throw new Error('fracture must be planar, depth-forward, or balanced')
    }
  } else if (args[i] === '--field') {
    workshop.fieldKernel = args[++i]
    if (!['screened', 'compact', 'gaussian'].includes(workshop.fieldKernel)) {
      throw new Error('field must be screened, compact, or gaussian')
    }
  } else if (args[i] === '--retention') {
    workshop.tangentialRetention = Number(args[++i])
    if (![0.15, 0.22, 0.3].includes(workshop.tangentialRetention)) {
      throw new Error('retention must be 0.15, 0.22, or 0.3')
    }
  } else if (args[i] === '--attraction') {
    workshop.attractionTime = Number(args[++i])
    if (![0.58, 0.68, 0.78].includes(workshop.attractionTime)) {
      throw new Error('attraction must be 0.58, 0.68, or 0.78')
    }
  } else if (args[i] === '--mouth') {
    workshop.mouthRadiusScale = Number(args[++i])
    if (![1.05, 1.12, 1.2].includes(workshop.mouthRadiusScale)) {
      throw new Error('mouth must be 1.05, 1.12, or 1.2')
    }
  } else if (args[i] === '--field-hz') {
    workshop.fieldIntegrationHz = Number(args[++i])
    if (![120, 240].includes(workshop.fieldIntegrationHz)) {
      throw new Error('field-hz must be 120 or 240')
    }
  } else times.push(Number(args[i]))
}
if (!times.length) times.push(2.35)

const browser = await chromium.launch(hardware
  ? { headless: false, channel: 'chrome', args: ['--use-angle=metal'] }
  : undefined)
const page = await browser.newPage({ viewport, deviceScaleFactor: dpr, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' })
page.on('pageerror', (e) => console.error('PAGEERROR', e.message))
// Stop at DOM readiness. The below-fold proof video intentionally preloads
// metadata and can hold the window load event open; scene readiness is guarded
// independently by the __iso and sourceReady waits below.
await page.goto(process.env.ISO_URL || 'http://localhost:4180/', { waitUntil: 'domcontentloaded' })
const sceneTimeoutMs = Number(process.env.ISO_SCENE_TIMEOUT_MS || 15000)
await page.waitForFunction(() => !!window.__iso, null, { timeout: sceneTimeoutMs })
await page.waitForFunction(() => window.__iso.sourceReady?.() ?? true, null, { timeout: sceneTimeoutMs })
if (Object.keys(workshop).length) await page.evaluate((options) => window.__iso.configure(options), workshop)
if (scrollY) {
  // behavior:'instant' overrides the page's scroll-behavior:smooth — in
  // headless the smooth animation stalls (no rAF) and shots catch mid-scroll.
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY)
  await page.waitForTimeout(120)
}
for (const t of times) {
  const path = `${prefix}-t${t.toFixed(2)}.png`
  if (canvasOnly) {
    // Element screenshots capture later DOM layers that overlap the canvas.
    // Read the WebGL backing store in the same task as still() so a runtime
    // prepaint contains only scene pixels, never duplicated homepage copy.
    const dataUrl = await page.evaluate((tt) => {
      window.__iso.still(tt)
      return document.querySelector('.iso4__gl').toDataURL('image/png')
    }, t)
    await writeFile(path, Buffer.from(dataUrl.split(',')[1], 'base64'))
  } else {
    await page.evaluate((tt) => window.__iso.still(tt), t)
    await page.waitForTimeout(80)
    await page.screenshot({ path, ...(clip ? { clip } : {}) })
  }
  console.log('wrote', path)
  if (metrics) {
    const report = await page.evaluate((tt) => window.__iso.inspect?.(tt) ?? null, t)
    console.log('motion', JSON.stringify(report))
  }
}
await browser.close()
