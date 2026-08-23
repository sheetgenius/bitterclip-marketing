#!/usr/bin/env node

/**
 * Compare release-quality H.264 encodes for a lossless ISO4 artifact master.
 *
 * The input is expected to be a lossless, CFR-compatible video master. The
 * script writes generated candidates and a receipt only under this checkout's
 * ignored tmp/ directory. It never starts a server or edits application files.
 *
 *   node qa/iso4-artifact-encode.mjs \
 *     --input tmp/iso4-master.mov \
 *     --output tmp/iso4-homepage-workshop/codec/my-candidate \
 *     --vmaf
 *
 * VMAF is opt-in because a full-resolution comparison is expensive. SSIM,
 * SHA-256, ffprobe data, color/rate checks, and fast-start checks always run.
 */

import { createHash } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, relative, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    input: { type: 'string', short: 'i' },
    output: { type: 'string', short: 'o' },
    ffmpeg: { type: 'string', default: process.env.FFMPEG_BIN || 'ffmpeg' },
    ffprobe: { type: 'string', default: process.env.FFPROBE_BIN || 'ffprobe' },
    preset: { type: 'string', default: 'slow' },
    crf: { type: 'string' },
    vmaf: { type: 'boolean', default: false },
    'vmaf-subsample': { type: 'string', default: '1' },
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

const usage = `Usage:
  node qa/iso4-artifact-encode.mjs --input <lossless-master> --output <tmp-dir> [options]

Options:
  --preset <x264-preset>   x264 preset (default: slow)
  --crf <15|18|21>        Encode one accepted setting instead of all three
  --vmaf                   Run VMAF when ffmpeg provides libvmaf
  --vmaf-subsample <n>     Score every nth frame (default: 1)
  --force                  Overwrite this tool's existing generated outputs
  --ffmpeg <path>          ffmpeg binary (or FFMPEG_BIN)
  --ffprobe <path>         ffprobe binary (or FFPROBE_BIN)
`

if (values.help) {
  console.log(usage)
  process.exit(0)
}
if (!values.input || !values.output) throw new Error(`--input and --output are required.\n\n${usage}`)

const cwd = process.cwd()
const input = resolve(values.input)
const outputDir = resolve(values.output)
const outputRelative = relative(cwd, outputDir)
if (!existsSync(input)) throw new Error(`Input does not exist: ${input}`)
if (outputRelative === 'tmp' || outputRelative.startsWith(`tmp/`)) {
  // Expected generated-evidence boundary.
} else {
  throw new Error(`Output must be under ${resolve(cwd, 'tmp')}: ${outputDir}`)
}

const vmafSubsample = Number(values['vmaf-subsample'])
if (!Number.isInteger(vmafSubsample) || vmafSubsample < 1) {
  throw new Error('--vmaf-subsample must be a positive integer')
}

const requestedCrf = values.crf === undefined ? null : Number(values.crf)
if (requestedCrf !== null && ![15, 18, 21].includes(requestedCrf)) {
  throw new Error('--crf must be 15, 18, or 21')
}
const CRFS = requestedCrf === null ? [15, 18, 21] : [requestedCrf]
const candidatePaths = CRFS.map((crf) => resolve(outputDir, `h264-crf${crf}.mp4`))
const receiptPath = resolve(outputDir, 'encode-receipt.json')
for (const path of [...candidatePaths, receiptPath]) {
  if (existsSync(path) && !values.force) {
    throw new Error(`Refusing to overwrite ${path}; pass --force to replace this generated output`)
  }
}

await mkdir(outputDir, { recursive: true })

async function run(binary, args, { forward = false, allowFailure = false } = {}) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk
      if (forward) process.stdout.write(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
      if (forward) process.stderr.write(chunk)
    })
    child.on('error', rejectPromise)
    child.on('close', (code, signal) => {
      const result = { code, signal, stdout, stderr }
      if (code === 0 || allowFailure) resolvePromise(result)
      else rejectPromise(new Error(`${binary} exited ${code}${signal ? ` (${signal})` : ''}\n${stderr}`))
    })
  })
}

