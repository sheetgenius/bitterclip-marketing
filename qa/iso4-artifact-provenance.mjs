import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { createReadStream } from 'node:fs'
import { lstat } from 'node:fs/promises'
import { resolve } from 'node:path'

export const ISO4_RENDERER_INPUT_SCHEMA = 'bitterclip.iso4-renderer-inputs.v1'

// This is the complete, ordered custody boundary for one ISO4 release bake.
// It deliberately excludes Git metadata: two checkouts with identical bytes
// describe the same cinematic source even when an unrelated commit changed
// the repository HEAD. It also excludes app/lib/hero-iso4/release.ts: that file
// is the mutable production publication pointer and does not affect the live
// authoring canvas captured by the baker. Hashing it would make publication of
// generation N invalidate otherwise identical generation N+1. Additions here
// are binding release-contract changes.
export const ISO4_REQUIRED_RENDERER_INPUTS = Object.freeze([
  { path: 'app/app.vue', role: 'source' },
  { path: 'app/assets/css/main.css', role: 'source' },
  { path: 'app/components/HeroIso4.vue', role: 'source' },
  { path: 'app/layouts/default.vue', role: 'source' },
  { path: 'app/lib/hero-iso4/scene.ts', role: 'source' },
  { path: 'app/pages/index.vue', role: 'source' },
  { path: 'bun.lock', role: 'dependency' },
  { path: 'nuxt.config.ts', role: 'dependency' },
  { path: 'package.json', role: 'dependency' },
  { path: 'public/clips/ep1-john.jpg', role: 'media' },
  { path: 'public/clips/ep1-john2.jpg', role: 'media' },
  { path: 'public/clips/ep1-loop.mp4', role: 'media' },
  { path: 'public/clips/ep1-michael.jpg', role: 'media' },
  { path: 'qa/iso4-artifact-bake.mjs', role: 'dependency' },
  { path: 'qa/iso4-artifact-encode.mjs', role: 'dependency' },
  { path: 'qa/iso4-artifact-packet.mjs', role: 'dependency' },
  { path: 'qa/iso4-artifact-provenance.mjs', role: 'dependency' },
].map((entry) => Object.freeze(entry)))

export const ISO4_LIVE_MEDIA_PATH = 'public/clips/ep1-loop.mp4'

const SHA256_PATTERN = /^[a-f0-9]{64}$/

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]))
  }
  return value
}

function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value))
}

function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

async function sha256(path) {
  const hash = createHash('sha256')
  const stream = createReadStream(path)
  stream.on('data', (chunk) => hash.update(chunk))
  await once(stream, 'end')
  return hash.digest('hex')
}

function normalizedEntry(raw, label) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`${label} must be one file receipt`)
  }
  const path = String(raw.repositoryPath ?? raw.path ?? '')
  const role = String(raw.role ?? '')
  const byteSize = Number(raw.byte_size ?? raw.bytes)
  const digest = String(raw.sha256 ?? '')
  if (!path || path.startsWith('/') || path.includes('\\') || path.split('/').includes('..')) {
    throw new Error(`${label} has an invalid repository path`)
  }
  if (!['source', 'media', 'dependency'].includes(role)) {
    throw new Error(`${label} has an invalid role`)
  }
  if (!Number.isSafeInteger(byteSize) || byteSize < 1) {
    throw new Error(`${label} has an invalid byte size`)
  }
  if (!SHA256_PATTERN.test(digest)) {
    throw new Error(`${label} has an invalid SHA-256 digest`)
  }
  return { path, role, byte_size: byteSize, sha256: digest }
}

function normalizedFiles(entries) {
  if (!Array.isArray(entries)) throw new Error('renderer input files must be one array')
  const files = entries
    .map((entry, index) => normalizedEntry(entry, `renderer input ${index}`))
    .sort((a, b) => a.path.localeCompare(b.path))
  const required = [...ISO4_REQUIRED_RENDERER_INPUTS]
    .sort((a, b) => a.path.localeCompare(b.path))
  if (files.length !== required.length) {
    throw new Error(`renderer input set has ${files.length} files; expected ${required.length}`)
  }
  for (let index = 0; index < required.length; index++) {
    const expected = required[index]
    const actual = files[index]
    if (actual.path !== expected.path || actual.role !== expected.role) {
      throw new Error(
        `renderer input set differs at ${index}: expected ${expected.role}:${expected.path}; `
        + `received ${actual.role}:${actual.path}`,
      )
    }
  }
  return files
}

export function rendererInputReceiptFromEntries(entries) {
  const files = normalizedFiles(entries)
  const content = { schema: ISO4_RENDERER_INPUT_SCHEMA, files }
  return {
    ...content,
    contentSha256: sha256Buffer(Buffer.from(canonicalJson(content))),
  }
}

export function validateRendererInputReceipt(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('bake renderer-input receipt is missing')
  }
  if (value.schema !== ISO4_RENDERER_INPUT_SCHEMA) {
    throw new Error('unsupported bake renderer-input receipt schema')
  }
  const normalized = rendererInputReceiptFromEntries(value.files)
  if (String(value.contentSha256 ?? '') !== normalized.contentSha256) {
    throw new Error('bake renderer-input content hash does not match its file receipts')
  }
  return normalized
}

export async function captureRendererInputReceipt(repoRoot) {
  const entries = []
  for (const required of ISO4_REQUIRED_RENDERER_INPUTS) {
    const path = resolve(repoRoot, required.path)
    const info = await lstat(path)
    if (!info.isFile() || info.isSymbolicLink() || info.size < 1) {
      throw new Error(`required renderer input is not one nonempty regular file: ${required.path}`)
    }
    entries.push({
      ...required,
      byte_size: info.size,
      sha256: await sha256(path),
    })
  }
  return rendererInputReceiptFromEntries(entries)
}
