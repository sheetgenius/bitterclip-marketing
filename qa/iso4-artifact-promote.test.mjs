import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import {
  ISO4_VARIANT_CONTRACTS,
  canonicalJson,
  finalizePromotion,
  verifyPublication,
} from './iso4-artifact-promote.mjs'

const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const baseUrl = 'https://media.example.test/base'

function fixture() {
  const bodies = {}
  const assets = []
  const variants = []
  const renderVariants = []
  for (const contract of ISO4_VARIANT_CONTRACTS) {
    const video = Buffer.from(`ftyp-${contract.key}-homepage-video`)
    const opening = Buffer.from(`webp-${contract.key}-opening`)
    const terminal = Buffer.from(`webp-${contract.key}-terminal`)
    const entries = [
      [`${contract.key}-h264`, 'video', 'video/mp4', video],
      [`${contract.key}-opening`, 'opening_poster', 'image/webp', opening],
      [`${contract.key}-terminal`, 'terminal_poster', 'image/webp', terminal],
    ]
    for (const [name, role, contentType, body] of entries) {
      bodies[name] = body
      assets.push({
        name,
        role,
        profile: contract.key,
        content_type: contentType,
        sha256: sha256(body),
        byte_size: body.length,
        access: 'public',
        width: contract.width,
        height: contract.height,
        ...(role === 'video' ? { frame_rate: '60/1', codec: 'h264' } : {}),
      })
    }
    variants.push({
      ...contract,
      mp4Url: '',
      mp4Sha256: sha256(video),
      mp4Bytes: video.length,
      openingPosterUrl: '',
      openingPosterSha256: sha256(opening),
      terminalPosterUrl: '',
      terminalPosterSha256: sha256(terminal),
    })
    renderVariants.push({
      profile: contract.key,
      media_query: contract.media,
      width: contract.width,
      height: contract.height,
      dpr: 1,
      h264_crf: 18,
    })
  }
  const source = Buffer.from('private-source-bundle')
  bodies['source-bundle'] = source
  assets.push({
    name: 'source-bundle',
    role: 'source_bundle',
    profile: 'source',
    content_type: 'application/gzip',
    sha256: sha256(source),
    byte_size: source.length,
    access: 'private',
  })
  assets.sort((a, b) => a.name.localeCompare(b.name))
  const generation = {
    schema: 'bitterclip.artifact_generation_manifest.v1',
    source: { sha256: sha256(source), revision: `marketing.iso4.${'a'.repeat(64)}` },
    renderer: { key: 'iso4.playwright', version: 'iso4-artifact-bake.v1' },
    duration_ms: 14_367,
    render_contract: {
      fps: 60,
      non_looping: true,
      terminal_state_ms: 14_008,
      terminal_frame: 841,
      terminal_hold_frames: 21,
      frame_count: 862,
      pixel_format: 'yuv420p',
      color_space: 'bt709',
      color_range: 'limited',
      poster_origin: 'selected_h264_decode',
      poster_profile: 'lossless',
      input_media_sha256: 'b'.repeat(64),
      renderer_inputs_sha256: 'c'.repeat(64),
      renderer_contract_sha256: 'd'.repeat(64),
      variants: renderVariants,
    },
    assets,
  }
  const fingerprint = sha256(canonicalJson(generation))
  const releasePacket = {
    schema: 'bitterclip.artifact_release_packet.v1',
    account_public_id: 'acct_00000000000000000000',
    definition: {
      definition_key: 'homepage-iso4',
      name: 'ISO4 homepage cinematic',
      description: 'A programmable scene baked into immutable responsive video.',
    },
    generation,
    asset_paths: Object.fromEntries(assets.map((asset) => [asset.name, `/release/${asset.name}`])),
  }
  const candidate = {
    schema: 'bitterclip.programmable_artifact_generation.v1',
    artifactId: 'homepage-iso4',
    generation: null,
    definitionFingerprint: fingerprint,
    sceneDurationMs: 14_008,
    durationMs: 14_367,
    fps: 60,
    frameCount: 862,
    terminalFrame: 841,
    variants,
  }
  const ids = {
    definition: 'artd_00000000000000000000',
    generation: 'artg_00000000000000000000',
  }
  const publicUrls = Object.fromEntries(assets.filter((asset) => asset.access === 'public').map((asset) => [
    asset.name,
    `${baseUrl}/public-artifacts/v1/accounts/${releasePacket.account_public_id}/definitions/${ids.definition}/generations/${fingerprint}/${asset.name}.${asset.content_type === 'video/mp4' ? 'mp4' : 'webp'}`,
  ]))
  const releaseResult = {
    schema: 'bitterclip.artifact_release_result.v1',
    action: 'release',
    ok: true,
    outcome: 'published',
    account_public_id: releasePacket.account_public_id,
    definition_public_id: ids.definition,
    definition_key: 'homepage-iso4',
    generation_public_id: ids.generation,
    generation_fingerprint: fingerprint,
    generation_status: 'ready',
    generation_reused: false,
    generation_restaged: false,
    generation_published: true,
    publication_status: 'published',
    public_urls: publicUrls,
    accepted_generation_public_id: null,
    acceptance_version: 0,
    selection_changed: false,
    acceptance_status: 'not_requested',
  }
  return { bodies, releasePacket, candidate, releaseResult, fingerprint, publicUrls, ids }
}

