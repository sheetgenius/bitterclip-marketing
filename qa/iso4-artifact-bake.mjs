#!/usr/bin/env node

/**
 * Offline release baker for the canonical homepage ISO4 scene.
 *
 * Generated media is deliberately restricted to a caller-owned directory
 * under tmp/. The script never screenshots the DOM: every output pixel comes
 * from the WebGL canvas backing store after an exact release-frame render.
 *
 * Full release:
 *   node qa/iso4-artifact-bake.mjs tmp/iso4-release/wide \
 *     --viewport 1600x900 --dpr 1 --hardware
 *
 * Short pipeline proof (still emits both exact posters and determinism checks):
 *   node qa/iso4-artifact-bake.mjs tmp/iso4-release/proof \
 *     --viewport 480x270 --dpr 1 --proof-frames 3
 */

import { chromium } from '@playwright/test'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { createReadStream } from 'node:fs'
import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import {
  captureRendererInputReceipt,
  ISO4_LIVE_MEDIA_PATH,
} from './iso4-artifact-provenance.mjs'

const SCRIPT_VERSION = 'iso4-artifact-bake/v2'
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const TMP_ROOT = resolve(REPO_ROOT, 'tmp')
const DEFAULT_SOURCE = resolve(REPO_ROOT, ISO4_LIVE_MEDIA_PATH)
const SOURCE_FPS = 24
const SOURCE_FRAME_COUNT = 288
const SOURCE_FRAME_WIDTH = 640
const SOURCE_FRAME_HEIGHT = 360
const ATLAS_COLUMNS = 8
const ATLAS_ROWS = 3
const ATLAS_FRAME_COUNT = ATLAS_COLUMNS * ATLAS_ROWS
const ATLAS_COUNT = SOURCE_FRAME_COUNT / ATLAS_FRAME_COUNT
const OUTPUT_FPS = 60
const TERMINAL_HOLD_SECONDS = 0.35
// scene.ts derives this from the accepted centered Geneva stop. Any time at or
// after this value is visually static; the release receipt records it so a
// changed mechanical stop cannot be shipped silently.
const DEFAULT_TERMINAL_TIME = 14.007975290939214
const ACCEPTED_WORKSHOP = Object.freeze({
  fragmentsPerPacket: 6,
  colorScript: 'information-red',
  samplingStrategy: 'screen-grid',
  entranceTrajectory: 'depth-swish',
  fractureStyle: 'planar',
  fieldKernel: 'gaussian',
  tangentialRetention: 0.22,
  attractionTime: 0.68,
  mouthRadiusScale: 1.12,
  fieldIntegrationHz: 240,
})
const DEFAULT_IDENTITY_TIMES = Object.freeze([
  0,
  1.8,
  2.16,
  3.8,
  7.87,
  12.87,
  DEFAULT_TERMINAL_TIME,
])

function usage() {
  return `Usage:
  node qa/iso4-artifact-bake.mjs <tmp-output-dir> [options]

Options:
  --viewport WIDTHxHEIGHT   Homepage viewport (default: 1600x900)
  --dpr NUMBER              Browser/device pixel ratio, 0.5-2 (default: 1)
  --url URL                 Running homepage (default: ISO_URL or localhost:4180/)
  --source PATH             Episode source (default: public/clips/ep1-loop.mp4)
  --terminal-time SECONDS   Exact terminal poster time (default: ${DEFAULT_TERMINAL_TIME})
  --hardware                Use installed Chrome with Metal in a visible window
  --proof-frames COUNT      Bake only the first COUNT master frames; posters and
                            determinism proof and terminal hold are still complete
  --scene-timeout MS        Wait for window.__iso (default: 30000)
  --help                    Show this message

The output directory must be inside ${TMP_ROOT}.
Existing release outputs are never overwritten.`
}

function parsePositiveNumber(value, label) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${label} must be positive`)
  return parsed
}

function parsePositiveInteger(value, label) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} must be a positive integer`)
  return parsed
}

