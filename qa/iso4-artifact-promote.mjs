#!/usr/bin/env node

/**
 * Fail-closed publication verification for the homepage ISO4 Artifact.
 *
 * This tool deliberately does not publish or accept anything. `verify` proves
 * that BitterClip's immutable public URLs serve the exact generation bytes and
 * emits a compare-and-swap acceptance request. `finalize` consumes the result
 * of that separate BitterClip acceptance command and emits the exact marketing
 * manifest candidate. Generated receipts stay below ignored tmp/.
 */

import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import https from 'node:https'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const TMP_ROOT = resolve(REPO_ROOT, 'tmp')
const RELEASE_PACKET_SCHEMA = 'bitterclip.artifact_release_packet.v1'
const RELEASE_RESULT_SCHEMA = 'bitterclip.artifact_release_result.v1'
const GENERATION_SCHEMA = 'bitterclip.artifact_generation_manifest.v1'
const MARKETING_SCHEMA = 'bitterclip.programmable_artifact_generation.v1'
const VERIFICATION_SCHEMA = 'bitterclip.iso4-publication-verification.v1'
const PROMOTION_SCHEMA = 'bitterclip.iso4-artifact-promotion.v1'
const CLI_RESULT_SCHEMA = 'bitterclip.iso4-artifact-promotion-cli-result.v1'
const MAX_JSON_BYTES = 1024 * 1024
const MAX_PUBLIC_ASSET_BYTES = 64 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 120_000
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const ACCOUNT_PATTERN = /^acct_(?:[a-z0-9]{12}|[a-z0-9]{20})$/
const DEFINITION_ID_PATTERN = /^artd_(?:[a-z0-9]{12}|[a-z0-9]{20})$/
const GENERATION_ID_PATTERN = /^artg_(?:[a-z0-9]{12}|[a-z0-9]{20})$/
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,95}$/

export const ISO4_VARIANT_CONTRACTS = Object.freeze([
  { key: 'mobile', media: '(max-width: 599px)', width: 440, height: 956 },
  { key: 'tablet', media: '(min-width: 600px) and (max-width: 959px)', width: 768, height: 900 },
  { key: 'tall', media: '(min-width: 960px) and (max-aspect-ratio: 4/3)', width: 1818, height: 1454 },
  { key: 'classic', media: '(min-width: 960px) and (min-aspect-ratio: 4/3) and (max-aspect-ratio: 3/2)', width: 1400, height: 1000 },
  { key: 'standard', media: '(min-width: 960px) and (min-aspect-ratio: 3/2) and (max-aspect-ratio: 17/10)', width: 1600, height: 1000 },
  { key: 'wide-band', media: '(min-width: 960px) and (min-aspect-ratio: 17/10)', width: 1920, height: 900 },
])

const ISO4_TIMELINE = Object.freeze({
  sceneDurationMs: 14_008,
  durationMs: 14_367,
  fps: 60,
  frameCount: 862,
  terminalFrame: 841,
})

const EXTENSIONS = Object.freeze({
  'video/mp4': 'mp4',
  'image/webp': 'webp',
  'application/gzip': 'tgz',
})

const RELEASE_PACKET_KEYS = ['schema', 'account_public_id', 'definition', 'generation', 'asset_paths']
const ACCEPTANCE_PACKET_KEYS = [...RELEASE_PACKET_KEYS, 'accept']
const DEFINITION_KEYS = ['definition_key', 'name', 'description']
const GENERATION_KEYS = ['schema', 'source', 'renderer', 'duration_ms', 'render_contract', 'assets']
const ASSET_KEYS = [
  'name', 'role', 'profile', 'content_type', 'sha256', 'byte_size', 'access',
  'width', 'height', 'frame_rate', 'codec',
]
const CANDIDATE_KEYS = [
  'schema', 'artifactId', 'generation', 'definitionFingerprint', 'sceneDurationMs',
  'durationMs', 'fps', 'frameCount', 'terminalFrame', 'variants',
]
const VARIANT_KEYS = [
  'key', 'media', 'width', 'height', 'mp4Url', 'mp4Sha256', 'mp4Bytes',
  'openingPosterUrl', 'openingPosterSha256', 'terminalPosterUrl', 'terminalPosterSha256',
]
const RESULT_KEYS = [
  'schema', 'action', 'ok', 'outcome', 'account_public_id', 'definition_public_id',
  'definition_key', 'generation_public_id', 'generation_fingerprint', 'generation_status',
  'generation_reused', 'generation_restaged', 'generation_published', 'publication_status',
  'public_urls', 'accepted_generation_public_id', 'acceptance_version', 'selection_changed',
  'acceptance_status',
]
const VERIFICATION_KEYS = [
  'schema', 'outcome', 'verified_at', 'public_base_url', 'inputs', 'subject',
  'assets', 'acceptance_request',
]
const VERIFICATION_INPUT_KEYS = [
  'release_packet_file_sha256', 'release_packet_canonical_sha256',
  'marketing_candidate_file_sha256', 'marketing_candidate_canonical_sha256',
  'publication_result_file_sha256',
]
const VERIFICATION_SUBJECT_KEYS = [
  'account_public_id', 'definition_key', 'definition_public_id',
  'generation_public_id', 'generation_fingerprint',
  'prior_accepted_generation_public_id', 'observed_acceptance_version',
]
const VERIFICATION_ASSET_KEYS = [
  'name', 'role', 'profile', 'url', 'expected_sha256', 'expected_bytes',
  'full_get', 'range_get',
]
const VERIFICATION_FULL_GET_KEYS = [
  'status', 'bytes', 'sha256', 'prefix_sha256', 'content_type',
  'cache_control', 'content_encoding',
]
const VERIFICATION_RANGE_GET_KEYS = [
  'request', 'status', 'content_range', 'bytes', 'sha256', 'content_type',
  'cache_control', 'content_encoding',
]

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value
}