function transportFor(fixture, mutate = () => {}) {
  const requests = []
  const request = async ({ url, headers }) => {
    const name = Object.entries(fixture.publicUrls).find(([, value]) => value === url)?.[0]
    assert.ok(name, `unexpected URL ${url}`)
    const fullBody = fixture.bodies[name]
    const range = headers.range
    const body = range ? fullBody.subarray(0, Math.min(1024, fullBody.length)) : fullBody
    const response = {
      status: range ? 206 : 200,
      headers: {
        'content-length': String(body.length),
        'content-type': name.endsWith('-h264') ? 'video/mp4' : 'image/webp',
        'cache-control': 'public, max-age=31536000, immutable',
        ...(range ? { 'content-range': `bytes 0-${body.length - 1}/${fullBody.length}` } : {}),
      },
      body: Buffer.from(body),
    }
    mutate({ name, url, headers, response })
    requests.push({ name, range: range ?? null })
    return response
  }
  return { request, requests }
}

async function verifiedFixture(mutate) {
  const data = fixture()
  const transport = transportFor(data, mutate)
  const verified = await verifyPublication({
    releasePacket: data.releasePacket,
    marketingCandidate: data.candidate,
    releaseResult: data.releaseResult,
    publicBaseUrl: baseUrl,
  }, { request: transport.request, clock: () => new Date('2026-08-23T12:00:00Z') })
  return { ...data, ...transport, ...verified }
}

test('canonical JSON is key-order invariant', () => {
  assert.equal(canonicalJson({ z: 1, a: { y: 2, x: 3 } }), canonicalJson({ a: { x: 3, y: 2 }, z: 1 }))
})

test('verify proves every full body, proves only video ranges, and emits an exact CAS packet', async () => {
  const value = await verifiedFixture()
  assert.deepEqual(value.acceptancePacket.accept, { expected_acceptance_version: 0 })
  assert.equal(value.verificationReceipt.subject.generation_fingerprint, value.fingerprint)
  assert.equal(value.verificationReceipt.assets.length, 18)
  assert.equal(value.requests.filter((entry) => !entry.range).length, 18)
  assert.equal(value.requests.filter((entry) => entry.range).length, 6)
  assert.ok(value.verificationReceipt.assets.filter((entry) => entry.role === 'video').every((entry) => entry.range_get.status === 206))
})

test('verify accepts an immutable ready-generation reuse without pretending it was uploaded', async () => {
  const data = fixture()
  data.releaseResult.outcome = 'ready_reused'
  data.releaseResult.publication_status = 'ready_reused'
  data.releaseResult.generation_published = false
  data.releaseResult.generation_reused = true
  const transport = transportFor(data)
  const verified = await verifyPublication({
    releasePacket: data.releasePacket,
    marketingCandidate: data.candidate,
    releaseResult: data.releaseResult,
    publicBaseUrl: baseUrl,
  }, { request: transport.request })
  assert.equal(verified.verificationReceipt.outcome, 'passed')
})

test('verify rejects inconsistent published and ready-reused result combinations before HTTP', async (context) => {
  const cases = [
    ['published without publication effect', (result) => { result.generation_published = false }],
    ['restaged without reuse', (result) => { result.generation_restaged = true }],
    ['ready reuse without reused generation', (result) => {
      result.outcome = 'ready_reused'
      result.publication_status = 'ready_reused'
      result.generation_published = false
    }],
    ['ready reuse marked restaged', (result) => {
      result.outcome = 'ready_reused'
      result.publication_status = 'ready_reused'
      result.generation_published = false
      result.generation_reused = true
      result.generation_restaged = true
    }],
  ]
  for (const [label, mutate] of cases) {
    await context.test(label, async () => {
      const data = fixture()
      mutate(data.releaseResult)
      let requests = 0
      await assert.rejects(() => verifyPublication({
        releasePacket: data.releasePacket,
        marketingCandidate: data.candidate,
        releaseResult: data.releaseResult,
        publicBaseUrl: baseUrl,
      }, { request: async () => { requests += 1 } }), /status is inconsistent/)
      assert.equal(requests, 0)
    })
  }
})

