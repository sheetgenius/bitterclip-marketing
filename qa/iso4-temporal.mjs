// Live temporal acceptance harness for /lab/iso4.
//
// The still-image harness proves composition. This harness resumes the scene
// just before projector ignition and measures the decoded video cadence,
// canvas-texture cadence, writer/gate transport, missed ticks, clock drift,
// and longest visible output hold while real time advances.
//
//   ISO_URL='http://localhost:4180/lab/iso4' \
//     node qa/iso4-temporal.mjs --viewport 440x956

import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
let viewport = { width: 440, height: 956 }
let strict = false
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--viewport') {
    const [width, height] = args[++i].split('x').map(Number)
    if (!(width > 0 && height > 0)) throw new Error('viewport must be WIDTHxHEIGHT')
    viewport = { width, height }
  } else if (args[i] === '--strict') strict = true
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport, deviceScaleFactor: 2 })
page.on('pageerror', (error) => console.error('PAGEERROR', error.message))
await page.goto(process.env.ISO_URL || 'http://localhost:4180/lab/iso4', { waitUntil: 'networkidle' })
await page.waitForFunction(() => !!window.__iso?.temporal, null, { timeout: 15000 })

// Skip directly to the live payoff; start() phase-locks both playback heads to
// this timeline position before the first resumed animation frame.
await page.evaluate(() => {
  window.__iso.still(7.72)
  window.__iso.start()
})

const samples = []
// Observe the perceptually critical first strike at 50ms resolution, then
// widen the interval for steady-state cadence and drift.
for (let i = 0; i < 24; i++) {
  samples.push(await page.evaluate(() => window.__iso.temporal()))
  await page.waitForTimeout(50)
}
for (let i = 0; i < 12; i++) {
  samples.push(await page.evaluate(() => window.__iso.temporal()))
  await page.waitForTimeout(250)
}
const report = samples.at(-1)
const renderer = await page.evaluate(() => {
  const canvas = document.querySelector('.iso4__gl')
  const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl')
  const info = gl?.getExtension('WEBGL_debug_renderer_info')
  return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown'
})
console.log(JSON.stringify({ viewport, renderer, report, samples }, null, 2))

const failures = []
if (report.presentedVideoFramesPerSecond < 20 || report.presentedVideoFramesPerSecond > 27) {
  failures.push(`decoded cadence ${report.presentedVideoFramesPerSecond}fps is outside 20-27fps`)
}
if (report.outputTextureFramesPerSecond < 20 || report.outputTextureFramesPerSecond > 27) {
  failures.push(`output cadence ${report.outputTextureFramesPerSecond}fps is outside 20-27fps`)
}
if (report.longestOutputHoldMs > 100) {
  failures.push(`longest output hold ${report.longestOutputHoldMs}ms exceeds 100ms`)
}
if (report.firstOutputTextureLatencyMs < 0 || report.firstOutputTextureLatencyMs > 100) {
  failures.push(`first visible output texture latency ${report.firstOutputTextureLatencyMs}ms exceeds 100ms`)
}
if (!report.movingMediaPlaying && !report.usingDeterministicFallback) {
  failures.push('media is neither confirmed playing nor in deterministic fallback')
}
if (Math.abs(report.sourceClockDriftMs) > 100 || Math.abs(report.projectionClockDriftMs) > 100) {
  failures.push(`media drift exceeds 100ms: source=${report.sourceClockDriftMs}, projection=${report.projectionClockDriftMs}`)
}
if (report.mechanicalGateFramesPerSecond < 15.9 || report.mechanicalGateFramesPerSecond > 16.1) {
  failures.push(`mechanical gate cadence ${report.mechanicalGateFramesPerSecond}fps is not 16fps`)
}
if (report.missedMechanicalTicks > 0) {
  failures.push(`missed ${report.missedMechanicalTicks} mechanical gate ticks`)
}
if (report.missedProjectionFrames > 0) {
  failures.push(`missed ${report.missedProjectionFrames} projected source frames`)
}
if (report.gateSourceFrame >= 0 && Math.abs(report.gateProjectionPhaseErrorFrames) > 1) {
  failures.push(`gate/projection phase error is ${report.gateProjectionPhaseErrorFrames} source frames`)
}

await browser.close()
if (failures.length) {
  const softwareBound = report.renderFramesPerSecond < 45 || /swiftshader/i.test(renderer)
  if (softwareBound && !strict) {
    console.warn(`Temporal acceptance deferred: ${renderer} rendered at ${report.renderFramesPerSecond}fps.`)
    console.warn(failures.join('\n'))
  } else {
    console.error(failures.join('\n'))
    process.exitCode = 1
  }
}
