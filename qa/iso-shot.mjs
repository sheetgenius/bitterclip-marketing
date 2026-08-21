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

const args = process.argv.slice(2)
const prefix = args[0]
let clip = null
let viewport = { width: 1600, height: 900 }
let metrics = false
let scrollY = 0
let dpr = 2
let reducedMotion = false
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
  } else if (args[i] === '--fragments') {
    workshop.fragmentsPerPacket = Number(args[++i])
    if (![3, 6, 9].includes(workshop.fragmentsPerPacket)) throw new Error('fragments must be 3, 6, or 9')
  } else if (args[i] === '--color') {
    workshop.colorScript = args[++i]
  } else if (args[i] === '--sampling') {
    workshop.samplingStrategy = args[++i]
  } else times.push(Number(args[i]))
}
if (!times.length) times.push(2.35)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport, deviceScaleFactor: dpr, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' })
page.on('pageerror', (e) => console.error('PAGEERROR', e.message))
// 'load', not 'networkidle': the live clip embed keeps the network busy
// forever; scene readiness is guarded by the __iso wait below anyway.
await page.goto(process.env.ISO_URL || 'http://localhost:4180/', { waitUntil: 'load' })
await page.waitForFunction(() => !!window.__iso, null, { timeout: 15000 })
await page.waitForFunction(() => window.__iso.sourceReady?.() ?? true, null, { timeout: 15000 })
if (Object.keys(workshop).length) await page.evaluate((options) => window.__iso.configure(options), workshop)
if (scrollY) {
  // behavior:'instant' overrides the page's scroll-behavior:smooth — in
  // headless the smooth animation stalls (no rAF) and shots catch mid-scroll.
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY)
  await page.waitForTimeout(120)
}
for (const t of times) {
  await page.evaluate((tt) => window.__iso.still(tt), t)
  await page.waitForTimeout(80)
  const path = `${prefix}-t${t.toFixed(2)}.png`
  await page.screenshot({ path, ...(clip ? { clip } : {}) })
  console.log('wrote', path)
  if (metrics) {
    const report = await page.evaluate((tt) => window.__iso.inspect?.(tt) ?? null, t)
    console.log('motion', JSON.stringify(report))
  }
}
await browser.close()