test('verify rejects fingerprint, URL, full-body, cache, and range corruption', async (context) => {
  const cases = [
    ['fingerprint', (data) => { data.releaseResult.generation_fingerprint = 'f'.repeat(64) }, null, /identity/],
    ['URL', (data) => { data.releaseResult.public_urls.mobile_h264 = 'https://evil.test/latest.mp4' }, null, /public_urls|URL/],
    ['body hash', () => {}, ({ name, response }) => { if (name === 'mobile-opening') response.body[0] ^= 1 }, /SHA-256/],
    ['cache', () => {}, ({ name, response }) => { if (name === 'mobile-opening') response.headers['cache-control'] = 'no-store' }, /immutable cache/],
    ['cache extension', () => {}, ({ name, response }) => { if (name === 'mobile-opening') response.headers['cache-control'] += ', s-maxage=31536000' }, /immutable cache/],
    ['identity encoding header', () => {}, ({ name, response }) => { if (name === 'mobile-opening') response.headers['content-encoding'] = 'identity' }, /must be absent/],
    ['range status', () => {}, ({ name, headers, response }) => { if (name === 'mobile-h264' && headers.range) response.status = 200 }, /expected 206/],
    ['range bytes', () => {}, ({ name, headers, response }) => { if (name === 'mobile-h264' && headers.range) response.body[0] ^= 1 }, /verified object prefix/],
  ]
  for (const [label, mutateData, mutateResponse, pattern] of cases) {
    await context.test(label, async () => {
      const data = fixture()
      mutateData(data)
      const transport = transportFor(data, mutateResponse ?? (() => {}))
      await assert.rejects(() => verifyPublication({
        releasePacket: data.releasePacket,
        marketingCandidate: data.candidate,
        releaseResult: data.releaseResult,
        publicBaseUrl: baseUrl,
      }, { request: transport.request }), pattern)
    })
  }
})

test('verify rejects acceptance-before-verification and an incomplete responsive family', async () => {
  const data = fixture()
  data.releaseResult.acceptance_status = 'accepted'
  data.releaseResult.selection_changed = true
  const transport = transportFor(data)
  await assert.rejects(() => verifyPublication({
    releasePacket: data.releasePacket,
    marketingCandidate: data.candidate,
    releaseResult: data.releaseResult,
    publicBaseUrl: baseUrl,
  }, { request: transport.request }), /before requesting acceptance/)

  const incomplete = fixture()
  incomplete.candidate.variants.pop()
  const incompleteTransport = transportFor(incomplete)
  await assert.rejects(() => verifyPublication({
    releasePacket: incomplete.releasePacket,
    marketingCandidate: incomplete.candidate,
    releaseResult: incomplete.releaseResult,
    publicBaseUrl: baseUrl,
  }, { request: incompleteTransport.request }), /exact responsive family/)
})

test('verify rejects schema drift before making an HTTP request', async (context) => {
  const cases = [
    ['unknown packet key', (data) => { data.releasePacket.extra = true }, /unknown keys/],
    ['missing source profile', (data) => {
      delete data.releasePacket.generation.assets.find((asset) => asset.name === 'source-bundle').profile
    }, /missing keys/],
    ['non-boolean result field', (data) => { data.releaseResult.generation_reused = 'false' }, /must be boolean/],
  ]
  for (const [label, mutate, pattern] of cases) {
    await context.test(label, async () => {
      const data = fixture()
      mutate(data)
      let requests = 0
      await assert.rejects(() => verifyPublication({
        releasePacket: data.releasePacket,
        marketingCandidate: data.candidate,
        releaseResult: data.releaseResult,
        publicBaseUrl: baseUrl,
      }, { request: async () => { requests += 1 } }), pattern)
      assert.equal(requests, 0)
    })
  }
})

function acceptanceResult(value, status = 'accepted') {
  const result = {
    ...value.releaseResult,
    outcome: `ready_${status}`,
    publication_status: 'ready_reused',
    generation_published: false,
    generation_reused: true,
    accepted_generation_public_id: value.ids.generation,
    acceptance_status: status,
    selection_changed: status === 'accepted',
    acceptance_version: status === 'unchanged' ? 0 : 1,
  }
  return result
}