function parseArgs(argv) {
  if (!argv.length || argv.includes('--help')) {
    console.log(usage())
    process.exit(argv.includes('--help') ? 0 : 1)
  }
  const options = {
    outputDir: resolve(argv[0]),
    viewport: { width: 1600, height: 900 },
    dpr: 1,
    url: process.env.ISO_URL || 'http://localhost:4180/',
    source: DEFAULT_SOURCE,
    terminalTime: DEFAULT_TERMINAL_TIME,
    hardware: false,
    proofFrames: null,
    sceneTimeoutMs: 30_000,
  }
  for (let index = 1; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--viewport') {
      const [width, height] = String(argv[++index] || '').split('x').map(Number)
      if (!(width > 0 && height > 0)) throw new Error('viewport must be WIDTHxHEIGHT')
      options.viewport = { width, height }
    } else if (arg === '--dpr') {
      options.dpr = parsePositiveNumber(argv[++index], 'dpr')
      if (options.dpr < 0.5 || options.dpr > 2) throw new Error('dpr must be between 0.5 and 2')
    } else if (arg === '--url') {
      options.url = new URL(argv[++index]).href
    } else if (arg === '--source') {
      options.source = resolve(argv[++index])
    } else if (arg === '--terminal-time') {
      options.terminalTime = parsePositiveNumber(argv[++index], 'terminal-time')
    } else if (arg === '--hardware') {
      options.hardware = true
    } else if (arg === '--proof-frames') {
      options.proofFrames = parsePositiveInteger(argv[++index], 'proof-frames')
    } else if (arg === '--scene-timeout') {
      options.sceneTimeoutMs = parsePositiveInteger(argv[++index], 'scene-timeout')
    } else {
      throw new Error(`unknown argument: ${arg}`)
    }
  }
  if (new URL(options.url).pathname !== '/') {
    throw new Error('release baking is homepage-only: --url must have pathname /')
  }
  return options
}

function isInside(parent, child) {
  const prefix = parent.endsWith(sep) ? parent : `${parent}${sep}`
  return child === parent || child.startsWith(prefix)
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function commandText(command, args) {
  return [command, ...args].map((part) => JSON.stringify(String(part))).join(' ')
}

async function run(command, args, { cwd = REPO_ROOT, stdin = null } = {}) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const stdout = []
  const stderr = []
  child.stdout.on('data', (chunk) => stdout.push(chunk))
  child.stderr.on('data', (chunk) => stderr.push(chunk))
  if (stdin) child.stdin.end(stdin)
  else child.stdin.end()
  const [code, signal] = await once(child, 'close')
  const output = Buffer.concat(stdout).toString('utf8')
  const errorOutput = Buffer.concat(stderr).toString('utf8')
  if (code !== 0) {
    throw new Error(`${commandText(command, args)} failed (${signal || code})\n${errorOutput || output}`)
  }
  return { stdout: output, stderr: errorOutput }
}

async function runBuffer(command, args, { cwd = REPO_ROOT } = {}) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const stdout = []
  const stderr = []
  child.stdout.on('data', (chunk) => stdout.push(chunk))
  child.stderr.on('data', (chunk) => stderr.push(chunk))
  const [code, signal] = await once(child, 'close')
  const output = Buffer.concat(stdout)
  const errorOutput = Buffer.concat(stderr).toString('utf8')
  if (code !== 0) {
    throw new Error(`${commandText(command, args)} failed (${signal || code})\n${errorOutput}`)
  }
  return output
}

async function probe(path, { countFrames = false } = {}) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    ...(countFrames ? ['-count_frames'] : []),
    '-show_streams',
    '-show_format',
    '-of', 'json',
    path,
  ])
  return JSON.parse(stdout)
}

async function sha256(path) {
  const hash = createHash('sha256')
  const stream = createReadStream(path)
  stream.on('data', (chunk) => hash.update(chunk))
  await once(stream, 'end')
  return hash.digest('hex')
}

function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function rationalNumber(value) {
  if (typeof value !== 'string') return Number(value)
  const [numerator, denominator = '1'] = value.split('/')
  return Number(numerator) / Number(denominator)
}

function assertSourceContract(sourceProbe) {
  const videos = sourceProbe.streams.filter((stream) => stream.codec_type === 'video')
  const audios = sourceProbe.streams.filter((stream) => stream.codec_type === 'audio')
  if (videos.length !== 1) throw new Error(`source must contain exactly one video stream; found ${videos.length}`)
  if (audios.length) throw new Error(`source release loop must be silent; found ${audios.length} audio stream(s)`)
  const video = videos[0]
  const failures = []
  if (video.width !== SOURCE_FRAME_WIDTH || video.height !== SOURCE_FRAME_HEIGHT) {
    failures.push(`dimensions ${video.width}x${video.height}`)
  }
  if (Math.abs(rationalNumber(video.avg_frame_rate) - SOURCE_FPS) > 1e-6) {
    failures.push(`frame rate ${video.avg_frame_rate}`)
  }
  if (Number(video.nb_frames) !== SOURCE_FRAME_COUNT) failures.push(`frame count ${video.nb_frames}`)
  if (failures.length) {
    throw new Error(`source does not satisfy the release atlas contract: ${failures.join(', ')}`)
  }
}