async function probe(path) {
  const result = await run(values.ffprobe, [
    '-v', 'error',
    '-show_streams',
    '-show_format',
    '-of', 'json',
    path,
  ])
  return JSON.parse(result.stdout)
}

async function sha256(path) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const hash = createHash('sha256')
    const stream = createReadStream(path)
    stream.on('error', rejectPromise)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolvePromise(hash.digest('hex')))
  })
}

function fraction(value) {
  const [numerator, denominator = '1'] = String(value || '0').split('/').map(Number)
  return denominator ? numerator / denominator : 0
}

async function fastStart(path) {
  const file = await readFile(path)
  const moov = file.indexOf(Buffer.from('moov'))
  const mdat = file.indexOf(Buffer.from('mdat'))
  return { moovOffset: moov, mdatOffset: mdat, valid: moov > 0 && mdat > 0 && moov < mdat }
}

function parseSsim(stderr) {
  const match = stderr.match(/SSIM Y:([^ ]+) \(([^)]+)\) U:([^ ]+) \(([^)]+)\) V:([^ ]+) \(([^)]+)\) All:([^ ]+) \(([^)]+)\)/)
  if (!match) return { parsed: false, raw: stderr.trim().split('\n').at(-1) || '' }
  return {
    parsed: true,
    y: Number(match[1]),
    yDb: Number(match[2]),
    u: Number(match[3]),
    uDb: Number(match[4]),
    v: Number(match[5]),
    vDb: Number(match[6]),
    all: Number(match[7]),
    allDb: Number(match[8]),
  }
}

const sourceProbe = await probe(input)
const sourceVideo = sourceProbe.streams.find((stream) => stream.codec_type === 'video')
if (!sourceVideo) throw new Error(`No video stream in ${input}`)
if (sourceVideo.width % 2 !== 0 || sourceVideo.height % 2 !== 0) {
  throw new Error(
    `H.264 yuv420p requires explicit even master dimensions; received ${sourceVideo.width}x${sourceVideo.height}`,
  )
}

const filterCheck = await run(values.ffmpeg, ['-hide_banner', '-filters'], { allowFailure: true })
const vmafAvailable = /\blibvmaf\b/.test(`${filterCheck.stdout}\n${filterCheck.stderr}`)
if (values.vmaf && !vmafAvailable) console.warn('libvmaf is unavailable; continuing with SSIM only')

const sourceInfo = {
  path: input,
  filename: basename(input),
  bytes: (await stat(input)).size,
  sha256: await sha256(input),
  probe: sourceProbe,
  warning: ['ffv1', 'huffyuv', 'png', 'rawvideo', 'prores'].includes(sourceVideo.codec_name)
    ? null
    : `Source codec is ${sourceVideo.codec_name}; final acceptance should use a lossless master`,
}