test('finalize binds the accepted result into all six marketing variants', async () => {
  const value = await verifiedFixture()
  const accepted = acceptanceResult(value)
  const finalized = finalizePromotion({
    acceptancePacket: value.acceptancePacket,
    marketingCandidate: value.candidate,
    verificationReceipt: value.verificationReceipt,
    acceptanceResult: accepted,
  }, { clock: () => new Date('2026-08-23T12:01:00Z') })
  assert.equal(finalized.finalManifest.generation, value.ids.generation)
  assert.equal(finalized.finalManifest.variants.length, 6)
  for (const variant of finalized.finalManifest.variants) {
    assert.equal(variant.mp4Url, value.publicUrls[`${variant.key}-h264`])
    assert.equal(variant.openingPosterUrl, value.publicUrls[`${variant.key}-opening`])
    assert.equal(variant.terminalPosterUrl, value.publicUrls[`${variant.key}-terminal`])
  }
  assert.equal(finalized.promotionReceipt.subject.acceptance_status, 'accepted')
})

test('finalize accepts unchanged and lost-response already-accepted CAS receipts', async (context) => {
  for (const status of ['unchanged', 'already_accepted']) {
    await context.test(status, async () => {
      const value = await verifiedFixture()
      const accepted = acceptanceResult(value, status)
      if (status === 'already_accepted') accepted.acceptance_version = 2
      const finalized = finalizePromotion({
        acceptancePacket: value.acceptancePacket,
        marketingCandidate: value.candidate,
        verificationReceipt: value.verificationReceipt,
        acceptanceResult: accepted,
      })
      assert.equal(finalized.finalManifest.generation, value.ids.generation)
    })
  }
})

test('finalize rejects wrong selection, bad CAS math, URL drift, and changed candidate', async (context) => {
  const cases = [
    ['wrong selection', (value, result) => { result.accepted_generation_public_id = 'artg_11111111111111111111' }, /identity/],
    ['bad CAS', (_value, result) => { result.acceptance_version = 0 }, /compare-and-swap/],
    ['URL drift', (_value, result) => { result.public_urls['mobile-h264'] += '?changed=1' }, /public URLs changed/],
    ['changed candidate', (value) => { value.candidate.variants[0].mp4Bytes += 1 }, /verification receipt|generation asset/],
  ]
  for (const [label, mutate, pattern] of cases) {
    await context.test(label, async () => {
      const value = await verifiedFixture()
      const result = acceptanceResult(value)
      mutate(value, result)
      assert.throws(() => finalizePromotion({
        acceptancePacket: value.acceptancePacket,
        marketingCandidate: value.candidate,
        verificationReceipt: value.verificationReceipt,
        acceptanceResult: result,
      }), pattern)
    })
  }
})

test('finalize revalidates the complete full-GET and range receipt', async (context) => {
  const cases = [
    ['unknown receipt field', (asset) => { asset.full_get.extra = true }, /unknown keys/],
    ['full content type', (asset) => { asset.full_get.content_type = 'application/octet-stream' }, /full-GET proof/],
    ['full cache', (asset) => { asset.full_get.cache_control = 'private, no-store' }, /immutable cache/],
    ['full cache extension', (asset) => { asset.full_get.cache_control += ', s-maxage=31536000' }, /immutable cache/],
    ['full encoding', (asset) => { asset.full_get.content_encoding = 'gzip' }, /full-GET proof/],
    ['full hash', (asset) => { asset.full_get.sha256 = 'f'.repeat(64) }, /full-GET proof/],
    ['range request', (asset) => { asset.range_get.request = 'bytes=1-10' }, /range proof/],
    ['range Content-Range', (asset) => { asset.range_get.content_range = 'bytes 1-10/20' }, /range proof/],
    ['range bytes', (asset) => { asset.range_get.bytes += 1 }, /range proof/],
    ['range hash', (asset) => { asset.range_get.sha256 = 'f'.repeat(64) }, /range proof/],
    ['range content type', (asset) => { asset.range_get.content_type = 'application/octet-stream' }, /range proof/],
    ['range cache', (asset) => { asset.range_get.cache_control = 'no-cache' }, /immutable cache/],
    ['range encoding', (asset) => { asset.range_get.content_encoding = 'gzip' }, /range proof/],
  ]
  for (const [label, mutate, pattern] of cases) {
    await context.test(label, async () => {
      const value = await verifiedFixture()
      const video = value.verificationReceipt.assets.find((asset) => asset.name === 'mobile-h264')
      mutate(video)
      assert.throws(() => finalizePromotion({
        acceptancePacket: value.acceptancePacket,
        marketingCandidate: value.candidate,
        verificationReceipt: value.verificationReceipt,
        acceptanceResult: acceptanceResult(value),
      }), pattern)
    })
  }
})

test('finalize rejects inconsistent ready-reused acceptance status', async () => {
  const value = await verifiedFixture()
  const result = acceptanceResult(value)
  result.generation_restaged = true
  assert.throws(() => finalizePromotion({
    acceptancePacket: value.acceptancePacket,
    marketingCandidate: value.candidate,
    verificationReceipt: value.verificationReceipt,
    acceptanceResult: result,
  }), /publication status is inconsistent/)
})