function rejectUnknownKeys(value, allowed, label) {
  const unknown = Object.keys(object(value, label)).filter((key) => !allowed.includes(key))
  if (unknown.length) throw new Error(`${label} contains unknown keys: ${unknown.sort().join(', ')}`)
}

function exactKeys(value, expected, label) {
  rejectUnknownKeys(value, expected, label)
  const missing = expected.filter((key) => !Object.hasOwn(value, key))
  if (missing.length) throw new Error(`${label} is missing keys: ${missing.join(', ')}`)
}

function integer(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`${label} is invalid`)
  return value
}

function exactString(value, pattern, label) {
  if (typeof value !== 'string' || !pattern.test(value)) throw new Error(`${label} is invalid`)
  return value
}

function sha256Text(value) {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Bytes(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function canonicalSha256(value) {
  return sha256Text(canonicalJson(value))
}

function normalizePublicBaseUrl(raw) {
  let url
  try {
    url = new URL(String(raw))
  } catch {
    throw new Error('--public-base-url must be an exact HTTPS base URL')
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('--public-base-url must be an exact HTTPS base URL')
  }
  if (!url.hostname || url.hostname.includes('*')) throw new Error('--public-base-url host is invalid')
  return url.href.replace(/\/$/, '')
}

function header(headers, name) {
  const key = name.toLowerCase()
  if (headers instanceof Map) return headers.get(key) ?? headers.get(name) ?? null
  for (const [candidate, value] of Object.entries(headers ?? {})) {
    if (candidate.toLowerCase() === key) return Array.isArray(value) ? value.join(', ') : String(value)
  }
  return null
}

function validateCacheControl(value, label) {
  const directives = String(value ?? '').split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean)
  const set = new Set(directives)
  const expected = ['public', 'max-age=31536000', 'immutable']
  if (directives.length !== expected.length || set.size !== expected.length
    || expected.some((directive) => !set.has(directive))) {
    throw new Error(`${label} does not match the exact public immutable cache policy`)
  }
  return directives.join(', ')
}

function validateResponseMetadata(response, asset, expectedStatus, expectedLength, label) {
  if (response.status !== expectedStatus) throw new Error(`${label} returned HTTP ${response.status}, expected ${expectedStatus}`)
  const contentLength = Number(header(response.headers, 'content-length'))
  if (!Number.isSafeInteger(contentLength) || contentLength !== expectedLength) {
    throw new Error(`${label} Content-Length does not match`)
  }
  const contentType = String(header(response.headers, 'content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (contentType !== asset.content_type) throw new Error(`${label} Content-Type does not match`)
  const contentEncoding = String(header(response.headers, 'content-encoding') ?? '').trim().toLowerCase()
  if (contentEncoding) throw new Error(`${label} Content-Encoding must be absent`)
  const cacheControl = validateCacheControl(header(response.headers, 'cache-control'), `${label} Cache-Control`)
  return { contentLength, contentType, contentEncoding: contentEncoding || null, cacheControl }
}

function validateGenerationAsset(raw, index) {
  rejectUnknownKeys(raw, ASSET_KEYS, `generation asset ${index}`)
  const asset = object(raw, `generation asset ${index}`)
  const required = ['name', 'role', 'profile', 'content_type', 'sha256', 'byte_size', 'access']
  const missing = required.filter((key) => !Object.hasOwn(asset, key))
  if (missing.length) throw new Error(`generation asset ${index} is missing keys: ${missing.join(', ')}`)
  exactString(asset.name, NAME_PATTERN, `generation asset ${index} name`)
  exactString(asset.profile, NAME_PATTERN, `generation asset ${index} profile`)
  exactString(asset.sha256, SHA256_PATTERN, `generation asset ${index} sha256`)
  integer(asset.byte_size, `generation asset ${index} byte_size`, 1)
  if (!['video', 'opening_poster', 'terminal_poster', 'source_bundle'].includes(asset.role)) {
    throw new Error(`generation asset ${index} role is invalid`)
  }
  if (!['public', 'private'].includes(asset.access)) throw new Error(`generation asset ${index} access is invalid`)
  if (!EXTENSIONS[asset.content_type]) throw new Error(`generation asset ${index} content type is unsupported`)
  if (asset.role === 'source_bundle') {
    if (['width', 'height', 'frame_rate', 'codec'].some((key) => Object.hasOwn(asset, key))) {
      throw new Error(`generation asset ${index} source bundle contains visual fields`)
    }
  } else {
    integer(asset.width, `generation asset ${index} width`, 1)
    integer(asset.height, `generation asset ${index} height`, 1)
    if (asset.role === 'video') {
      if (asset.frame_rate !== '60/1' || asset.codec !== 'h264') throw new Error(`generation asset ${index} video contract is invalid`)
    } else if (Object.hasOwn(asset, 'frame_rate') || Object.hasOwn(asset, 'codec')) {
      throw new Error(`generation asset ${index} poster contains video fields`)
    }
  }
  if (asset.access === 'public' && asset.byte_size > MAX_PUBLIC_ASSET_BYTES) {
    throw new Error(`generation asset ${index} exceeds the homepage delivery ceiling`)
  }
  return asset
}

function validatePacketAndCandidate(releasePacket, candidate, { acceptance = false } = {}) {
  exactKeys(releasePacket, acceptance ? ACCEPTANCE_PACKET_KEYS : RELEASE_PACKET_KEYS, 'release packet')
  if (releasePacket.schema !== RELEASE_PACKET_SCHEMA) throw new Error('unsupported release packet schema')
  exactString(releasePacket.account_public_id, ACCOUNT_PATTERN, 'release packet account_public_id')
  exactKeys(releasePacket.definition, DEFINITION_KEYS, 'release packet definition')
  if (releasePacket.definition.definition_key !== 'homepage-iso4') throw new Error('release packet definition_key is not homepage-iso4')
  exactKeys(releasePacket.generation, GENERATION_KEYS, 'generation manifest')
  if (releasePacket.generation.schema !== GENERATION_SCHEMA) throw new Error('unsupported generation manifest schema')
  if (!Array.isArray(releasePacket.generation.assets)) throw new Error('generation assets must be an array')
  const assets = releasePacket.generation.assets.map(validateGenerationAsset)
  const names = assets.map((asset) => asset.name)
  if (new Set(names).size !== names.length) throw new Error('generation asset names are duplicated')
  const publicHashes = assets.filter((asset) => asset.access === 'public').map((asset) => asset.sha256)
  if (new Set(publicHashes).size !== publicHashes.length) throw new Error('public generation asset hashes are duplicated')
  const assetPathKeys = Object.keys(object(releasePacket.asset_paths, 'release packet asset_paths')).sort()
  if (canonicalJson(assetPathKeys) !== canonicalJson([...names].sort())) {
    throw new Error('release packet asset_paths do not exactly name the generation assets')
  }

  exactKeys(candidate, CANDIDATE_KEYS, 'marketing candidate')
  if (candidate.schema !== MARKETING_SCHEMA || candidate.artifactId !== 'homepage-iso4') {
    throw new Error('unsupported marketing candidate')
  }
  if (candidate.generation !== null) throw new Error('marketing candidate generation must be empty before promotion')
  for (const [key, expected] of Object.entries(ISO4_TIMELINE)) {
    if (candidate[key] !== expected) throw new Error(`marketing candidate ${key} does not match the ISO4 timeline`)
  }
  const generationFingerprint = canonicalSha256(releasePacket.generation)
  if (candidate.definitionFingerprint !== generationFingerprint) {
    throw new Error('marketing candidate fingerprint does not match the generation')
  }
  if (releasePacket.generation.duration_ms !== ISO4_TIMELINE.durationMs) throw new Error('generation duration does not match ISO4')
  const render = object(releasePacket.generation.render_contract, 'generation render_contract')
  const expectedRender = {
    fps: ISO4_TIMELINE.fps,
    terminal_state_ms: ISO4_TIMELINE.sceneDurationMs,
    terminal_frame: ISO4_TIMELINE.terminalFrame,
    frame_count: ISO4_TIMELINE.frameCount,
  }
  for (const [key, expected] of Object.entries(expectedRender)) {
    if (render[key] !== expected) throw new Error(`generation render_contract.${key} does not match ISO4`)
  }
  if (render.non_looping !== true) throw new Error('generation render contract must be non-looping')
  if (!Array.isArray(render.variants) || render.variants.length !== ISO4_VARIANT_CONTRACTS.length) {
    throw new Error('generation render contract does not contain the exact responsive family')
  }
  if (!Array.isArray(candidate.variants) || candidate.variants.length !== ISO4_VARIANT_CONTRACTS.length) {
    throw new Error('marketing candidate does not contain the exact responsive family')
  }

  const byName = new Map(assets.map((asset) => [asset.name, asset]))
  const expectedPublicNames = []
  for (let index = 0; index < ISO4_VARIANT_CONTRACTS.length; index++) {
    const contract = ISO4_VARIANT_CONTRACTS[index]
    const variant = object(candidate.variants[index], `marketing variant ${index}`)
    exactKeys(variant, VARIANT_KEYS, `marketing variant ${index}`)
    for (const key of ['key', 'media', 'width', 'height']) {
      if (variant[key] !== contract[key]) throw new Error(`marketing variant ${index} ${key} does not match its responsive contract`)
    }
    if (variant.mp4Url !== '' || variant.openingPosterUrl !== '' || variant.terminalPosterUrl !== '') {
      throw new Error(`marketing variant ${index} URLs must be empty before promotion`)
    }
    const renderVariant = object(render.variants[index], `render variant ${index}`)
    if (renderVariant.profile !== contract.key || renderVariant.media_query !== contract.media
      || renderVariant.width !== contract.width || renderVariant.height !== contract.height) {
      throw new Error(`render variant ${index} does not match its responsive contract`)
    }
    const mappings = [
      [`${contract.key}-h264`, 'video', 'video/mp4', variant.mp4Sha256, variant.mp4Bytes],
      [`${contract.key}-opening`, 'opening_poster', 'image/webp', variant.openingPosterSha256, null],
      [`${contract.key}-terminal`, 'terminal_poster', 'image/webp', variant.terminalPosterSha256, null],
    ]
    for (const [name, role, contentType, hash, bytes] of mappings) {
      const asset = byName.get(name)
      if (!asset || asset.role !== role || asset.profile !== contract.key || asset.access !== 'public'
        || asset.content_type !== contentType || asset.width !== contract.width || asset.height !== contract.height
        || asset.sha256 !== hash || (bytes !== null && asset.byte_size !== bytes)) {
        throw new Error(`marketing variant ${contract.key} does not match generation asset ${name}`)
      }
      expectedPublicNames.push(name)
    }
  }
  const actualPublicNames = assets.filter((asset) => asset.access === 'public').map((asset) => asset.name).sort()
  if (canonicalJson(actualPublicNames) !== canonicalJson(expectedPublicNames.sort())) {
    throw new Error('generation public assets do not exactly match the marketing variants')
  }
  const privateAssets = assets.filter((asset) => asset.access === 'private')
  if (privateAssets.length !== 1 || privateAssets[0].name !== 'source-bundle'
    || privateAssets[0].role !== 'source_bundle' || privateAssets[0].content_type !== 'application/gzip') {
    throw new Error('generation must contain exactly one private source bundle')
  }
  return { assets, generationFingerprint }
}

function validateResultShape(result, label) {
  exactKeys(result, RESULT_KEYS, label)
  if (result.schema !== RELEASE_RESULT_SCHEMA || result.ok !== true) throw new Error(`${label} is not a successful Artifact result`)
  if (!['release', 'reconcile'].includes(result.action)) throw new Error(`${label} action is invalid`)
  exactString(result.account_public_id, ACCOUNT_PATTERN, `${label} account_public_id`)
  exactString(result.definition_public_id, DEFINITION_ID_PATTERN, `${label} definition_public_id`)
  exactString(result.generation_public_id, GENERATION_ID_PATTERN, `${label} generation_public_id`)
  exactString(result.generation_fingerprint, SHA256_PATTERN, `${label} generation_fingerprint`)
  integer(result.acceptance_version, `${label} acceptance_version`)
  for (const key of ['generation_reused', 'generation_restaged', 'generation_published', 'selection_changed']) {
    if (typeof result[key] !== 'boolean') throw new Error(`${label} ${key} must be boolean`)
  }
  if (result.accepted_generation_public_id !== null) {
    exactString(result.accepted_generation_public_id, GENERATION_ID_PATTERN, `${label} accepted_generation_public_id`)
  }
  if (typeof result.definition_key !== 'string' || typeof result.outcome !== 'string'
    || typeof result.publication_status !== 'string' || typeof result.acceptance_status !== 'string') {
    throw new Error(`${label} status fields are invalid`)
  }
  if (result.generation_status !== 'ready') throw new Error(`${label} generation is not ready`)
  if (typeof result.public_urls !== 'object' || !result.public_urls || Array.isArray(result.public_urls)) {
    throw new Error(`${label} public_urls must be an object`)
  }
}

function validatePublicationResultCombination(result) {
  if (result.acceptance_status !== 'not_requested' || result.selection_changed !== false) {
    throw new Error('publication must be verified before requesting acceptance')
  }
  if (result.publication_status === 'published') {
    if (result.outcome !== 'published' || result.generation_published !== true
      || (result.generation_restaged && !result.generation_reused)) {
      throw new Error('publication result status is inconsistent')
    }
    return
  }
  if (result.publication_status === 'ready_reused') {
    if (result.outcome !== 'ready_reused' || result.generation_published !== false
      || result.generation_reused !== true || result.generation_restaged !== false) {
      throw new Error('publication result status is inconsistent')
    }
    return
  }
  throw new Error('publication result status is inconsistent')
}

function validateResultIdentity(result, releasePacket, generationFingerprint, assets, publicBaseUrl) {
  if (result.account_public_id !== releasePacket.account_public_id
    || result.definition_key !== releasePacket.definition.definition_key
    || result.generation_fingerprint !== generationFingerprint) {
    throw new Error('Artifact result identity does not match the release packet')
  }
  const publicAssets = assets.filter((asset) => asset.access === 'public')
  const expectedNames = publicAssets.map((asset) => asset.name).sort()
  if (canonicalJson(Object.keys(result.public_urls).sort()) !== canonicalJson(expectedNames)) {
    throw new Error('Artifact result public_urls do not exactly match public generation assets')
  }
  const urls = []
  for (const asset of publicAssets) {
    const objectKey = [
      'public-artifacts/v1/accounts', releasePacket.account_public_id,
      'definitions', result.definition_public_id,
      'generations', generationFingerprint,
      `${asset.name}.${EXTENSIONS[asset.content_type]}`,
    ].join('/')
    const expectedUrl = `${publicBaseUrl}/${objectKey}`
    const actual = result.public_urls[asset.name]
    let parsed
    try {
      parsed = new URL(actual)
    } catch {
      throw new Error(`Artifact public URL is invalid: ${asset.name}`)
    }
    if (parsed.href !== expectedUrl || parsed.username || parsed.password || parsed.search || parsed.hash
      || parsed.pathname.toLowerCase().includes('/latest')) {
      throw new Error(`Artifact public URL is not the exact immutable locator: ${asset.name}`)
    }
    urls.push(actual)
  }
  if (new Set(urls).size !== urls.length) throw new Error('Artifact result contains duplicate public URLs')
}

async function defaultRequest({ url, headers, maxBytes, timeoutMs = REQUEST_TIMEOUT_MS }) {
  return await new Promise((resolvePromise, rejectPromise) => {
    let settled = false
    let timer
    const fail = (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      rejectPromise(error)
    }
    const request = https.request(url, { method: 'GET', headers, agent: false }, (response) => {
      const chunks = []
      let bytes = 0
      response.on('data', (chunk) => {
        bytes += chunk.length
        if (bytes > maxBytes) {
          request.destroy(new Error('Artifact response exceeded its expected byte ceiling'))
          return
        }
        chunks.push(chunk)
      })
      response.on('error', fail)
      response.on('end', () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolvePromise({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) })
      })
    })
    timer = setTimeout(() => request.destroy(new Error('Artifact HTTP verification timed out')), timeoutMs)
    timer.unref?.()
    request.on('error', fail)
    request.end()
  })
}

async function verifyHttpAssets(assets, publicUrls, request) {
  const observations = []
  for (const asset of assets.filter((entry) => entry.access === 'public').sort((a, b) => a.name.localeCompare(b.name))) {
    const url = publicUrls[asset.name]
    const full = await request({
      url,
      headers: { 'accept-encoding': 'identity' },
      maxBytes: asset.byte_size + 1,
      timeoutMs: REQUEST_TIMEOUT_MS,
    })
    const fullMetadata = validateResponseMetadata(full, asset, 200, asset.byte_size, `${asset.name} full GET`)
    if (!Buffer.isBuffer(full.body) || full.body.length !== asset.byte_size) throw new Error(`${asset.name} full GET body size does not match`)
    const fullHash = sha256Bytes(full.body)
    if (fullHash !== asset.sha256) throw new Error(`${asset.name} full GET SHA-256 does not match`)
    const observation = {
      name: asset.name,
      role: asset.role,
      profile: asset.profile,
      url,
      expected_sha256: asset.sha256,
      expected_bytes: asset.byte_size,
      full_get: {
        status: 200,
        bytes: full.body.length,
        sha256: fullHash,
        prefix_sha256: sha256Bytes(full.body.subarray(0, Math.min(1024, full.body.length))),
        content_type: fullMetadata.contentType,
        cache_control: fullMetadata.cacheControl,
        content_encoding: fullMetadata.contentEncoding,
      },
      range_get: null,
    }
    if (asset.role === 'video') {
      const rangeEnd = Math.min(1023, asset.byte_size - 1)
      const rangeLength = rangeEnd + 1
      const ranged = await request({
        url,
        headers: { 'accept-encoding': 'identity', range: `bytes=0-${rangeEnd}` },
        maxBytes: rangeLength + 1,
        timeoutMs: REQUEST_TIMEOUT_MS,
      })
      const rangeMetadata = validateResponseMetadata(ranged, asset, 206, rangeLength, `${asset.name} range GET`)
      const expectedContentRange = `bytes 0-${rangeEnd}/${asset.byte_size}`
      if (header(ranged.headers, 'content-range') !== expectedContentRange) {
        throw new Error(`${asset.name} range GET Content-Range does not match`)
      }
      if (!Buffer.isBuffer(ranged.body) || !ranged.body.equals(full.body.subarray(0, rangeLength))) {
        throw new Error(`${asset.name} range GET bytes do not match the verified object prefix`)
      }
      observation.range_get = {
        request: `bytes=0-${rangeEnd}`,
        status: 206,
        content_range: expectedContentRange,
        bytes: ranged.body.length,
        sha256: sha256Bytes(ranged.body),
        content_type: rangeMetadata.contentType,
        cache_control: rangeMetadata.cacheControl,
        content_encoding: rangeMetadata.contentEncoding,
      }
    }
    observations.push(observation)
  }
  return observations
}

export async function verifyPublication({ releasePacket, marketingCandidate, releaseResult, publicBaseUrl }, {
  request = defaultRequest,
  clock = () => new Date(),
  inputHashes = {},
} = {}) {
  const baseUrl = normalizePublicBaseUrl(publicBaseUrl)
  const { assets, generationFingerprint } = validatePacketAndCandidate(releasePacket, marketingCandidate)
  validateResultShape(releaseResult, 'publication result')
  validatePublicationResultCombination(releaseResult)
  validateResultIdentity(releaseResult, releasePacket, generationFingerprint, assets, baseUrl)
  const observations = await verifyHttpAssets(assets, releaseResult.public_urls, request)
  const acceptancePacket = {
    ...releasePacket,
    accept: { expected_acceptance_version: releaseResult.acceptance_version },
  }
  const receipt = {
    schema: VERIFICATION_SCHEMA,
    outcome: 'passed',
    verified_at: clock().toISOString(),
    public_base_url: baseUrl,
    inputs: {
      release_packet_file_sha256: inputHashes.releasePacket ?? null,
      release_packet_canonical_sha256: canonicalSha256(releasePacket),
      marketing_candidate_file_sha256: inputHashes.marketingCandidate ?? null,
      marketing_candidate_canonical_sha256: canonicalSha256(marketingCandidate),
      publication_result_file_sha256: inputHashes.releaseResult ?? null,
    },
    subject: {
      account_public_id: releaseResult.account_public_id,
      definition_key: releaseResult.definition_key,
      definition_public_id: releaseResult.definition_public_id,
      generation_public_id: releaseResult.generation_public_id,
      generation_fingerprint: generationFingerprint,
      prior_accepted_generation_public_id: releaseResult.accepted_generation_public_id,
      observed_acceptance_version: releaseResult.acceptance_version,
    },
    assets: observations,
    acceptance_request: {
      expected_acceptance_version: releaseResult.acceptance_version,
      canonical_sha256: canonicalSha256(acceptancePacket),
    },
  }
  return { acceptancePacket, verificationReceipt: receipt }
}

function optionalSha256(value, label) {
  if (value === null) return
  exactString(value, SHA256_PATTERN, label)
}

function exactIsoTimestamp(value, label) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} is invalid`)
  }
}

function validateVerificationReceipt(receipt, assets, releasePacket) {
  exactKeys(receipt, VERIFICATION_KEYS, 'publication verification receipt')
  if (receipt.schema !== VERIFICATION_SCHEMA || receipt.outcome !== 'passed') {
    throw new Error('publication verification receipt is not passed')
  }
  exactIsoTimestamp(receipt.verified_at, 'publication verification timestamp')
  const publicBaseUrl = normalizePublicBaseUrl(receipt.public_base_url)
  if (publicBaseUrl !== receipt.public_base_url) throw new Error('publication verification base URL is not canonical')

  exactKeys(receipt.inputs, VERIFICATION_INPUT_KEYS, 'publication verification inputs')
  optionalSha256(receipt.inputs.release_packet_file_sha256, 'release packet file sha256')
  exactString(receipt.inputs.release_packet_canonical_sha256, SHA256_PATTERN, 'release packet canonical sha256')
  optionalSha256(receipt.inputs.marketing_candidate_file_sha256, 'marketing candidate file sha256')
  exactString(receipt.inputs.marketing_candidate_canonical_sha256, SHA256_PATTERN, 'marketing candidate canonical sha256')
  optionalSha256(receipt.inputs.publication_result_file_sha256, 'publication result file sha256')

  exactKeys(receipt.subject, VERIFICATION_SUBJECT_KEYS, 'publication verification subject')
  exactString(receipt.subject.account_public_id, ACCOUNT_PATTERN, 'verification account_public_id')
  exactString(receipt.subject.definition_public_id, DEFINITION_ID_PATTERN, 'verification definition_public_id')
  exactString(receipt.subject.generation_public_id, GENERATION_ID_PATTERN, 'verification generation_public_id')
  exactString(receipt.subject.generation_fingerprint, SHA256_PATTERN, 'verification generation fingerprint')
  if (receipt.subject.definition_key !== 'homepage-iso4') throw new Error('verification definition_key is invalid')
  if (receipt.subject.prior_accepted_generation_public_id !== null) {
    exactString(receipt.subject.prior_accepted_generation_public_id, GENERATION_ID_PATTERN, 'verification prior generation')
  }
  integer(receipt.subject.observed_acceptance_version, 'verification observed acceptance version')

  exactKeys(receipt.acceptance_request, ['expected_acceptance_version', 'canonical_sha256'], 'verification acceptance request')
  integer(receipt.acceptance_request.expected_acceptance_version, 'verification expected acceptance version')
  exactString(receipt.acceptance_request.canonical_sha256, SHA256_PATTERN, 'verification acceptance packet sha256')
  if (receipt.acceptance_request.expected_acceptance_version !== receipt.subject.observed_acceptance_version) {
    throw new Error('verification acceptance version is inconsistent')
  }

  const publicAssets = assets.filter((asset) => asset.access === 'public').sort((a, b) => a.name.localeCompare(b.name))
  if (!Array.isArray(receipt.assets) || receipt.assets.length !== publicAssets.length) {
    throw new Error('verification receipt does not contain every public asset')
  }
  const urls = {}
  for (let index = 0; index < publicAssets.length; index++) {
    const expected = publicAssets[index]
    const asset = object(receipt.assets[index], `verification asset ${index}`)
    exactKeys(asset, VERIFICATION_ASSET_KEYS, `verification asset ${index}`)
    if (asset.name !== expected.name || asset.role !== expected.role || asset.profile !== expected.profile
      || asset.expected_sha256 !== expected.sha256 || asset.expected_bytes !== expected.byte_size) {
      throw new Error(`verification receipt asset does not match generation: ${expected.name}`)
    }
    const expectedObjectKey = [
      'public-artifacts/v1/accounts', releasePacket.account_public_id,
      'definitions', receipt.subject.definition_public_id,
      'generations', receipt.subject.generation_fingerprint,
      `${expected.name}.${EXTENSIONS[expected.content_type]}`,
    ].join('/')
    if (asset.url !== `${publicBaseUrl}/${expectedObjectKey}`) {
      throw new Error(`verification receipt URL does not match generation: ${expected.name}`)
    }
    const full = object(asset.full_get, `verification full GET ${expected.name}`)
    exactKeys(full, VERIFICATION_FULL_GET_KEYS, `verification full GET ${expected.name}`)
    if (full.status !== 200 || full.bytes !== expected.byte_size || full.sha256 !== expected.sha256
      || full.content_type !== expected.content_type || full.content_encoding !== null) {
      throw new Error(`verification receipt contains an incomplete full-GET proof: ${expected.name}`)
    }
    exactString(full.prefix_sha256, SHA256_PATTERN, `verification full GET prefix sha256 ${expected.name}`)
    validateCacheControl(full.cache_control, `verification full GET Cache-Control ${expected.name}`)

    if (expected.role === 'video') {
      const range = object(asset.range_get, `verification range GET ${expected.name}`)
      exactKeys(range, VERIFICATION_RANGE_GET_KEYS, `verification range GET ${expected.name}`)
      const rangeEnd = Math.min(1023, expected.byte_size - 1)
      const rangeBytes = rangeEnd + 1
      if (range.request !== `bytes=0-${rangeEnd}` || range.status !== 206
        || range.content_range !== `bytes 0-${rangeEnd}/${expected.byte_size}`
        || range.bytes !== rangeBytes || range.sha256 !== full.prefix_sha256
        || range.content_type !== expected.content_type || range.content_encoding !== null) {
        throw new Error(`verification receipt contains an incomplete range proof: ${expected.name}`)
      }
      validateCacheControl(range.cache_control, `verification range GET Cache-Control ${expected.name}`)
    } else if (asset.range_get !== null) {
      throw new Error(`verification poster unexpectedly contains a range proof: ${expected.name}`)
    }
    urls[expected.name] = asset.url
  }
  return urls
}

function validateAcceptanceResult(result, acceptancePacket, receipt, assets, verifiedUrls) {
  validateResultShape(result, 'acceptance result')
  const expected = acceptancePacket.accept.expected_acceptance_version
  if (result.account_public_id !== receipt.subject.account_public_id
    || result.definition_key !== receipt.subject.definition_key
    || result.definition_public_id !== receipt.subject.definition_public_id
    || result.generation_public_id !== receipt.subject.generation_public_id
    || result.generation_fingerprint !== receipt.subject.generation_fingerprint
    || result.accepted_generation_public_id !== result.generation_public_id) {
    throw new Error('acceptance result identity does not match the verified generation')
  }
  const accepted = result.acceptance_status
  if (result.publication_status !== 'ready_reused' || result.generation_published !== false
    || result.generation_reused !== true || result.generation_restaged !== false
    || result.outcome !== `ready_${accepted}`) {
    throw new Error('acceptance result publication status is inconsistent')
  }
  const validCas = (accepted === 'accepted' && result.selection_changed === true && result.acceptance_version === expected + 1)
    || (accepted === 'unchanged' && result.selection_changed === false && result.acceptance_version === expected)
    || (accepted === 'already_accepted' && result.selection_changed === false && result.acceptance_version > expected)
  if (!validCas) throw new Error('acceptance result does not contain a valid compare-and-swap outcome')
  if (canonicalJson(result.public_urls) !== canonicalJson(verifiedUrls)) {
    throw new Error('acceptance result public URLs changed after verification')
  }
  validateResultIdentity(result, acceptancePacket, receipt.subject.generation_fingerprint, assets, receipt.public_base_url)
}

export function finalizePromotion({ acceptancePacket, marketingCandidate, verificationReceipt, acceptanceResult }, {
  clock = () => new Date(),
  inputHashes = {},
} = {}) {
  const { assets, generationFingerprint } = validatePacketAndCandidate(acceptancePacket, marketingCandidate, { acceptance: true })
  const verifiedUrls = validateVerificationReceipt(verificationReceipt, assets, acceptancePacket)
  exactKeys(acceptancePacket.accept, ['expected_acceptance_version'], 'acceptance request')
  const expectedVersion = integer(acceptancePacket.accept.expected_acceptance_version, 'expected acceptance version')
  const basePacket = { ...acceptancePacket }
  delete basePacket.accept
  if (canonicalSha256(basePacket) !== verificationReceipt.inputs.release_packet_canonical_sha256
    || canonicalSha256(marketingCandidate) !== verificationReceipt.inputs.marketing_candidate_canonical_sha256
    || canonicalSha256(acceptancePacket) !== verificationReceipt.acceptance_request.canonical_sha256
    || expectedVersion !== verificationReceipt.acceptance_request.expected_acceptance_version
    || generationFingerprint !== verificationReceipt.subject.generation_fingerprint) {
    throw new Error('promotion inputs do not match the publication verification receipt')
  }
  if (inputHashes.marketingCandidate && verificationReceipt.inputs.marketing_candidate_file_sha256
    && inputHashes.marketingCandidate !== verificationReceipt.inputs.marketing_candidate_file_sha256) {
    throw new Error('marketing candidate file changed after publication verification')
  }
  validateAcceptanceResult(acceptanceResult, acceptancePacket, verificationReceipt, assets, verifiedUrls)
  const urls = acceptanceResult.public_urls
  const finalManifest = {
    ...marketingCandidate,
    generation: acceptanceResult.generation_public_id,
    variants: marketingCandidate.variants.map((variant) => ({
      ...variant,
      mp4Url: urls[`${variant.key}-h264`],
      openingPosterUrl: urls[`${variant.key}-opening`],
      terminalPosterUrl: urls[`${variant.key}-terminal`],
    })),
  }
  const promotionReceipt = {
    schema: PROMOTION_SCHEMA,
    outcome: 'passed',
    finalized_at: clock().toISOString(),
    inputs: {
      verification_receipt_file_sha256: inputHashes.verificationReceipt ?? null,
      acceptance_packet_file_sha256: inputHashes.acceptancePacket ?? null,
      acceptance_result_file_sha256: inputHashes.acceptanceResult ?? null,
      marketing_candidate_file_sha256: inputHashes.marketingCandidate ?? null,
    },
    subject: {
      ...verificationReceipt.subject,
      accepted_generation_public_id: acceptanceResult.accepted_generation_public_id,
      acceptance_status: acceptanceResult.acceptance_status,
      acceptance_version: acceptanceResult.acceptance_version,
    },
    final_manifest_sha256: canonicalSha256(finalManifest),
  }
  return { finalManifest, promotionReceipt }
}

async function readJsonFile(path, label) {
  const absolute = resolve(path)
  const info = await lstat(absolute)
  if (!info.isFile() || info.isSymbolicLink() || info.size < 1 || info.size > MAX_JSON_BYTES) {
    throw new Error(`${label} must be one bounded regular non-symlink file`)
  }
  const bytes = await readFile(absolute)
  let value
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new Error(`${label} is not valid JSON`)
  }
  object(value, label)
  return { path: absolute, value, sha256: sha256Bytes(bytes) }
}

function isInside(parent, child) {
  const path = relative(parent, child)
  return path !== '' && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)
}

async function writeNewOutput(output, files) {
  const target = resolve(output)
  if (!isInside(TMP_ROOT, target)) throw new Error(`--output must be a dedicated directory below ${TMP_ROOT}`)
  const staging = `${target}.staging-${process.pid}`
  await mkdir(dirname(target), { recursive: true })
  try {
    await lstat(target)
    throw new Error(`refusing to overwrite existing output: ${target}`)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  await mkdir(staging, { recursive: false })
  try {
    for (const [name, value] of Object.entries(files)) {
      await writeFile(resolve(staging, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
    }
    await rename(staging, target)
  } catch (error) {
    await rm(staging, { recursive: true, force: true })
    throw error
  }
  return target
}

function parseOptions(argv) {
  const [action, ...rest] = argv
  if (!['verify', 'finalize'].includes(action)) throw new Error('first argument must be verify or finalize')
  const values = {}
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index]
    const value = rest[index + 1]
    if (!key?.startsWith('--') || value === undefined || value.startsWith('--')) throw new Error(`invalid CLI option: ${key ?? ''}`)
    const name = key.slice(2).replace(/-([a-z])/g, (_, character) => character.toUpperCase())
    if (Object.hasOwn(values, name)) throw new Error(`duplicate CLI option: ${key}`)
    values[name] = value
  }
  const allowed = action === 'verify'
    ? ['releasePacket', 'marketingCandidate', 'releaseResult', 'publicBaseUrl', 'output']
    : ['acceptancePacket', 'marketingCandidate', 'verificationReceipt', 'acceptResult', 'output']
  const unknown = Object.keys(values).filter((key) => !allowed.includes(key))
  const missing = allowed.filter((key) => !values[key])
  if (unknown.length) throw new Error(`unknown CLI options: ${unknown.join(', ')}`)
  if (missing.length) throw new Error(`missing CLI options: ${missing.join(', ')}`)
  return { action, values }
}

async function runCli(argv) {
  const { action, values } = parseOptions(argv)
  if (action === 'verify') {
    const [packet, candidate, result] = await Promise.all([
      readJsonFile(values.releasePacket, 'release packet'),
      readJsonFile(values.marketingCandidate, 'marketing candidate'),
      readJsonFile(values.releaseResult, 'publication result'),
    ])
    const verified = await verifyPublication({
      releasePacket: packet.value,
      marketingCandidate: candidate.value,
      releaseResult: result.value,
      publicBaseUrl: values.publicBaseUrl,
    }, {
      inputHashes: {
        releasePacket: packet.sha256,
        marketingCandidate: candidate.sha256,
        releaseResult: result.sha256,
      },
    })
    const output = await writeNewOutput(values.output, {
      'publication-verification.json': verified.verificationReceipt,
      'acceptance-request.json': verified.acceptancePacket,
    })
    return { action, output, generation: verified.verificationReceipt.subject.generation_public_id }
  }
  const [packet, candidate, receipt, result] = await Promise.all([
    readJsonFile(values.acceptancePacket, 'acceptance packet'),
    readJsonFile(values.marketingCandidate, 'marketing candidate'),
    readJsonFile(values.verificationReceipt, 'verification receipt'),
    readJsonFile(values.acceptResult, 'acceptance result'),
  ])
  const finalized = finalizePromotion({
    acceptancePacket: packet.value,
    marketingCandidate: candidate.value,
    verificationReceipt: receipt.value,
    acceptanceResult: result.value,
  }, {
    inputHashes: {
      acceptancePacket: packet.sha256,
      marketingCandidate: candidate.sha256,
      verificationReceipt: receipt.sha256,
      acceptanceResult: result.sha256,
    },
  })
  const output = await writeNewOutput(values.output, {
    'marketing-manifest.accepted.json': finalized.finalManifest,
    'promotion-receipt.json': finalized.promotionReceipt,
  })
  return { action, output, generation: finalized.finalManifest.generation }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    const result = await runCli(process.argv.slice(2))
    console.log(JSON.stringify({ schema: CLI_RESULT_SCHEMA, ok: true, ...result }))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    console.log(JSON.stringify({ schema: CLI_RESULT_SCHEMA, ok: false, error: 'iso4_artifact_promotion_failed' }))
    process.exitCode = 1
  }
}
