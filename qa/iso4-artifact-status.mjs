#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  captureRendererInputReceipt,
  validateRendererInputReceipt,
} from './iso4-artifact-provenance.mjs'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const ACCEPTED_PATH = resolve(REPO_ROOT, 'config/iso4-accepted-renderer-inputs.json')
const RELEASE_PATH = resolve(REPO_ROOT, 'app/lib/hero-iso4/release.ts')
const ACCEPTED_SCHEMA = 'bitterclip.iso4-accepted-renderer-inputs.v1'
const RESULT_SCHEMA = 'bitterclip.iso4-artifact-status.v1'
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const GENERATION_PATTERN = /^artg_[a-z0-9]{20}$/
const DEFINITION_PATTERN = /^artd_[a-z0-9]{20}$/

function parseOptions(argv) {
  const options = new Set(argv.filter((argument) => argument !== '--'))
  const allowed = new Set(['--json', '--require-clean'])
  const unknown = [...options].filter((argument) => !allowed.has(argument))
  if (unknown.length) throw new Error(`unknown options: ${unknown.join(', ')}`)
  return {
    json: options.has('--json'),
    requireClean: options.has('--require-clean'),
  }
}

function acceptedMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('accepted renderer-input record must be an object')
  }
  if (value.schema !== ACCEPTED_SCHEMA) throw new Error('unsupported accepted renderer-input schema')
  if (!GENERATION_PATTERN.test(value.generationPublicId ?? '')) throw new Error('accepted generation id is invalid')
  if (!DEFINITION_PATTERN.test(value.definitionPublicId ?? '')) throw new Error('accepted definition id is invalid')
  if (!SHA256_PATTERN.test(value.generationFingerprint ?? '')) throw new Error('accepted generation fingerprint is invalid')
  if (!/^[a-f0-9]{40}$/.test(value.sourceRevision ?? '')) throw new Error('accepted source revision is invalid')
  if (!Number.isFinite(Date.parse(value.acceptedAt ?? ''))) throw new Error('accepted timestamp is invalid')
  return {
    schema: value.schema,
    acceptedAt: value.acceptedAt,
    sourceRevision: value.sourceRevision,
    definitionPublicId: value.definitionPublicId,
    generationPublicId: value.generationPublicId,
    generationFingerprint: value.generationFingerprint,
    rendererInputs: validateRendererInputReceipt(value.rendererInputs),
  }
}

function diffReceipts(accepted, current) {
  const before = new Map(accepted.files.map((file) => [file.path, file]))
  const after = new Map(current.files.map((file) => [file.path, file]))
  const added = [...after.keys()].filter((path) => !before.has(path)).sort()
  const removed = [...before.keys()].filter((path) => !after.has(path)).sort()
  const changed = [...after.keys()]
    .filter((path) => before.has(path) && (
      before.get(path).sha256 !== after.get(path).sha256
      || before.get(path).byte_size !== after.get(path).byte_size
      || before.get(path).role !== after.get(path).role
    ))
    .sort()
  return { added, changed, removed }
}

function renderHuman(result) {
  const lines = [
    `ISO4 Artifact inputs: ${result.status.toUpperCase()}`,
    `accepted generation: ${result.accepted.generationPublicId}`,
    `accepted input hash: ${result.accepted.rendererInputsSha256}`,
    `current input hash:  ${result.current.rendererInputsSha256}`,
  ]
  if (result.status === 'clean') {
    lines.push('No release bake is needed for the declared renderer inputs.')
  } else {
    lines.push('A deliberate ISO4 release is needed before current source can be claimed as the production movie.')
    for (const category of ['changed', 'added', 'removed']) {
      for (const path of result.diff[category]) lines.push(`${category}: ${path}`)
    }
  }
  lines.push('Ordinary site deploys continue to reuse the selected immutable generation.')
  return lines.join('\n')
}

async function main() {
  const options = parseOptions(process.argv.slice(2))
  const accepted = acceptedMetadata(JSON.parse(await readFile(ACCEPTED_PATH, 'utf8')))
  const releaseSource = await readFile(RELEASE_PATH, 'utf8')
  if (!releaseSource.includes(`generation: '${accepted.generationPublicId}'`)
    || !releaseSource.includes(`definitionFingerprint: '${accepted.generationFingerprint}'`)) {
    throw new Error('accepted renderer-input record does not match the selected production release')
  }

  const current = await captureRendererInputReceipt(REPO_ROOT)
  const diff = diffReceipts(accepted.rendererInputs, current)
  const clean = current.contentSha256 === accepted.rendererInputs.contentSha256
    && diff.added.length === 0
    && diff.changed.length === 0
    && diff.removed.length === 0
  const result = {
    schema: RESULT_SCHEMA,
    status: clean ? 'clean' : 'dirty',
    accepted: {
      acceptedAt: accepted.acceptedAt,
      sourceRevision: accepted.sourceRevision,
      definitionPublicId: accepted.definitionPublicId,
      generationPublicId: accepted.generationPublicId,
      generationFingerprint: accepted.generationFingerprint,
      rendererInputsSha256: accepted.rendererInputs.contentSha256,
    },
    current: {
      rendererInputsSha256: current.contentSha256,
    },
    diff,
    ordinaryDeployAction: 'reuse-selected-generation',
    releaseAction: clean ? 'reuse-accepted-generation' : 'render-or-reconcile-before-promotion',
  }

  console.log(options.json ? JSON.stringify(result, null, 2) : renderHuman(result))
  if (options.requireClean && !clean) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