const candidates = []
for (let index = 0; index < CRFS.length; index++) {
  const crf = CRFS[index]
  const path = candidatePaths[index]
  console.log(`Encoding CRF ${crf} -> ${path}`)
  await run(values.ffmpeg, [
    '-hide_banner',
    '-loglevel', 'warning',
    values.force ? '-y' : '-n',
    '-i', input,
    '-map', '0:v:0',
    '-an',
    '-sn',
    '-dn',
    '-vf', 'fps=60,scale=iw:ih:out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p',
    '-fps_mode', 'cfr',
    '-c:v', 'libx264',
    '-preset', values.preset,
    '-crf', String(crf),
    '-profile:v', 'high',
    '-g', '120',
    '-keyint_min', '60',
    '-sc_threshold', '40',
    '-x264-params', 'aq-mode=3:aq-strength=0.9:deblock=-1,-1:ref=5:bframes=5:colorprim=bt709:transfer=bt709:colormatrix=bt709',
    '-color_range', 'tv',
    '-colorspace', 'bt709',
    '-color_primaries', 'bt709',
    '-color_trc', 'bt709',
    '-movflags', '+faststart',
    path,
  ], { forward: true })

  const candidateProbe = await probe(path)
  const video = candidateProbe.streams.find((stream) => stream.codec_type === 'video')
  const audioStreams = candidateProbe.streams.filter((stream) => stream.codec_type === 'audio')
  if (!video) throw new Error(`Encoded candidate has no video stream: ${path}`)
  if (video.width !== sourceVideo.width || video.height !== sourceVideo.height) {
    throw new Error(
      `Encoder changed master geometry from ${sourceVideo.width}x${sourceVideo.height} to ${video.width}x${video.height}`,
    )
  }

  console.log(`Measuring SSIM for CRF ${crf}`)
  const ssimStatsPath = resolve(outputDir, `h264-crf${crf}-ssim.log`)
  const ssim = await run(values.ffmpeg, [
    '-hide_banner',
    '-loglevel', 'info',
    '-i', path,
    '-i', input,
    '-filter_complex', `[0:v]setpts=PTS-STARTPTS,format=yuv420p[dist];[1:v]fps=60,scale=${video.width}:${video.height}:out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,setpts=PTS-STARTPTS,format=yuv420p[ref];[dist][ref]ssim=stats_file=${ssimStatsPath}`,
    '-f', 'null',
    '-',
  ])

  let vmaf = null
  if (values.vmaf && vmafAvailable) {
    console.log(`Measuring VMAF for CRF ${crf}`)
    const vmafPath = resolve(outputDir, `h264-crf${crf}-vmaf.json`)
    await run(values.ffmpeg, [
      '-hide_banner',
      '-loglevel', 'warning',
      '-i', path,
      '-i', input,
      '-filter_complex', `[0:v]setpts=PTS-STARTPTS,format=yuv420p[dist];[1:v]fps=60,scale=${video.width}:${video.height}:out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,setpts=PTS-STARTPTS,format=yuv420p[ref];[dist][ref]libvmaf=log_path=${vmafPath}:log_fmt=json:n_subsample=${vmafSubsample}`,
      '-f', 'null',
      '-',
    ])
    const report = JSON.parse(await readFile(vmafPath, 'utf8'))
    vmaf = {
      path: vmafPath,
      subsample: vmafSubsample,
      mean: report.pooled_metrics?.vmaf?.mean ?? null,
      min: report.pooled_metrics?.vmaf?.min ?? null,
      harmonicMean: report.pooled_metrics?.vmaf?.harmonic_mean ?? null,
    }
  }

  const rate = fraction(video.avg_frame_rate || video.r_frame_rate)
  const startup = await fastStart(path)
  candidates.push({
    crf,
    path,
    bytes: (await stat(path)).size,
    sha256: await sha256(path),
    probe: candidateProbe,
    checks: {
      h264: video.codec_name === 'h264',
      fps60: Math.abs(rate - 60) < 0.001,
      yuv420p: video.pix_fmt === 'yuv420p',
      bt709: video.color_space === 'bt709' && video.color_primaries === 'bt709' && video.color_transfer === 'bt709',
      limitedRange: video.color_range === 'tv',
      noAudio: audioStreams.length === 0,
      fastStart: startup.valid,
    },
    fastStart: startup,
    ssim: parseSsim(ssim.stderr),
    vmaf,
  })
}

const receipt = {
  schema: 'bitterclip.iso4-artifact-encode.v1',
  createdAt: new Date().toISOString(),
  source: sourceInfo,
  contract: {
    codec: 'h264',
    crfs: CRFS,
    preset: values.preset,
    fps: 60,
    pixelFormat: 'yuv420p',
    color: 'BT.709 limited range',
    audio: false,
    fastStart: true,
    gopFrames: 120,
  },
  vmaf: { requested: values.vmaf, available: vmafAvailable, subsample: vmafSubsample },
  candidates,
}

await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`)
console.log(`Receipt: ${receiptPath}`)
for (const candidate of candidates) {
  console.log(`CRF ${candidate.crf}: ${candidate.bytes} bytes, SSIM ${candidate.ssim.all ?? 'unparsed'}, VMAF ${candidate.vmaf?.mean ?? 'not run'}`)
}