async function extractAtlases(source, atlasDir) {
  await mkdir(atlasDir, { recursive: true })
  const atlasPattern = resolve(atlasDir, 'atlas-%02d.webp')
  const filter = [
    `trim=start_frame=0:end_frame=${SOURCE_FRAME_COUNT}`,
    `setpts=N/(${SOURCE_FPS}*TB)`,
    `scale=${SOURCE_FRAME_WIDTH}:${SOURCE_FRAME_HEIGHT}:flags=lanczos+accurate_rnd+full_chroma_int`,
    `tile=layout=${ATLAS_COLUMNS}x${ATLAS_ROWS}:nb_frames=${ATLAS_FRAME_COUNT}:margin=0:padding=0`,
  ].join(',')
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel', 'error',
    '-i', source,
    '-map', '0:v:0',
    '-vf', filter,
    '-frames:v', String(ATLAS_COUNT),
    '-fps_mode', 'vfr',
    '-c:v', 'libwebp',
    '-lossless', '1',
    // Atlases are ephemeral decoder inputs, not delivery media. Lossless mode
    // owns fidelity; a moderate effort level avoids spending minutes chasing
    // a few temporary megabytes before every release proof.
    '-compression_level', '3',
    '-threads', '0',
    '-quality', '100',
    '-start_number', '0',
    '-n',
    atlasPattern,
  ])
  const names = (await readdir(atlasDir))
    .filter((name) => /^atlas-\d{2}\.webp$/.test(name))
    .sort()
  if (names.length !== ATLAS_COUNT) {
    throw new Error(`expected ${ATLAS_COUNT} atlases; ffmpeg produced ${names.length}`)
  }
  const expectedWidth = SOURCE_FRAME_WIDTH * ATLAS_COLUMNS
  const expectedHeight = SOURCE_FRAME_HEIGHT * ATLAS_ROWS
  const atlases = []
  for (const name of names) {
    const path = resolve(atlasDir, name)
    const atlasProbe = await probe(path)
    const video = atlasProbe.streams.find((stream) => stream.codec_type === 'video')
    if (!video || video.width !== expectedWidth || video.height !== expectedHeight) {
      throw new Error(`${name} is not ${expectedWidth}x${expectedHeight}`)
    }
    const fileStat = await stat(path)
    atlases.push({
      name,
      path,
      bytes: fileStat.size,
      sha256: await sha256(path),
      probe: atlasProbe,
    })
  }
  return atlases
}

async function pngAt(page, time) {
  const capture = await page.evaluate(async (timelineTime) => {
    const api = window.__iso
    if (!api?.renderFrame) throw new Error('ISO4 release API renderFrame(t) is unavailable')
    const renderReceipt = await api.renderFrame(timelineTime)
    const canvas = document.querySelector('.iso4__gl')
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('ISO4 WebGL canvas is unavailable')
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
      renderReceipt,
    }
  }, time)
  const prefix = 'data:image/png;base64,'
  if (!capture.dataUrl.startsWith(prefix)) throw new Error(`canvas did not return a PNG at t=${time}`)
  const buffer = Buffer.from(capture.dataUrl.slice(prefix.length), 'base64')
  if (buffer.length < 8 || buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`invalid canvas PNG at t=${time}`)
  }
  return { ...capture, buffer, sha256: sha256Buffer(buffer) }
}

