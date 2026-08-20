// Deterministic screenshot harness for the /lab/iso hero workshop.
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
const times = []
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--clip') {
    const [x, y, w, h] = args[++i].split(',').map(Number)
    clip = { x, y, width: w, height: h }
  } else if (args[i] === '--viewport') {
    const [width, height] = args[++i].split('x').map(Number)
    if (!(width > 0 && height > 0)) throw new Error('viewport must be WIDTHxHEIGHT')
    viewport = { width, height }
  } else if (args[i] === '--metrics') {
    metrics = true
  } else times.push(Number(args[i]))
}
if (!times.length) times.push(2.35)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport, deviceScaleFactor: 2 })
page.on('pageerror', (e) => console.error('PAGEERROR', e.message))
await page.goto(process.env.ISO_URL || 'http://localhost:4180/lab/iso', { waitUntil: 'networkidle' })
await page.waitForFunction(() => !!window.__iso, null, { timeout: 15000 })
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
