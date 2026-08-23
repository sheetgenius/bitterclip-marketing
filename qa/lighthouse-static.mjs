#!/usr/bin/env node

/**
 * Run repeatable Lighthouse performance audits against an explicit, already
 * running production-static URL. This script never starts a web server.
 *
 *   node qa/lighthouse-static.mjs \
 *     --url http://localhost:8080/ \
 *     --output tmp/iso4-homepage-workshop/lighthouse/candidate \
 *     --preset desktop --runs 3 \
 *     --min-score 90 --max-lcp-ms 2500 --max-tbt-ms 200 --max-cls 0.02
 *
 * Vite/Nuxt development responses are rejected unless --allow-dev is passed;
 * their module graph and development transforms do not predict production.
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    url: { type: 'string', short: 'u' },
    output: { type: 'string', short: 'o' },
    preset: { type: 'string', default: 'desktop' },
    runs: { type: 'string', default: '3' },
    lighthouse: { type: 'string', default: process.env.LIGHTHOUSE_BIN || '' },
    chrome: { type: 'string', default: process.env.CHROME_PATH || '' },
    'allow-dev': { type: 'boolean', default: false },
    'require-compression': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    'min-score': { type: 'string' },
    'min-accessibility-score': { type: 'string' },
    'min-best-practices-score': { type: 'string' },
    'min-seo-score': { type: 'string' },
    'max-lcp-ms': { type: 'string' },
    'max-tbt-ms': { type: 'string' },
    'max-cls': { type: 'string' },
    'max-transfer-bytes': { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

const usage = `Usage:
  node qa/lighthouse-static.mjs --url <static-url> --output <tmp-dir> [options]

Options:
  --preset desktop|mobile     Lighthouse form factor (default: desktop)
  --runs <n>                  Number of cold runs (default: 3)
  --lighthouse <path>         Lighthouse binary; otherwise uses bunx
  --chrome <path>             Explicit Chrome binary (or CHROME_PATH)
  --allow-dev                 Permit a Vite/Nuxt development response
  --require-compression       Require gzip/Brotli for HTML and one JS/CSS asset
  --force                     Overwrite this tool's generated JSON outputs
  --min-score <0-100>         Fail when median performance score is lower
  --min-accessibility-score <0-100>
                              Fail when median Accessibility score is lower
  --min-best-practices-score <0-100>
                              Fail when median Best Practices score is lower
  --min-seo-score <0-100>     Fail when median SEO score is lower
  --max-lcp-ms <ms>           Fail when median LCP is higher
  --max-tbt-ms <ms>           Fail when median TBT is higher
  --max-cls <value>           Fail when median CLS is higher
  --max-transfer-bytes <n>    Fail when median transfer is higher
`

if (values.help) {
  console.log(usage)
  process.exit(0)
}
if (!values.url || !values.output) throw new Error(`--url and --output are required.\n\n${usage}`)
if (!['desktop', 'mobile'].includes(values.preset)) throw new Error('--preset must be desktop or mobile')

const runs = Number(values.runs)
if (!Number.isInteger(runs) || runs < 1 || runs > 9) throw new Error('--runs must be an integer from 1 to 9')
const target = new URL(values.url)
if (!['http:', 'https:'].includes(target.protocol)) throw new Error('--url must use http or https')

const cwd = process.cwd()
const outputDir = resolve(values.output)
const outputRelative = relative(cwd, outputDir)
if (!(outputRelative === 'tmp' || outputRelative.startsWith('tmp/'))) {
  throw new Error(`Output must be under ${resolve(cwd, 'tmp')}: ${outputDir}`)
}

const summaryPath = resolve(outputDir, 'summary.json')
const runPaths = Array.from({ length: runs }, (_, index) => resolve(outputDir, `lighthouse-${values.preset}-run-${index + 1}.json`))
for (const path of [...runPaths, summaryPath]) {
  if (existsSync(path) && !values.force) {
    throw new Error(`Refusing to overwrite ${path}; pass --force to replace this generated output`)
  }
}

const compressionHeaders = {
  'user-agent': 'BitterClip-Lighthouse-Preflight/1.0',
  'accept-encoding': 'br, gzip',
}
const preflightStarted = performance.now()
const response = await fetch(target, { redirect: 'follow', headers: compressionHeaders })
const html = await response.text()
const preflightResponseMs = performance.now() - preflightStarted
if (!response.ok) throw new Error(`Preflight returned HTTP ${response.status} for ${target}`)
const devMarkers = [
  '/@vite/client',
  '/_nuxt/@vite/client',
  '/_nuxt/@fs/',
  '__VUE_DEVTOOLS_GLOBAL_HOOK__',
].filter((marker) => html.includes(marker))
if (devMarkers.length && !values['allow-dev']) {
  throw new Error(`Target appears to be a development server (${devMarkers.join(', ')}). Audit an already-running static candidate or pass --allow-dev for diagnosis only.`)
}

const compressionShape = (candidate) => ({
  finalUrl: candidate.url,
  status: candidate.status,
  contentType: candidate.headers.get('content-type'),
  contentLength: candidate.headers.get('content-length'),
  contentEncoding: candidate.headers.get('content-encoding'),
  vary: candidate.headers.get('vary'),
})
const compressionValid = (shape) => (
  /^(br|gzip)$/.test(shape.contentEncoding ?? '')
  && /(^|,)\s*accept-encoding\s*(,|$)/i.test(shape.vary ?? '')
)

const assetUrls = [...html.matchAll(/<(?:link|script)\b[^>]*(?:href|src)=["']([^"']+\.(?:css|js)(?:\?[^"']*)?)["']/gi)]
  .map((match) => new URL(match[1], response.url))
  .filter((url, index, all) => url.origin === target.origin && all.findIndex((candidate) => candidate.href === url.href) === index)
let compressionAssetProbe = null
for (const assetUrl of assetUrls) {
  const assetResponse = await fetch(assetUrl, { redirect: 'follow', headers: compressionHeaders })
  const decodedBytes = (await assetResponse.arrayBuffer()).byteLength
  if (decodedBytes < 1024) continue
  compressionAssetProbe = { ...compressionShape(assetResponse), decodedBytes }
  break
}

const documentCompression = compressionShape(response)
if (values['require-compression'] && !compressionValid(documentCompression)) {
  throw new Error(`Production compression missing for ${documentCompression.finalUrl}: encoding=${documentCompression.contentEncoding ?? 'none'} vary=${documentCompression.vary ?? 'none'}`)
}
if (values['require-compression'] && (!compressionAssetProbe || !compressionValid(compressionAssetProbe))) {
  throw new Error(`Production compression missing for the first same-origin JS/CSS asset above 1KB: ${JSON.stringify(compressionAssetProbe)}`)
}

await mkdir(outputDir, { recursive: true })

async function run(binary, args) {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
      process.stderr.write(chunk)
    })
    child.on('error', rejectPromise)
    child.on('close', (code, signal) => {
      if (code === 0) resolvePromise({ stdout, stderr })
      else rejectPromise(new Error(`${binary} exited ${code}${signal ? ` (${signal})` : ''}\n${stderr}`))
    })
  })
}

function auditMetric(report, auditId) {
  return report.audits?.[auditId]?.numericValue ?? null
}

function summarizeRun(report, path) {
  return {
    path,
    requestedUrl: report.requestedUrl,
    finalUrl: report.finalDisplayedUrl,
    lighthouseVersion: report.lighthouseVersion,
    score: (report.categories?.performance?.score ?? 0) * 100,
    accessibilityScore: (report.categories?.accessibility?.score ?? 0) * 100,
    bestPracticesScore: (report.categories?.['best-practices']?.score ?? 0) * 100,
    seoScore: (report.categories?.seo?.score ?? 0) * 100,
    fcpMs: auditMetric(report, 'first-contentful-paint'),
    lcpMs: auditMetric(report, 'largest-contentful-paint'),
    speedIndexMs: auditMetric(report, 'speed-index'),
    tbtMs: auditMetric(report, 'total-blocking-time'),
    cls: auditMetric(report, 'cumulative-layout-shift'),
    ttiMs: auditMetric(report, 'interactive'),
    transferBytes: auditMetric(report, 'total-byte-weight'),
    mainThreadMs: auditMetric(report, 'mainthread-work-breakdown'),
    bootupMs: auditMetric(report, 'bootup-time'),
    requestCount: report.audits?.['network-requests']?.details?.items?.length ?? null,
  }
}

function median(valuesToMeasure) {
  const sorted = valuesToMeasure.filter(Number.isFinite).sort((a, b) => a - b)
  if (!sorted.length) return null
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

const reports = []
for (let index = 0; index < runs; index++) {
  const path = runPaths[index]
  console.log(`Lighthouse ${values.preset} run ${index + 1}/${runs}: ${target}`)
  const command = values.lighthouse ? values.lighthouse : 'bunx'
  const args = values.lighthouse ? [] : ['--bun', 'lighthouse']
  args.push(
    target.href,
    '--output=json',
    `--output-path=${path}`,
    '--only-categories=performance,accessibility,best-practices,seo',
    '--quiet',
    '--chrome-flags=--headless=new --disable-extensions --no-first-run --no-default-browser-check',
  )
  if (values.preset === 'desktop') args.push('--preset=desktop')
  if (values.chrome) args.push(`--chrome-path=${resolve(values.chrome)}`)
  await run(command, args)
  reports.push(JSON.parse(await readFile(path, 'utf8')))
}

const runSummaries = reports.map((report, index) => summarizeRun(report, runPaths[index]))
const metricKeys = [
  'score',
  'accessibilityScore',
  'bestPracticesScore',
  'seoScore',
  'fcpMs',
  'lcpMs',
  'speedIndexMs',
  'tbtMs',
  'cls',
  'ttiMs',
  'transferBytes',
  'mainThreadMs',
  'bootupMs',
  'requestCount',
]
const medians = Object.fromEntries(metricKeys.map((key) => [key, median(runSummaries.map((run) => run[key]))]))
const medianRunIndex = runSummaries
  .map((run, index) => ({ index, distance: Math.abs(run.score - medians.score) }))
  .sort((a, b) => a.distance - b.distance)[0].index
const representative = reports[medianRunIndex]
const topRequests = (representative.audits?.['network-requests']?.details?.items ?? [])
  .toSorted((a, b) => (b.transferSize ?? 0) - (a.transferSize ?? 0))
  .slice(0, 20)
  .map(({ url, resourceType, transferSize, resourceSize, statusCode }) => ({ url, resourceType, transferSize, resourceSize, statusCode }))
const opportunities = Object.values(representative.audits ?? {})
  .filter((audit) => audit.details?.type === 'opportunity' && (audit.numericValue ?? 0) > 0)
  .toSorted((a, b) => b.numericValue - a.numericValue)
  .slice(0, 15)
  .map(({ id, title, numericValue, displayValue }) => ({ id, title, numericValue, displayValue }))

const budgets = {
  minScore: values['min-score'] == null ? null : Number(values['min-score']),
  minAccessibilityScore: values['min-accessibility-score'] == null ? null : Number(values['min-accessibility-score']),
  minBestPracticesScore: values['min-best-practices-score'] == null ? null : Number(values['min-best-practices-score']),
  minSeoScore: values['min-seo-score'] == null ? null : Number(values['min-seo-score']),
  maxLcpMs: values['max-lcp-ms'] == null ? null : Number(values['max-lcp-ms']),
  maxTbtMs: values['max-tbt-ms'] == null ? null : Number(values['max-tbt-ms']),
  maxCls: values['max-cls'] == null ? null : Number(values['max-cls']),
  maxTransferBytes: values['max-transfer-bytes'] == null ? null : Number(values['max-transfer-bytes']),
}
for (const [name, value] of Object.entries(budgets)) {
  if (value != null && !Number.isFinite(value)) throw new Error(`Invalid numeric budget: ${name}`)
}

const failures = []
if (budgets.minScore != null && medians.score < budgets.minScore) failures.push(`score ${medians.score.toFixed(1)} < ${budgets.minScore}`)
if (budgets.minAccessibilityScore != null && medians.accessibilityScore < budgets.minAccessibilityScore) failures.push(`Accessibility ${medians.accessibilityScore.toFixed(1)} < ${budgets.minAccessibilityScore}`)
if (budgets.minBestPracticesScore != null && medians.bestPracticesScore < budgets.minBestPracticesScore) failures.push(`Best Practices ${medians.bestPracticesScore.toFixed(1)} < ${budgets.minBestPracticesScore}`)
if (budgets.minSeoScore != null && medians.seoScore < budgets.minSeoScore) failures.push(`SEO ${medians.seoScore.toFixed(1)} < ${budgets.minSeoScore}`)
if (budgets.maxLcpMs != null && medians.lcpMs > budgets.maxLcpMs) failures.push(`LCP ${medians.lcpMs.toFixed(0)}ms > ${budgets.maxLcpMs}ms`)
if (budgets.maxTbtMs != null && medians.tbtMs > budgets.maxTbtMs) failures.push(`TBT ${medians.tbtMs.toFixed(0)}ms > ${budgets.maxTbtMs}ms`)
if (budgets.maxCls != null && medians.cls > budgets.maxCls) failures.push(`CLS ${medians.cls.toFixed(4)} > ${budgets.maxCls}`)
if (budgets.maxTransferBytes != null && medians.transferBytes > budgets.maxTransferBytes) failures.push(`transfer ${medians.transferBytes} bytes > ${budgets.maxTransferBytes}`)

const summary = {
  schema: 'bitterclip.lighthouse-static.v1',
  createdAt: new Date().toISOString(),
  target: target.href,
  preset: values.preset,
  runs,
  staticPreflight: {
    finalUrl: response.url,
    status: response.status,
    responseMs: preflightResponseMs,
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
    cacheControl: response.headers.get('cache-control'),
    contentEncoding: response.headers.get('content-encoding'),
    vary: response.headers.get('vary'),
    compressionRequired: values['require-compression'],
    compressionAssetProbe,
    developmentMarkers: devMarkers,
    allowedDevelopmentTarget: values['allow-dev'],
  },
  medians,
  runSummaries,
  representativeRun: medianRunIndex + 1,
  topRequests,
  opportunities,
  budgets,
  passed: failures.length === 0,
  failures,
}

await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify({ summaryPath, medians, passed: summary.passed, failures }, null, 2))
if (failures.length) process.exitCode = 1