async function proveFrameIdentity(page, times, failureDir) {
  const ordered = []
  const orderedBuffers = new Map()
  for (const time of times) {
    const frame = await pngAt(page, time)
    orderedBuffers.set(time, frame.buffer)
    ordered.push({
      time,
      sha256: frame.sha256,
      bytes: frame.buffer.length,
      renderReceipt: frame.renderReceipt,
    })
  }
  const repeated = []
  for (const time of times) {
    const frame = await pngAt(page, time)
    repeated.push({
      time,
      sha256: frame.sha256,
      bytes: frame.buffer.length,
      renderReceipt: frame.renderReceipt,
    })
  }
  const outOfOrder = []
  for (const time of [...times].reverse()) {
    const frame = await pngAt(page, time)
    outOfOrder.push({
      time,
      sha256: frame.sha256,
      bytes: frame.buffer.length,
      renderReceipt: frame.renderReceipt,
    })
  }
  const expected = new Map(ordered.map((sample) => [sample.time, sample.sha256]))
  const mismatches = [
    ...repeated.map((sample) => ({ pass: 'repeated', ...sample })),
    ...outOfOrder.map((sample) => ({ pass: 'out-of-order', ...sample })),
  ]
    .filter((sample) => expected.get(sample.time) !== sample.sha256)
    .map((sample) => ({
      ...sample,
      expectedSha256: expected.get(sample.time),
      actualSha256: sample.sha256,
    }))
  if (mismatches.length) {
    await mkdir(failureDir, { recursive: true })
    for (const mismatch of mismatches) {
      const safeTime = String(mismatch.time).replaceAll('.', '-')
      const expectedBuffer = orderedBuffers.get(mismatch.time)
      if (expectedBuffer) {
        await writeFile(resolve(failureDir, `${safeTime}-ordered.png`), expectedBuffer)
      }
      const actual = await pngAt(page, mismatch.time)
      await writeFile(resolve(failureDir, `${safeTime}-${mismatch.pass}.png`), actual.buffer)
    }
    throw new Error(`release rendering is not seek-order invariant: ${JSON.stringify(mismatches)}`)
  }
  return { pass: true, ordered, repeated, outOfOrder }
}

