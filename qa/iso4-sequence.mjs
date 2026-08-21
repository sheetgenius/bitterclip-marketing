// Deterministic 60fps full-homepage evidence. Every encoded frame is rendered
// at an exact ISO4 timeline time before the complete viewport is captured.
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const outputDir = resolve(args[0] || 'tmp/iso4-homepage-workshop/sequence/frames')
let viewport = { width: 1600, height: 900 }
let dpr = 1
let start = 0
let end = 12
let fps = 60
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--viewport') {
    const [width, height] = args[++i].split('x').map(Number)
    viewport = { width, height }
  } else if (args[i] === '--dpr') dpr = Number(args[++i])
  else if (args[i] === '--start') start = Number(args[++i])
  else if (args[i] === '--end') end = Number(args[++i])
  else if (args[i] === '--fps') fps = Number(args[++i])
}

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport, deviceScaleFactor: dpr })
await page.goto(process.env.ISO_URL || 'http://localhost:4180/', { waitUntil: 'load' })
await page.waitForFunction(() => !!window.__iso, null, { timeout: 15000 })
await page.waitForFunction(() => window.__iso.sourceReady?.() ?? true, null, { timeout: 15000 })
await page.evaluate(() => window.__iso.configure({
  fragmentsPerPacket: 6,
  colorScript: 'spectral-pearl',
  samplingStrategy: 'hybrid',
}))
const count = Math.round((end - start) * fps) + 1
for (let frame = 0; frame < count; frame++) {
  const t = start + frame / fps
  await page.evaluate((time) => window.__iso.still(time), t)
  await page.screenshot({
    path: `${outputDir}/frame-${String(frame).padStart(4, '0')}.jpg`,
    type: 'jpeg',
    quality: 84,
  })
  if (frame % fps === 0) console.log(`${t.toFixed(2)}s / ${end.toFixed(2)}s`)
}
await browser.close()