function ffv1Process(masterPath) {
  const args = [
    '-hide_banner',
    '-loglevel', 'error',
    '-f', 'image2pipe',
    '-framerate', String(OUTPUT_FPS),
    '-vcodec', 'png',
    '-i', 'pipe:0',
    '-map', '0:v:0',
    '-an',
    '-c:v', 'ffv1',
    '-level', '3',
    '-coder', '1',
    '-context', '1',
    '-g', '1',
    '-pix_fmt', 'rgb24',
    '-n',
    masterPath,
  ]
  const child = spawn('ffmpeg', args, {
    cwd: REPO_ROOT,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const stderr = []
  child.stderr.on('data', (chunk) => stderr.push(chunk))
  return { child, args, stderr }
}

async function writeFrame(stream, buffer) {
  if (!stream.write(buffer)) await once(stream, 'drain')
}

async function finishFfmpeg(processInfo) {
  processInfo.child.stdin.end()
  const [code, signal] = await once(processInfo.child, 'close')
  if (code !== 0) {
    throw new Error(
      `${commandText('ffmpeg', processInfo.args)} failed (${signal || code})\n`
      + Buffer.concat(processInfo.stderr).toString('utf8'),
    )
  }
}

async function decodedRgbaFingerprint(path, { frameIndex = null, width, height } = {}) {
  const filter = frameIndex === null ? [] : ['-vf', `select=eq(n\\,${frameIndex})`]
  const buffer = await runBuffer('ffmpeg', [
    '-hide_banner',
    '-loglevel', 'error',
    '-i', path,
    ...filter,
    '-map', '0:v:0',
    '-frames:v', '1',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgba',
    'pipe:1',
  ])
  const expectedBytes = width * height * 4
  if (buffer.length !== expectedBytes) {
    throw new Error(
      `decoded RGBA frame from ${basename(path)} has ${buffer.length} bytes; expected ${expectedBytes}`,
    )
  }
  return { bytes: buffer.length, sha256: sha256Buffer(buffer) }
}

async function gitFingerprint() {
  const [{ stdout: head }, { stdout: branch }, { stdout: status }] = await Promise.all([
    run('git', ['rev-parse', 'HEAD']),
    run('git', ['branch', '--show-current']),
    run('git', ['status', '--short']),
  ])
  return {
    head: head.trim(),
    branch: branch.trim(),
    dirty: Boolean(status.trim()),
    status: status.trim().split('\n').filter(Boolean),
  }
}

async function toolFingerprint(command) {
  const { stdout } = await run(command, ['-version'])
  return stdout.split('\n')[0]
}

async function fileReceipt(path) {
  const fileStat = await stat(path)
  return {
    path,
    relativePath: relative(REPO_ROOT, path),
    bytes: fileStat.size,
    sha256: await sha256(path),
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!isInside(TMP_ROOT, options.outputDir) || options.outputDir === TMP_ROOT) {
    throw new Error(`output must be a dedicated directory under ${TMP_ROOT}`)
  }
  if (!isInside(REPO_ROOT, options.source)) {
    throw new Error('source must be inside the marketing repository')
  }
  if (options.source !== DEFAULT_SOURCE) {
    throw new Error(`release source must be the canonical homepage media: ${ISO4_LIVE_MEDIA_PATH}`)
  }

  const atlasDir = resolve(options.outputDir, 'atlases')
  const posterDir = resolve(options.outputDir, 'posters')
  const receiptPath = resolve(options.outputDir, 'release-receipt.json')
  const failurePath = resolve(options.outputDir, 'release-failure.json')
  const masterPath = resolve(
    options.outputDir,
    `iso4-${options.viewport.width}x${options.viewport.height}-dpr${options.dpr}-${OUTPUT_FPS}fps-ffv1.mkv`,
  )
  const openingPosterPath = resolve(posterDir, 'opening.png')
  const terminalPosterPath = resolve(posterDir, 'terminal.png')
  for (const protectedPath of [receiptPath, failurePath, masterPath, openingPosterPath, terminalPosterPath]) {
    if (await exists(protectedPath)) throw new Error(`refusing to overwrite existing output: ${protectedPath}`)
  }
  await mkdir(atlasDir, { recursive: true })
  await mkdir(posterDir, { recursive: true })

  const startedAt = new Date().toISOString()
  const timings = {}
  const timePhase = async (name, operation) => {
    const started = performance.now()
    const result = await operation()
    timings[`${name}Ms`] = Number((performance.now() - started).toFixed(3))
    return result
  }
  let browser = null
  let context = null
  let page = null
  let ffmpegMaster = null
  const pageErrors = []
  const consoleErrors = []
  const atlasRequests = []
  let rendererInputsAtStart = null

  try {
    rendererInputsAtStart = await timePhase(
      'rendererInputCapture',
      () => captureRendererInputReceipt(REPO_ROOT),
    )
    const sourceProbe = await timePhase('sourceProbe', () => probe(options.source))
    assertSourceContract(sourceProbe)
    const sourceReceipt = {
      ...(await fileReceipt(options.source)),
      probe: sourceProbe,
    }

    console.log(`Extracting ${ATLAS_COUNT} lossless source atlases...`)
    const atlases = await timePhase('atlasExtraction', () => extractAtlases(options.source, atlasDir))
    const atlasUrls = atlases.map((atlas) => `/__iso4_release__/${atlas.name}`)

    browser = await chromium.launch(options.hardware
      ? { headless: false, channel: 'chrome', args: ['--use-angle=metal'] }
      : { headless: true })
    context = await browser.newContext({
      viewport: options.viewport,
      deviceScaleFactor: options.dpr,
      reducedMotion: 'no-preference',
    })
    page = await context.newPage()
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    await page.route('**/__iso4_release__/atlas-*.webp', async (route) => {
      const url = new URL(route.request().url())
      const name = basename(url.pathname)
      const atlas = atlases.find((candidate) => candidate.name === name)
      if (!atlas) {
        await route.fulfill({ status: 404, contentType: 'text/plain', body: 'atlas not found' })
        return
      }
      atlasRequests.push(name)
      await route.fulfill({
        status: 200,
        contentType: 'image/webp',
        headers: { 'Cache-Control': 'no-store' },
        body: await readFile(atlas.path),
      })
    })

    console.log(`Opening canonical homepage ${options.url}`)
    await timePhase('navigation', () => page.goto(options.url, { waitUntil: 'domcontentloaded' }))
    await page.waitForFunction(() => Boolean(window.__iso), null, { timeout: options.sceneTimeoutMs })
    await page.waitForFunction(
      () => Boolean(window.__iso?.sourceReady?.() ?? true),
      null,
      { timeout: options.sceneTimeoutMs },
    )
    const browserVersion = browser.version()
    await page.evaluate((workshop) => window.__iso.configure(workshop), ACCEPTED_WORKSHOP)
    const releaseContract = {
      atlasUrls,
      atlasColumns: ATLAS_COLUMNS,
      atlasRows: ATLAS_ROWS,
      frameWidth: SOURCE_FRAME_WIDTH,
      frameHeight: SOURCE_FRAME_HEIGHT,
      frameCount: SOURCE_FRAME_COUNT,
      sourceFps: SOURCE_FPS,
    }
    const prepareResult = await timePhase(
      'releasePreparation',
      () => page.evaluate(async (contract) => {
        if (!window.__iso?.prepareRelease) {
          throw new Error('ISO4 release API prepareRelease(options) is unavailable')
        }
        return await window.__iso.prepareRelease(contract)
      }, releaseContract),
    )
    const renderer = await page.evaluate(() => {
      const canvas = document.querySelector('.iso4__gl')
      if (!(canvas instanceof HTMLCanvasElement)) throw new Error('ISO4 WebGL canvas is unavailable')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (!gl) throw new Error('ISO4 WebGL context is unavailable')
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      const rect = canvas.getBoundingClientRect()
      return {
        canvas: {
          backingWidth: canvas.width,
          backingHeight: canvas.height,
          cssWidth: rect.width,
          cssHeight: rect.height,
        },
        userAgent: navigator.userAgent,
        vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      }
    })

    const identityTimes = DEFAULT_IDENTITY_TIMES.map((time) => (
      time === DEFAULT_TERMINAL_TIME ? options.terminalTime : time
    ))
    console.log(`Proving repeated and out-of-order identity at ${identityTimes.length} times...`)
    const determinism = await timePhase(
      'determinismProof',
      () => proveFrameIdentity(page, identityTimes, resolve(options.outputDir, 'determinism-failure')),
    )

    const opening = await pngAt(page, 0)
    const terminal = await pngAt(page, options.terminalTime)
    const sceneTerminalFrameIndex = Math.ceil(options.terminalTime * OUTPUT_FPS - 1e-9)
    const lastPreTerminalFrameIndex = sceneTerminalFrameIndex - 1
    const lastPreTerminalGridTime = lastPreTerminalFrameIndex / OUTPUT_FPS
    const lastPreTerminalGridFrame = await pngAt(page, lastPreTerminalGridTime)
    if (opening.width !== terminal.width || opening.height !== terminal.height) {
      throw new Error('opening and terminal backing-store dimensions differ')
    }
    await Promise.all([
      writeFile(openingPosterPath, opening.buffer),
      writeFile(terminalPosterPath, terminal.buffer),
    ])

    // Reset release-owned physical-film history before the ascending master
    // pass. The renderer must produce the same frame after this second prepare.
    await page.evaluate((contract) => window.__iso.prepareRelease(contract), releaseContract)
    const openingAfterReset = await pngAt(page, 0)
    if (openingAfterReset.sha256 !== opening.sha256) {
      throw new Error('prepareRelease is not repeatable: opening-frame hash changed after reset')
    }

    const terminalHoldFrameCount = Math.round(TERMINAL_HOLD_SECONDS * OUTPUT_FPS)
    if (Math.abs(terminalHoldFrameCount / OUTPUT_FPS - TERMINAL_HOLD_SECONDS) > 1e-9) {
      throw new Error('terminal hold must resolve to a whole number of 60fps frames')
    }
    // Grid frames 0..840 cover the scene up to 14.000s. Frame 841 is the
    // accepted, sub-frame Geneva stop at 14.007975s. Holding that exact render
    // for 21 encoded frames gives a true 350ms motionless landing rather than
    // inventing a nearby 60fps scene time that has not fully resolved.
    const sceneDynamicFrameCount = sceneTerminalFrameIndex
    const completeFrameCount = sceneDynamicFrameCount + terminalHoldFrameCount
    const renderedDynamicFrameCount = options.proofFrames
      ? Math.min(options.proofFrames, sceneDynamicFrameCount)
      : sceneDynamicFrameCount
    const masterFrameCount = renderedDynamicFrameCount + terminalHoldFrameCount
    const renderedTerminalFrameIndex = renderedDynamicFrameCount
    console.log(
      `Rendering ${masterFrameCount}/${completeFrameCount} exact ${OUTPUT_FPS}fps canvas frames `
      + `at ${opening.width}x${opening.height}...`,
    )
    ffmpegMaster = ffv1Process(masterPath)
    const masterStarted = performance.now()
    const masterFrameHashes = []
    const terminalHoldFrames = []
    for (let frameIndex = 0; frameIndex < masterFrameCount; frameIndex++) {
      const isTerminalHold = frameIndex >= renderedDynamicFrameCount
      const time = isTerminalHold ? options.terminalTime : frameIndex / OUTPUT_FPS
      const frame = await pngAt(page, time)
      if (frame.width !== opening.width || frame.height !== opening.height) {
        throw new Error(`canvas dimensions changed at frame ${frameIndex}`)
      }
      if (frameIndex === 0 && frame.sha256 !== opening.sha256) {
        throw new Error('master opening frame does not match exact opening poster')
      }
      if (isTerminalHold && frame.sha256 !== terminal.sha256) {
        const failureDir = resolve(options.outputDir, 'determinism-failure')
        await mkdir(failureDir, { recursive: true })
        await Promise.all([
          writeFile(resolve(failureDir, 'terminal-poster.png'), terminal.buffer),
          writeFile(
            resolve(failureDir, `terminal-after-sequence-${frameIndex - renderedDynamicFrameCount + 1}.png`),
            frame.buffer,
          ),
        ])
        throw new Error(
          `terminal hold render ${frameIndex - renderedDynamicFrameCount + 1}/${terminalHoldFrameCount} `
          + 'does not match the exact terminal poster',
        )
      }
      if (isTerminalHold) {
        terminalHoldFrames.push({
          frameIndex,
          encodedTime: frameIndex / OUTPUT_FPS,
          sceneTime: time,
          sha256: frame.sha256,
          bytes: frame.buffer.length,
          renderReceipt: frame.renderReceipt,
        })
      }
      if (frameIndex === 0
        || frameIndex === renderedTerminalFrameIndex
        || frameIndex === masterFrameCount - 1
        || (!isTerminalHold && frameIndex % OUTPUT_FPS === 0)) {
        masterFrameHashes.push({
          frameIndex,
          encodedTime: frameIndex / OUTPUT_FPS,
          sceneTime: time,
          sha256: frame.sha256,
          bytes: frame.buffer.length,
          renderReceipt: frame.renderReceipt,
        })
      }
      await writeFrame(ffmpegMaster.child.stdin, frame.buffer)
      if ((!isTerminalHold && frameIndex % OUTPUT_FPS === 0)
        || frameIndex === renderedTerminalFrameIndex
        || frameIndex === masterFrameCount - 1) {
        console.log(
          `  frame ${frameIndex + 1}/${masterFrameCount} — scene ${time.toFixed(6)}s`
          + (isTerminalHold ? ' (exact terminal hold)' : ''),
        )
      }
    }
    await finishFfmpeg(ffmpegMaster)
    ffmpegMaster = null
    timings.masterRenderMs = Number((performance.now() - masterStarted).toFixed(3))

    const masterProbe = await probe(masterPath, { countFrames: true })
    const masterVideo = masterProbe.streams.find((stream) => stream.codec_type === 'video')
    if (!masterVideo || masterVideo.codec_name !== 'ffv1') throw new Error('master is not FFV1')
    const probedMasterFrameCount = Number(masterVideo.nb_read_frames ?? masterVideo.nb_frames)
    if (probedMasterFrameCount !== masterFrameCount) {
      throw new Error(`master has ${probedMasterFrameCount} frames; expected ${masterFrameCount}`)
    }
    if (Math.abs(rationalNumber(masterVideo.avg_frame_rate) - OUTPUT_FPS) > 1e-6) {
      throw new Error(`master rate ${masterVideo.avg_frame_rate} is not ${OUTPUT_FPS}fps`)
    }
    const [terminalPosterRgba, masterFinalRgba] = await Promise.all([
      decodedRgbaFingerprint(terminalPosterPath, {
        width: opening.width,
        height: opening.height,
      }),
      decodedRgbaFingerprint(masterPath, {
        frameIndex: masterFrameCount - 1,
        width: opening.width,
        height: opening.height,
      }),
    ])
    if (masterFinalRgba.sha256 !== terminalPosterRgba.sha256) {
      throw new Error(
        `encoded final-frame RGBA hash ${masterFinalRgba.sha256} does not match `
        + `terminal poster RGBA hash ${terminalPosterRgba.sha256}`,
      )
    }

    const [git, ffmpegVersion, ffprobeVersion, rendererInputsAtEnd] = await Promise.all([
      gitFingerprint(),
      toolFingerprint('ffmpeg'),
      toolFingerprint('ffprobe'),
      captureRendererInputReceipt(REPO_ROOT),
    ])
    if (rendererInputsAtEnd.contentSha256 !== rendererInputsAtStart.contentSha256) {
      throw new Error('required renderer inputs changed while the release bake was running')
    }
    const posterOpeningReceipt = await fileReceipt(openingPosterPath)
    const posterTerminalReceipt = await fileReceipt(terminalPosterPath)
    const masterReceipt = await fileReceipt(masterPath)
    const uniqueAtlasRequests = [...new Set(atlasRequests)].sort()
    if (uniqueAtlasRequests.length !== ATLAS_COUNT) {
      throw new Error(`release renderer requested ${uniqueAtlasRequests.length}/${ATLAS_COUNT} atlases`)
    }

    const receipt = {
      schemaVersion: 1,
      kind: 'bitterclip.homepage.iso4.release-bake',
      scriptVersion: SCRIPT_VERSION,
      mode: options.proofFrames ? 'proof' : 'complete',
      startedAt,
      completedAt: new Date().toISOString(),
      repository: git,
      rendererInputs: rendererInputsAtStart,
      environment: {
        platform: process.platform,
        architecture: process.arch,
        node: process.version,
        browserVersion,
        ffmpeg: ffmpegVersion,
        ffprobe: ffprobeVersion,
      },
      source: sourceReceipt,
      atlas: {
        columns: ATLAS_COLUMNS,
        rows: ATLAS_ROWS,
        framesPerAtlas: ATLAS_FRAME_COUNT,
        frameWidth: SOURCE_FRAME_WIDTH,
        frameHeight: SOURCE_FRAME_HEIGHT,
        frameCount: SOURCE_FRAME_COUNT,
        sourceFps: SOURCE_FPS,
        requestUrls: atlasUrls,
        requested: uniqueAtlasRequests,
        files: atlases.map((atlas) => ({
          name: atlas.name,
          path: atlas.path,
          relativePath: relative(REPO_ROOT, atlas.path),
          bytes: atlas.bytes,
          sha256: atlas.sha256,
          probe: atlas.probe,
        })),
      },
      homepage: {
        url: options.url,
        viewport: options.viewport,
        dpr: options.dpr,
        renderer,
        workshop: ACCEPTED_WORKSHOP,
        releaseContract,
        prepareResult: prepareResult ?? null,
        pageErrors,
        consoleErrors,
      },
      timeline: {
        fps: OUTPUT_FPS,
        sceneTerminalTime: options.terminalTime,
        sceneTerminalFrameIndex,
        lastPreTerminalFrameIndex,
        lastPreTerminalGridTime,
        terminalHoldSeconds: TERMINAL_HOLD_SECONDS,
        terminalHoldFrameCount,
        completeDynamicFrameCount: sceneDynamicFrameCount,
        renderedDynamicFrameCount,
        completeTotalFrameCount: completeFrameCount,
        renderedTotalFrameCount: masterFrameCount,
        completeDurationSeconds: completeFrameCount / OUTPUT_FPS,
        renderedDurationSeconds: masterFrameCount / OUTPUT_FPS,
        renderedTerminalFrameIndex,
        complete: renderedDynamicFrameCount === sceneDynamicFrameCount,
      },
      determinism,
      posters: {
        opening: {
          ...posterOpeningReceipt,
          time: 0,
          renderReceipt: opening.renderReceipt,
        },
        terminal: {
          ...posterTerminalReceipt,
          time: options.terminalTime,
          lastPreTerminalGridTime,
          lastPreTerminalGridSha256: lastPreTerminalGridFrame.sha256,
          renderReceipt: terminal.renderReceipt,
        },
        dimensions: { width: opening.width, height: opening.height },
      },
      master: {
        ...masterReceipt,
        codec: 'ffv1',
        container: 'matroska',
        pixelFormat: masterVideo.pix_fmt,
        fps: OUTPUT_FPS,
        frameCount: masterFrameCount,
        sampledFrameHashes: masterFrameHashes,
        terminalHoldFrames,
        terminalIdentity: {
          pass: true,
          terminalPosterPngSha256: terminal.sha256,
          finalInputPngSha256: terminalHoldFrames.at(-1)?.sha256 ?? null,
          terminalPosterRgbaSha256: terminalPosterRgba.sha256,
          finalEncodedFrameRgbaSha256: masterFinalRgba.sha256,
          rgbaBytes: terminalPosterRgba.bytes,
          finalEncodedFrameIndex: masterFrameCount - 1,
        },
        probe: masterProbe,
      },
      timings,
    }
    await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`)
    console.log(`Master:   ${masterPath}`)
    console.log(`Opening:  ${openingPosterPath}`)
    console.log(`Terminal: ${terminalPosterPath}`)
    console.log(`Receipt:  ${receiptPath}`)
  } catch (error) {
    const failure = {
      schemaVersion: 1,
      kind: 'bitterclip.homepage.iso4.release-bake.failure',
      scriptVersion: SCRIPT_VERSION,
      startedAt,
      failedAt: new Date().toISOString(),
      options: {
        ...options,
        outputDir: options.outputDir,
        source: options.source,
      },
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      pageErrors,
      consoleErrors,
      atlasRequests,
      rendererInputs: rendererInputsAtStart,
      timings,
    }
    await writeFile(failurePath, `${JSON.stringify(failure, null, 2)}\n`).catch(() => {})
    throw error
  } finally {
    if (ffmpegMaster) {
      ffmpegMaster.child.stdin.destroy()
      ffmpegMaster.child.kill('SIGTERM')
    }
    await page?.close().catch(() => {})
    await context?.close().catch(() => {})
    await browser?.close().catch(() => {})
  }
}

await main()
